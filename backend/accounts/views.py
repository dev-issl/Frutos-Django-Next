from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .models import UserProfile, Address, Notification
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserReadSerializer,
    ProfileUpdateSerializer,
    AvatarUpdateSerializer,
    AddressSerializer,
    NotificationSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


# ─── Register ─────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/"""
    permission_classes = [permissions.AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        refresh['name']  = getattr(user, 'full_name', None) or getattr(user, 'name', None) or user.email
        refresh['email'] = user.email
        refresh['username'] = user.email
        refresh['avatar'] = ''

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserReadSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    """POST /api/auth/login/  — returns access + refresh + user object"""
    permission_classes = [permissions.AllowAny]
    serializer_class   = CustomTokenObtainPairSerializer


# ─── Logout ───────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """POST /api/auth/logout/  — blacklists refresh token"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


# ─── Profile — GET / PATCH ────────────────────────────────────────────────────

class ProfileView(APIView):
    """
    GET   /api/auth/profile/  — return current user's full profile
    PATCH /api/auth/profile/  — update name, phone, bio, notification prefs
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserReadSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)

        #  DB থেকে fresh user fetch করো — cached stale profile বাদ দাও
        fresh_user = User.objects.select_related('profile').get(pk=request.user.pk)
        return Response(UserReadSerializer(fresh_user, context={'request': request}).data)


# ─── Avatar Upload ────────────────────────────────────────────────────────────

class AvatarUploadView(APIView):
    """POST /api/auth/avatar/  — multipart/form-data, field: avatar"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = AvatarUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'avatar': request.build_absolute_uri(profile.avatar.url) if profile.avatar else '',
        })


# ─── Change Password ──────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password changed successfully.'})


# ─── Addresses ────────────────────────────────────────────────────────────────

class AddressListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/addresses/  — list user's addresses
    POST /api/auth/addresses/  — add new address
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/auth/addresses/<id>/
    PATCH  /api/auth/addresses/<id>/
    DELETE /api/auth/addresses/<id>/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


# ─── Order History ────────────────────────────────────────────────────────────

class UserOrderHistoryView(generics.ListAPIView):
    """GET /api/auth/orders/  — current user's orders, newest first"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        from orders.models import Order
        from orders.serializers import OrderReadSerializer

        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related('items__product')
            .order_by('-ordered_at')
        )
        serializer = OrderReadSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)


# ─── Notifications — list ─────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    """GET /api/auth/notifications/?unread=true"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(is_read=False)
        return qs[:50]  # latest 50


# ─── Notification — delete single ────────────────────────────────────────────

class NotificationDeleteView(APIView):
    """DELETE /api/auth/notifications/<id>/  — delete a single notification"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )


# ─── Notifications — mark read ────────────────────────────────────────────────

class NotificationMarkReadView(APIView):
    """POST /api/auth/notifications/mark-read/  body: {ids: [1,2,3]} or {all: true}"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.data.get('all'):
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        else:
            ids = request.data.get('ids', [])
            Notification.objects.filter(user=request.user, id__in=ids).update(is_read=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unreadCount': unread_count})


# ─── Notifications — unread count ────────────────────────────────────────────

class UnreadCountView(APIView):
    """GET /api/auth/notifications/unread-count/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unreadCount': count})


# ─── Notifications — Server-Sent Events (real-time push) ─────────────────────

import json as _json
import time as _time
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@require_GET
def notification_stream(request):
    """
    GET /api/auth/notifications/stream/?token=<access_token>
    Plain Django view (not DRF) — avoids 406 from content negotiation.
    JWT accepted as query-param; EventSource cannot send custom headers.
    """
    from rest_framework_simplejwt.tokens import AccessToken
    from django.http import HttpResponse as _HR

    token_str = request.GET.get('token', '')
    try:
        tok  = AccessToken(token_str)
        User = get_user_model()
        user = User.objects.get(pk=tok['user_id'])
    except Exception:
        return _HR('Unauthorized', status=401)

    def event_stream():
        sent_ids = set(
            Notification.objects.filter(user=user)
            .values_list('id', flat=True)
        )
        tick = 0
        while True:
            new_notifs = (
                Notification.objects
                .filter(user=user)
                .exclude(id__in=sent_ids)
                .order_by('id')
            )
            for n in new_notifs:
                sent_ids.add(n.id)
                payload = {
                    'id':         n.id,
                    'type':       n.type,
                    'title':      n.title,
                    'message':    n.message,
                    'isRead':     n.is_read,
                    'icon':       n.icon,
                    'metadata':   n.metadata,
                    'created_at': n.created_at.isoformat(),
                }
                yield f"data: {_json.dumps(payload, ensure_ascii=True)}\n\n"

            tick += 1
            if tick % 5 == 0:
                yield ": heartbeat\n\n"
            _time.sleep(1)

    resp = StreamingHttpResponse(event_stream(), content_type='text/event-stream; charset=utf-8')
    resp['Cache-Control']     = 'no-cache'
    resp['X-Accel-Buffering'] = 'no'
    return resp


# Keep a dummy class alias so the URL still works if referenced elsewhere
class NotificationStreamView:
    pass


import random
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetOTP

class SendPasswordResetOTPView(APIView):
    """POST /api/auth/password-reset/send-otp/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # User exists check
        if not User.objects.filter(email__iexact=email).exists():
            # Security: same response even if not found
            return Response({'detail': 'If this email exists, an OTP has been sent.'})

        otp = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.filter(email=email).delete()  # old OTPs clear
        PasswordResetOTP.objects.create(email=email, otp=otp)

        send_mail(
            subject='El Árbol — Password Reset OTP',
            message=f'Your OTP is: {otp}\n\nValid for 10 minutes. Do not share this with anyone.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'detail': 'OTP sent successfully.'})


class VerifyOTPAndResetPasswordView(APIView):
    """POST /api/auth/password-reset/verify/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        otp      = request.data.get('otp', '').strip()
        password = request.data.get('password', '')

        if not all([email, otp, password]):
            return Response({'detail': 'Email, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = PasswordResetOTP.objects.filter(email=email, otp=otp, is_used=False).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not record.is_valid():
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            user.set_password(password)
            user.save()
            record.is_used = True
            record.save()
            return Response({'detail': 'Password reset successful.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)





# for dashboard API endpoints, see dashboard/api_views.py
from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

User = get_user_model()

# class AdminUserListView(APIView):
#     """
#     GET  /api/auth/admin/users/   — সব user list (normal + wholesale)
#     POST /api/auth/admin/users/   — নতুন user create
#     """
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request):
#         # শুধু ADMIN/SELLER/VENDOR access পাবে
#         if not request.user.user_type in ['ADMIN', 'SELLER']:
#             return Response({'detail': 'Forbidden'}, status=403)

#         search    = request.GET.get('search', '')
#         page      = int(request.GET.get('page', 1))
#         page_size = int(request.GET.get('page_size', 20))

#         qs = User.objects.select_related('profile').order_by('-date_joined')

#         if search:
#             from django.db.models import Q
#             qs = qs.filter(
#                 Q(email__icontains=search) |
#                 Q(name__icontains=search)
#             )

#         total = qs.count()
#         start = (page - 1) * page_size
#         users = qs[start:start + page_size]

#         data = []
#         for u in users:
#             # Wholesale user কিনা check করো
#             is_wholesale = hasattr(u, 'wholesale_profile')
#             data.append({
#                 'id':          u.id,
#                 'name':        getattr(u, 'name', '') or u.email,
#                 'email':       u.email,
#                 'user_type':   getattr(u, 'user_type', 'CUSTOMER'),
#                 'is_active':   u.is_active,
#                 'date_joined': u.date_joined,
#                 'phone':       getattr(u.profile, 'phone', '') if hasattr(u, 'profile') else '',
#                 'is_wholesale': is_wholesale,
#                 # Wholesale specific data
#                 'wholesale_status': getattr(
#                     getattr(u, 'wholesale_profile', None), 'status', None
#                 ),
#                 'business_name': getattr(
#                     getattr(u, 'wholesale_profile', None), 'business_name', None
#                 ),
#             })

#         return Response({
#             'count':   total,
#             'results': data,
#         })

#     def post(self, request):
#         if request.user.user_type not in ['ADMIN']:
#             return Response({'detail': 'Forbidden'}, status=403)

#         email     = request.data.get('email', '').strip().lower()
#         name      = request.data.get('name', '').strip()
#         password  = request.data.get('password', '')
#         user_type = request.data.get('user_type', 'CUSTOMER')

#         if not email or not password:
#             return Response({'detail': 'Email and password required.'}, status=400)

#         if User.objects.filter(email__iexact=email).exists():
#             return Response({'detail': 'Email already exists.'}, status=400)

#         user = User.objects.create_user(
#             email=email,
#             password=password,
#             name=name,
#         )
#         if hasattr(user, 'user_type'):
#             user.user_type = user_type
#             user.save()

#         return Response({
#             'id':        user.id,
#             'email':     user.email,
#             'name':      getattr(user, 'name', ''),
#             'user_type': getattr(user, 'user_type', 'CUSTOMER'),
#             'is_active': user.is_active,
#         }, status=201)


# class AdminUserDetailView(APIView):
#     """
#     PATCH  /api/auth/admin/users/<id>/
#     DELETE /api/auth/admin/users/<id>/
#     """
#     permission_classes = [permissions.IsAuthenticated]

#     def patch(self, request, pk):
#         if request.user.user_type not in ['ADMIN']:
#             return Response({'detail': 'Forbidden'}, status=403)
#         try:
#             user = User.objects.get(pk=pk)
#         except User.DoesNotExist:
#             return Response({'detail': 'Not found.'}, status=404)

#         if 'name' in request.data:
#             user.name = request.data['name']
#         if 'is_active' in request.data:
#             user.is_active = request.data['is_active']
#         if 'user_type' in request.data:
#             user.user_type = request.data['user_type']
#         user.save()

#         return Response({'detail': 'Updated successfully.'})

#     def delete(self, request, pk):
#         if request.user.user_type not in ['ADMIN']:
#             return Response({'detail': 'Forbidden'}, status=403)
#         try:
#             user = User.objects.get(pk=pk)
#             user.delete()
#             return Response(status=204)
#         except User.DoesNotExist:
#             return Response({'detail': 'Not found.'}, status=404)

# class AdminUserListView(APIView):
#     """
#     GET  /api/auth/admin/users/  — normal + wholesale users combined
#     POST /api/auth/admin/users/  — create normal user
#     """
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request):
#         if getattr(request.user, 'user_type', None) not in ['ADMIN', 'SELLER']:
#             return Response({'detail': 'Forbidden'}, status=403)

#         search    = request.GET.get('search', '').strip()
#         page      = int(request.GET.get('page', 1))
#         page_size = int(request.GET.get('page_size', 20))

#         from django.db.models import Q

#         # ── Normal users ──────────────────────────────────────────
#         qs = User.objects.select_related('profile').order_by('-date_joined')
#         if search:
#             qs = qs.filter(Q(email__icontains=search) | Q(name__icontains=search))

#         normal_data = []
#         for u in qs:
#             normal_data.append({
#                 'id':               u.id,
#                 'name':             getattr(u, 'name', '') or u.email,
#                 'email':            u.email,
#                 'user_type':        getattr(u, 'user_type', 'CUSTOMER'),
#                 'is_active':        u.is_active,
#                 'date_joined':      u.date_joined.isoformat() if u.date_joined else '',
#                 'business_name':    None,
#                 'wholesale_status': None,
#                 'is_wholesale':     False,
#             })

#         # ── Wholesale users ───────────────────────────────────────
#         ws_data = []
#         try:
#             from wholesale.models import WholesaleUser
#             ws_qs = WholesaleUser.objects.order_by('-applied_at')
#             if search:
#                 ws_qs = ws_qs.filter(
#                     Q(email__icontains=search) |
#                     Q(business_name__icontains=search) |
#                     Q(contact_name__icontains=search)
#                 )
#             for i, u in enumerate(ws_qs, start=1):
#                 ws_data.append({
#                     'id': f'ws_{i}',
#                     'name':             u.contact_name or u.email,
#                     'email':            u.email,
#                     'user_type':        'WHOLESALE',
#                     'is_active':        u.is_active,
#                     'date_joined':      u.applied_at.isoformat() if u.applied_at else '',
#                     'business_name':    u.business_name,
#                     'wholesale_status': u.status,
#                     'is_wholesale':     True,
#                 })
#         except Exception:
#             pass

#         # ── Merge, sort, paginate ─────────────────────────────────
#         combined = normal_data + ws_data
#         combined.sort(key=lambda x: x['date_joined'], reverse=True)

#         total = len(combined)
#         start = (page - 1) * page_size
#         paginated = combined[start:start + page_size]

#         return Response({'count': total, 'results': paginated})

#     def post(self, request):
#         if getattr(request.user, 'user_type', None) not in ['ADMIN']:
#             return Response({'detail': 'Forbidden'}, status=403)

#         email     = request.data.get('email', '').strip().lower()
#         name      = request.data.get('name', '').strip()
#         password  = request.data.get('password', '')
#         user_type = request.data.get('user_type', 'CUSTOMER')

#         if not email or not password:
#             return Response({'detail': 'Email and password required.'}, status=400)
#         if User.objects.filter(email__iexact=email).exists():
#             return Response({'detail': 'Email already exists.'}, status=400)

#         user = User.objects.create_user(email=email, password=password, name=name)
#         if hasattr(user, 'user_type'):
#             user.user_type = user_type
#             user.save()

#         return Response({
#             'id':        user.id,
#             'email':     user.email,
#             'name':      getattr(user, 'name', ''),
#             'user_type': getattr(user, 'user_type', 'CUSTOMER'),
#             'is_active': user.is_active,
#         }, status=201)


# class AdminUserDetailView(APIView):
#     """PATCH/DELETE /api/auth/admin/users/<id>/"""
#     permission_classes = [permissions.IsAuthenticated]

#     def patch(self, request, pk):
#         if getattr(request.user, 'user_type', None) not in ['ADMIN']:
#             return Response({'detail': 'Forbidden'}, status=403)

#         # Wholesale user (id starts with ws_)
#         pk_str = str(pk)
#         if pk_str.startswith('ws_'):
#             try:
#                 from wholesale.models import WholesaleUser
#                 ws_id = pk_str[3:]
#                 u = WholesaleUser.objects.get(pk=ws_id)
#                 if 'is_active' in request.data:
#                     u.is_active = request.data['is_active']
#                 if 'wholesale_status' in request.data:
#                     u.status = request.data['wholesale_status']
#                 u.save()
#                 return Response({'detail': 'Updated.'})
#             except Exception as e:
#                 return Response({'detail': str(e)}, status=404)

#         # Normal user
#         try:
#             u = User.objects.get(pk=pk)
#         except User.DoesNotExist:
#             return Response({'detail': 'Not found.'}, status=404)

#         if 'name' in request.data:
#             u.name = request.data['name']
#         if 'is_active' in request.data:
#             u.is_active = request.data['is_active']
#         if 'user_type' in request.data:
#             u.user_type = request.data['user_type']
#         u.save()
#         return Response({'detail': 'Updated.'})

#     def delete(self, request, pk):
#         if getattr(request.user, 'user_type', None) not in ['ADMIN']:
#             return Response({'detail': 'Forbidden'}, status=403)

#         pk_str = str(pk)
#         if pk_str.startswith('ws_'):
#             try:
#                 from wholesale.models import WholesaleUser
#                 WholesaleUser.objects.get(pk=pk_str[3:]).delete()
#                 return Response(status=204)
#             except Exception as e:
#                 return Response({'detail': str(e)}, status=404)

#         try:
#             User.objects.get(pk=pk).delete()
#             return Response(status=204)
#         except User.DoesNotExist:
#             return Response({'detail': 'Not found.'}, status=404)





# accounts/views.py — ফাইলের শেষে যোগ করো

from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

class AdminUserListView(APIView):
    """
    GET  /api/auth/admin/users/  — normal + wholesale users combined
    POST /api/auth/admin/users/  — create normal user
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Q

        search    = request.GET.get('search', '').strip()
        page      = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))

        # ── Normal users ──────────────────────────────────────────
        qs = User.objects.order_by('-date_joined')
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(name__icontains=search))

        normal_data = []
        for u in qs:
            normal_data.append({
                'id':               u.id,
                'name':             getattr(u, 'name', '') or u.email,
                'email':            u.email,
                'user_type':        getattr(u, 'user_type', 'CUSTOMER'),
                'is_active':        u.is_active,
                'date_joined':      u.date_joined.isoformat() if u.date_joined else '',
                'business_name':    None,
                'wholesale_status': None,
                'is_wholesale':     False,
            })

        # ── Wholesale users ───────────────────────────────────────
        ws_data = []
        try:
            from wholesale.models import WholesaleUser
            ws_qs = WholesaleUser.objects.order_by('-applied_at')
            if search:
                ws_qs = ws_qs.filter(
                    Q(email__icontains=search) |
                    Q(business_name__icontains=search) |
                    Q(contact_name__icontains=search)
                )
            for i, u in enumerate(ws_qs, start=1):
                ws_data.append({
                    'id':               f'ws_{i}',
                    'name':             u.contact_name or u.email,
                    'email':            u.email,
                    'user_type':        'WHOLESALE',
                    'is_active':        u.is_active,
                    'date_joined':      u.applied_at.isoformat() if u.applied_at else '',
                    'business_name':    u.business_name,
                    'wholesale_status': u.status,
                    'is_wholesale':     True,
                })
        except Exception as e:
            print(f'[AdminUserListView] wholesale fetch error: {e}')

        # ── Merge + sort + paginate ───────────────────────────────
        combined = normal_data + ws_data
        combined.sort(key=lambda x: x['date_joined'], reverse=True)
        total    = len(combined)
        start    = (page - 1) * page_size
        paginated = combined[start:start + page_size]

        return Response({'count': total, 'results': paginated})

    def post(self, request):
        if getattr(request.user, 'user_type', None) not in ['ADMIN']:
            return Response({'detail': 'Forbidden'}, status=403)

        email     = request.data.get('email', '').strip().lower()
        name      = request.data.get('name', '').strip()
        password  = request.data.get('password', '')
        user_type = request.data.get('user_type', 'CUSTOMER')

        if not email or not password:
            return Response({'detail': 'Email and password required.'}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'Email already exists.'}, status=400)

        user = User.objects.create_user(email=email, password=password, name=name)
        if hasattr(user, 'user_type'):
            user.user_type = user_type
            user.save()

        return Response({
            'id':        user.id,
            'email':     user.email,
            'name':      getattr(user, 'name', ''),
            'user_type': getattr(user, 'user_type', 'CUSTOMER'),
            'is_active': user.is_active,
        }, status=201)
    
class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/admin/users/<id>/"""
    permission_classes = [permissions.IsAdminUser]
    queryset           = User.objects.all()

    def retrieve(self, request, *args, **kwargs):
        u = self.get_object()
        ws_status = None
        if getattr(u, 'user_type', None) == 'WHOLESALER':
            try:
                ws_status = u.wholesaler_profile.approval_status
            except Exception:
                ws_status = 'PENDING'
        return Response({
            'id':               u.id,
            'name':             getattr(u, 'name', None) or u.get_full_name() or u.email,
            'email':            u.email,
            'user_type':        getattr(u, 'user_type', 'CUSTOMER'),
            'is_active':        u.is_active,
            'date_joined':      u.date_joined,
            'wholesale_status': ws_status,
        })

    def partial_update(self, request, *args, **kwargs):
        u    = self.get_object()
        data = request.data

        if 'name' in data:
            u.name = data['name']
        if 'user_type' in data:
            u.user_type = data['user_type']
        if 'is_active' in data:
            u.is_active = data['is_active'] in [True, 'true', '1']

        if 'wholesale_status' in data:
            try:
                profile = u.wholesaler_profile
                profile.approval_status = data['wholesale_status']
                profile.save()
            except Exception:
                pass

        u.save()
        return Response({'success': True})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=204)


class AdminUserCreateView(generics.CreateAPIView):
    """POST /api/auth/admin/users/"""
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        data  = request.data
        email = data.get('email', '').strip().lower()
        name  = data.get('name', '').strip()
        pwd   = data.get('password', '')
        utype = data.get('user_type', 'CUSTOMER')

        if not email or not pwd:
            return Response({'detail': 'Email and password required.'}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'User with this email already exists.'}, status=400)

        u = User.objects.create_user(email=email, password=pwd)
        if hasattr(u, 'name'):
            u.name = name
        if hasattr(u, 'user_type'):
            u.user_type = utype
        u.save()
        return Response({'id': u.id, 'email': u.email}, status=201)

from django.db import models as db_models
from django.db import models as db_models

class AdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Orders
        try:
            from orders.models import Order
            total_orders   = Order.objects.count()
            pending_orders = Order.objects.filter(status='pending').count()
            total_revenue  = Order.objects.aggregate(
                t=db_models.Sum('total_amount'))['t'] or 0
        except Exception:
            total_orders = pending_orders = total_revenue = 0

        # Products
        try:
            from products.models import Product
            total_products = Product.objects.count()
        except Exception:
            total_products = 0

        # Normal users
        total_normal    = User.objects.count()
        total_customers = User.objects.filter(user_type='CUSTOMER').count()
        total_sellers   = User.objects.filter(user_type='SELLER').count()
        total_vendors   = User.objects.filter(user_type='VENDOR').count()
        total_admins    = User.objects.filter(user_type='ADMIN').count()
        inactive_users  = User.objects.filter(is_active=False).count()

        # Wholesale users (separate model/table)
        try:
            from wholesale.models import WholesaleUser
            total_wholesale          = WholesaleUser.objects.count()
            wholesale_pending        = WholesaleUser.objects.filter(status='pending').count()
            wholesale_approved       = WholesaleUser.objects.filter(status='approved').count()
        except Exception:
            total_wholesale = wholesale_pending = wholesale_approved = 0

        return Response({
            'statistics': {
                # Top stats
                'total_users':    total_normal + total_wholesale,
                'total_products': total_products,
                'total_orders':   total_orders,
                'total_revenue':  float(total_revenue),
                # User breakdown
                'total_customers':      total_customers,
                'total_sellers':        total_sellers,
                'total_vendors':        total_vendors,
                'total_admins':         total_admins,
                'inactive_users':       inactive_users,
                'total_wholesale':      total_wholesale,
                'wholesale_pending':    wholesale_pending,
                'wholesale_approved':   wholesale_approved,
                # Orders
                'pending_orders': pending_orders,
            }
        })
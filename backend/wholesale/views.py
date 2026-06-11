

# wholesale/views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import WholesaleUser, WholesaleNotification
from .serializers import (
    WholesaleRegisterSerializer,
    WholesaleLoginSerializer,
    WholesaleUserPublicSerializer,
    WholesaleProfileUpdateSerializer,
    ChangePasswordSerializer,
    WholesaleNotificationSerializer,
)
from .authentication import WholesaleJWTAuthentication
from .permissions import IsWholesaleUser


def get_tokens_for_user(user):
    refresh = RefreshToken()
    refresh['token_type'] = 'refresh'
    refresh['jti'] = refresh['jti']
    refresh['user_id']       = str(user.id)
    refresh['email']         = user.email
    refresh['business_name'] = user.business_name
    refresh['is_wholesale']  = True
    refresh['is_approved']   = user.is_approved
    refresh['status']        = user.status

    access = refresh.access_token
    access['token_type']     = 'access'
    access['user_id']        = str(user.id)
    access['email']          = user.email
    access['business_name']  = user.business_name
    access['is_wholesale']   = True
    access['is_approved']    = user.is_approved
    access['status']         = user.status

    return {
        'refresh': str(refresh),
        'access':  str(access),
    }


class WholesaleRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = WholesaleRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        user_data = WholesaleUserPublicSerializer(user).data
        return Response({
            'message': 'Application submitted successfully.',
            'user': user_data,
            **tokens,
        }, status=status.HTTP_201_CREATED)


class WholesaleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = WholesaleLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        user_data = WholesaleUserPublicSerializer(user, context={'request': request}).data
        return Response({'user': user_data, **tokens})


class WholesaleTokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            user_id = token['user_id']
            user = WholesaleUser.objects.get(pk=user_id)
            if not user.is_active:
                return Response({'error': 'Account is disabled.'}, status=status.HTTP_401_UNAUTHORIZED)
            new_tokens = get_tokens_for_user(user)
            token.blacklist()
            return Response(new_tokens)
        except Exception:
            return Response({'error': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


class WholesaleProfileView(APIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [IsWholesaleUser]

    def get(self, request):
        serializer = WholesaleUserPublicSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = WholesaleProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(WholesaleUserPublicSerializer(request.user, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.parsers import MultiPartParser, FormParser

class WholesaleProfileImageView(APIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes     = [IsWholesaleUser]
    parser_classes         = [MultiPartParser, FormParser]

    def patch(self, request):
        image = request.FILES.get('profile_image')
        if not image:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if image.content_type not in allowed_types:
            return Response({'error': 'Unsupported image type.'}, status=status.HTTP_400_BAD_REQUEST)
        if image.size > 5 * 1024 * 1024:
            return Response({'error': 'Image must be under 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if user.profile_image:
            try:
                user.profile_image.delete(save=False)
            except Exception:
                pass
        user.profile_image = image
        user.save(update_fields=['profile_image'])
        url = request.build_absolute_uri(user.profile_image.url) if user.profile_image else None
        return Response({'profile_image_url': url})


class ChangePasswordView(APIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [IsWholesaleUser]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save(update_fields=['password'])
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WholesaleNotificationListView(generics.ListAPIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [IsWholesaleUser]
    serializer_class = WholesaleNotificationSerializer

    def get_queryset(self):
        return WholesaleNotification.objects.filter(user=self.request.user)


class WholesaleNotificationUnreadCountView(APIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [IsWholesaleUser]

    def get(self, request):
        count = WholesaleNotification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})


class WholesaleMarkNotificationsReadView(APIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [IsWholesaleUser]

    def post(self, request):
        ids = request.data.get('ids', [])
        qs = WholesaleNotification.objects.filter(user=request.user)
        if ids:
            qs = qs.filter(id__in=ids)
        else:
            qs = qs.filter(is_read=False)
        qs.update(is_read=True)
        return Response({'message': 'Notifications marked as read.'})


# ✅ নতুন — single notification delete
class WholesaleNotificationDeleteView(APIView):
    """DELETE /api/wholesale/notifications/<int:pk>/delete/"""
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [IsWholesaleUser]

    def delete(self, request, pk):
        try:
            notif = WholesaleNotification.objects.get(pk=pk, user=request.user)
            notif.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WholesaleNotification.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class WholesaleStatusView(APIView):
    authentication_classes = [WholesaleJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if isinstance(request.user, WholesaleUser) and request.user.is_active:
            return Response({
                'is_wholesale': True,
                'is_approved': request.user.is_approved,
                'status': request.user.status,
                'business_name': request.user.business_name,
            })
        return Response({'is_wholesale': False, 'is_approved': False})


import random
from django.core.mail import send_mail
from django.conf import settings
from accounts.models import PasswordResetOTP


class WholesaleSendPasswordResetOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not WholesaleUser.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'If this email exists, an OTP has been sent.'})
        otp = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.filter(email=f'ws_{email}').delete()
        PasswordResetOTP.objects.create(email=f'ws_{email}', otp=otp)
        send_mail(
            subject='El Árbol Wholesale — Password Reset OTP',
            message=f'Your OTP is: {otp}\n\nValid for 10 minutes. Do not share this with anyone.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'detail': 'OTP sent successfully.'})


class WholesaleVerifyOTPAndResetPasswordView(APIView):
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
            record = PasswordResetOTP.objects.filter(email=f'ws_{email}', otp=otp, is_used=False).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)
        if not record.is_valid():
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = WholesaleUser.objects.get(email__iexact=email)
            user.set_password(password)
            user.save()
            record.is_used = True
            record.save()
            return Response({'detail': 'Password reset successful.'})
        except WholesaleUser.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        


# wholesale content

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import WholesalePageContent
from .serializers import WholesalePageContentSerializer
from website.views import IsAdminOrReadOnly

class WholesalePageContentViewSet(viewsets.ModelViewSet):
    """API for Wholesale Page Content (Singleton)"""
    serializer_class = WholesalePageContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        return WholesalePageContent.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Always return the single instance
        instance, created = WholesalePageContent.objects.get_or_create()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
        
    def retrieve(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        instance, created = WholesalePageContent.objects.get_or_create()
        data = request.data.dict()
        
        if 'hero_image' in request.FILES:
            data['hero_image'] = request.FILES['hero_image']

        import json
        for field in ['hero_section', 'stats', 'benefits', 'categories', 'steps', 'guarantee']:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = json.loads(data[field])
                except json.JSONDecodeError:
                    pass

        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(["GET"])
@permission_classes([AllowAny])
def wholesale_page_content(request):
    """
    GET /api/wholesale/content/
    Legacy fallback/alias endpoint returning the new single WholesalePageContent JSON
    so that frontend API fetch doesn't break immediately.
    """
    instance, created = WholesalePageContent.objects.get_or_create()
    serializer = WholesalePageContentSerializer(instance, context={"request": request})
    return Response(serializer.data)
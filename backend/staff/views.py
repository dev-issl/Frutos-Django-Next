from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import models
from .models import StaffProfile, StaffShift, StaffTask, StaffNotification, Announcement, DayOffRequest
from .serializers import (
    StaffProfileSerializer, CreateStaffSerializer, StaffShiftSerializer, 
    StaffTaskSerializer, StaffNotificationSerializer, DayOffRequestSerializer,
    AnnouncementSerializer, AnnouncementCreateSerializer, StoreStaffTreeSerializer,
    MyStaffProfileUpdateSerializer
)
from stores.models import Store
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

import logging
logger = logging.getLogger(__name__)

# Custom Permission
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
            
        user_type = getattr(user, 'user_type', '')
        if user_type:
            user_type = str(user_type).upper()
            
        has_perm = bool(user_type == 'ADMIN' or user.is_superuser or (user.is_staff and user_type != 'STAFF'))
        logger.error(f"IsAdminUser check: user={user}, is_auth={user.is_authenticated}, type={user_type}, is_superuser={getattr(user, 'is_superuser', False)}, is_staff={getattr(user, 'is_staff', False)}, has_perm={has_perm}")
        return has_perm

class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'user_type', '') == 'STAFF')

# ==========================================
# ADMIN APIs
# ==========================================

class AdminStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = StaffProfileSerializer

    def get_queryset(self):
        queryset = StaffProfile.objects.all().order_by('-created_at')
        
        store_id = self.request.query_params.get('store_id')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
            
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(user__name__icontains=search_query) |
                models.Q(user__email__icontains=search_query)
            )
            
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = CreateStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff_profile = serializer.save()
        return Response(StaffProfileSerializer(staff_profile).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Update User fields if provided
        user = instance.user
        user_changed = False
        
        if 'name' in request.data:
            user.name = request.data['name']
            user_changed = True
        if 'email' in request.data:
            user.email = request.data['email']
            user_changed = True
        if 'password' in request.data and request.data['password']:
            new_password = request.data['password']
            user.set_password(new_password)
            user_changed = True
            
            instance.secret_key = new_password
            instance.save()
            
        if user_changed:
            user.save()
            
        # Update StaffProfile fields
        return super().update(request, *args, **kwargs)

class AdminStaffShiftViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    queryset = StaffShift.objects.all().order_by('-date', '-start_time')
    serializer_class = StaffShiftSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff_id')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        return queryset

class AdminStaffTaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    queryset = StaffTask.objects.all().order_by('-created_at')
    serializer_class = StaffTaskSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff_id')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        return queryset

# ==========================================
# STAFF APIs
# ==========================================

class MyStaffDashboardView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        staff_profile = get_object_or_404(StaffProfile, user=request.user)
        
        # Get today's shifts (or upcoming week)
        shifts = StaffShift.objects.filter(staff=staff_profile).order_by('date')[:7]
        
        # Get tasks
        tasks = StaffTask.objects.filter(staff=staff_profile).order_by('-created_at')[:10]
        
        # Get notifications
        notifications = StaffNotification.objects.filter(staff=staff_profile).order_by('-created_at')[:5]

        # Get active stores for attendance modal
        from stores.models import Store
        from stores.serializers import StoreListSerializer
        active_stores = Store.objects.filter(is_active=True).order_by('order', 'name')

        from datetime import date
        today = date.today()
        current_active_shift = StaffShift.objects.filter(
            staff=staff_profile, 
            date=today, 
            status='IN_PROGRESS'
        ).first()

        completed_shift_today = StaffShift.objects.filter(
            staff=staff_profile,
            date=today,
            status='COMPLETED'
        ).exists()

        return Response({
            'profile': StaffProfileSerializer(staff_profile, context={'request': request}).data,
            'shifts': StaffShiftSerializer(shifts, many=True, context={'request': request}).data,
            'tasks': StaffTaskSerializer(tasks, many=True, context={'request': request}).data,
            'notifications': StaffNotificationSerializer(notifications, many=True, context={'request': request}).data,
            'active_stores': StoreListSerializer(active_stores, many=True, context={'request': request}).data,
            'current_active_shift': StaffShiftSerializer(current_active_shift).data if current_active_shift else None,
            'has_completed_shift_today': completed_shift_today
        })

class MyStaffCheckInView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request):
        staff_profile = get_object_or_404(StaffProfile, user=request.user)
        store_id = request.data.get('store_id')
        if not store_id:
            return Response({"detail": "Store ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        from stores.models import Store
        store = get_object_or_404(Store, id=store_id)
        
        from datetime import date
        from django.utils import timezone
        today = date.today()
        
        # Check if already checked in today
        active_shift = StaffShift.objects.filter(staff=staff_profile, date=today, status='IN_PROGRESS').first()
        if active_shift:
            if str(active_shift.store_id) == str(store.id):
                return Response({"detail": "Already checked in to this store"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Automatically check out of the previous store
                active_shift.end_time = timezone.now().time()
                active_shift.status = 'COMPLETED'
                active_shift.save()
            
        # Try to find a scheduled shift for today
        shift = StaffShift.objects.filter(staff=staff_profile, date=today, status='SCHEDULED').first()
        
        if shift:
            shift.status = 'IN_PROGRESS'
            shift.start_time = timezone.now().time()
            shift.store = store
            shift.save()
        else:
            shift = StaffShift.objects.create(
                staff=staff_profile,
                date=today,
                start_time=timezone.now().time(),
                store=store,
                status='IN_PROGRESS'
            )
            
        # Update current active store for the profile
        staff_profile.store = store
        staff_profile.save()
        
        return Response(StaffShiftSerializer(shift).data)

class MyStaffCheckOutView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request):
        staff_profile = get_object_or_404(StaffProfile, user=request.user)
        from datetime import date
        from django.utils import timezone
        today = date.today()
        
        active_shift = StaffShift.objects.filter(staff=staff_profile, date=today, status='IN_PROGRESS').first()
        if not active_shift:
            return Response({"detail": "No active shift found to check out"}, status=status.HTTP_400_BAD_REQUEST)
            
        active_shift.end_time = timezone.now().time()
        active_shift.status = 'COMPLETED'
        active_shift.save()
        
        return Response(StaffShiftSerializer(active_shift).data)

class MyStaffProfileUpdateView(generics.UpdateAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = MyStaffProfileUpdateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return get_object_or_404(StaffProfile, user=self.request.user)

class MyStaffTasksView(generics.ListAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = StaffTaskSerializer

    def get_queryset(self):
        profile = get_object_or_404(StaffProfile, user=self.request.user)
        return StaffTask.objects.filter(staff=profile).order_by('-created_at')

class MyStaffColleaguesView(generics.ListAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = StaffProfileSerializer

    def get_queryset(self):
        profile = get_object_or_404(StaffProfile, user=self.request.user)
        if not profile.store:
            return StaffProfile.objects.none()
        # Return all staff in the same store except the requesting user
        return StaffProfile.objects.filter(store=profile.store).exclude(id=profile.id).order_by('user__name')


class StoreStaffListView(generics.ListAPIView):
    """Return all staff assigned to a given store — available to any authenticated staff."""
    permission_classes = [IsStaffUser]
    serializer_class = StaffProfileSerializer

    def get_queryset(self):
        store_id = self.kwargs.get('store_id')
        return StaffProfile.objects.filter(store_id=store_id).order_by('user__name')

class MyStaffTaskUpdateView(generics.UpdateAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = StaffTaskSerializer
    
    def get_queryset(self):
        return StaffTask.objects.filter(staff__user=self.request.user)

class MyStaffNotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = StaffNotificationSerializer
    
    def get_queryset(self):
        return StaffNotification.objects.filter(staff__user=self.request.user)

class MyStaffDayOffRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = DayOffRequestSerializer

    def get_queryset(self):
        return DayOffRequest.objects.filter(staff__user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user.staff_profile, status='PENDING')

# ==========================================
# SHARED APIs (Announcements)
# ==========================================

class AnnouncementViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'targets']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return AnnouncementCreateSerializer
        return AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Announcement.objects.none()
            
        user_type = getattr(user, 'user_type', '')
        if user_type == 'ADMIN' or getattr(user, 'is_superuser', False):
            return Announcement.objects.all().order_by('-created_at')
            
        # For staff, return targeted announcements
        try:
            staff_profile = user.staff_profile
            return Announcement.objects.filter(
                models.Q(target_all_stores=True) |
                models.Q(target_stores=staff_profile.store) |
                models.Q(target_staff=staff_profile)
            ).distinct().order_by('-created_at')
        except StaffProfile.DoesNotExist:
            return Announcement.objects.none()

    def perform_create(self, serializer):
        announcement = serializer.save(created_by=self.request.user)
        
        # Create StaffNotification records
        target_staff_set = set()
        if announcement.target_all_stores:
            for staff in StaffProfile.objects.all():
                target_staff_set.add(staff)
        else:
            for store in announcement.target_stores.all():
                for staff in store.staff.all():
                    target_staff_set.add(staff)
            for staff in announcement.target_staff.all():
                target_staff_set.add(staff)
                
        notifications = []
        for staff in target_staff_set:
            notifications.append(StaffNotification(
                staff=staff,
                title=f"Announcement: {announcement.title}",
                message=announcement.message
            ))
        if notifications:
            StaffNotification.objects.bulk_create(notifications)

        # Broadcast notification via Django Channels
        channel_layer = get_channel_layer()
        message_data = {
            'type': 'send_announcement',
            'announcement': AnnouncementSerializer(announcement).data
        }
        
        if announcement.target_all_stores:
            async_to_sync(channel_layer.group_send)('staff_all', message_data)
        else:
            for store in announcement.target_stores.all():
                async_to_sync(channel_layer.group_send)(f'store_{store.id}', message_data)
            
            for staff in announcement.target_staff.all():
                async_to_sync(channel_layer.group_send)(f'user_{staff.user.id}', message_data)

    @action(detail=False, methods=['get'])
    def targets(self, request):
        stores = Store.objects.filter(is_active=True).prefetch_related('staff', 'staff__user')
        serializer = StoreStaffTreeSerializer(stores, many=True)
        return Response(serializer.data)


# ==========================================
# STAFF SHIFT HISTORY
# ==========================================

class MyStaffShiftHistoryView(APIView):
    """GET /api/staff/me/shift-history/ — full shift history for logged-in staff"""
    permission_classes = [IsStaffUser]

    def get(self, request):
        from datetime import datetime
        staff_profile = get_object_or_404(StaffProfile, user=request.user)
        shifts = StaffShift.objects.filter(
            staff=staff_profile
        ).select_related('store').order_by('-date', '-start_time')

        result = []
        total_hours = 0
        for s in shifts:
            hours = 0
            if s.start_time and s.end_time:
                from datetime import datetime as dt
                start = dt.combine(s.date, s.start_time)
                end = dt.combine(s.date, s.end_time)
                diff = (end - start).total_seconds() / 3600
                if s.break_start and s.break_end:
                    bs = dt.combine(s.date, s.break_start)
                    be = dt.combine(s.date, s.break_end)
                    diff -= (be - bs).total_seconds() / 3600
                hours = max(0, round(diff, 2))
                if s.status in ('COMPLETED', 'IN_PROGRESS'):
                    total_hours += hours
            result.append({
                'id': s.id,
                'date': str(s.date),
                'store_id': s.store_id,
                'store_name': s.store.name if s.store else None,
                'start_time': str(s.start_time) if s.start_time else None,
                'end_time': str(s.end_time) if s.end_time else None,
                'status': s.status,
                'hours': hours,
            })

        return Response({
            'shifts': result,
            'total_shifts': len(result),
            'total_hours': round(total_hours, 2),
        })


class AdminStaffShiftStatsView(APIView):
    """GET /api/staff/admin/shift-stats/ — per-staff shift stats and ranking"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from datetime import datetime as dt
        store_id = request.query_params.get('store_id')
        
        qs = StaffProfile.objects.select_related('user').prefetch_related(
            models.Prefetch(
                'shifts',
                queryset=StaffShift.objects.select_related('store').order_by('-date', '-start_time')
            )
        )
        
        if store_id:
            qs = qs.filter(shifts__store_id=store_id).distinct()

        results = []
        for sp in qs:
            shifts = sp.shifts.all()
            if store_id:
                shifts = [s for s in shifts if str(s.store_id) == str(store_id)]
            
            total_hours = 0
            shift_details = []
            stores_worked = {}
            
            for s in shifts:
                is_working_shift = s.status in ['COMPLETED', 'IN_PROGRESS']
                hours = 0
                if s.start_time and s.end_time and is_working_shift:
                    start = dt.combine(s.date, s.start_time)
                    end = dt.combine(s.date, s.end_time)
                    diff = (end - start).total_seconds() / 3600
                    if s.break_start and s.break_end:
                        bs = dt.combine(s.date, s.break_start)
                        be = dt.combine(s.date, s.break_end)
                        diff -= (be - bs).total_seconds() / 3600
                    hours = max(0, round(diff, 2))
                    total_hours += hours

                sname = s.store.name if s.store else 'Unassigned'
                
                # Only add to stores_worked if it's a working shift
                if is_working_shift:
                    if sname not in stores_worked:
                        stores_worked[sname] = {'days': 0, 'hours': 0}
                    stores_worked[sname]['days'] += 1
                    stores_worked[sname]['hours'] += hours

                shift_details.append({
                    'id': s.id,
                    'date': str(s.date),
                    'store_name': sname,
                    'start_time': str(s.start_time) if s.start_time else None,
                    'end_time': str(s.end_time) if s.end_time else None,
                    'hours': hours,
                    'status': s.status,
                })
            
            results.append({
                'staff_id': sp.id,
                'staff_code': sp.staff_id,
                'name': sp.user.name or sp.user.email,
                'photo': sp.photo.url if sp.photo else None,
                'role': sp.role,
                'total_shifts': len(shifts),
                'total_hours': round(total_hours, 2),
                'stores_worked': stores_worked,
                'shifts': shift_details,
            })

        # Sort by total_hours descending (ranking)
        results.sort(key=lambda x: x['total_hours'], reverse=True)
        for i, r in enumerate(results):
            r['rank'] = i + 1

        return Response({'results': results, 'total_staff': len(results)})


class MyStaffOrderHistoryView(APIView):
    """GET /api/staff/me/orders/ — orders created by this staff member"""
    permission_classes = [IsStaffUser]

    def get(self, request):
        from orders.models import Order
        from orders.serializers import OrderReadSerializer
        staff_profile = get_object_or_404(StaffProfile, user=request.user)
        
        status_filter = request.query_params.get('status')
        store_id = request.query_params.get('store_id')
        
        qs = Order.objects.filter(created_by_staff=staff_profile).order_by('-ordered_at')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        if store_id:
            # Filter by orders with items from this store's products
            pass
        
        orders = qs[:100]
        serializer = OrderReadSerializer(orders, many=True, context={'request': request})
        
        # Stats summary
        all_orders = Order.objects.filter(created_by_staff=staff_profile)
        stats = {
            'total': all_orders.count(),
            'pending': all_orders.filter(status='PENDING').count(),
            'processing': all_orders.filter(status='PROCESSING').count(),
            'delivered': all_orders.filter(status='DELIVERED').count(),
            'cancelled': all_orders.filter(status='CANCELLED').count(),
        }
        
        return Response({
            'results': serializer.data,
            'stats': stats,
        })

class MyStaffDayOffRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = DayOffRequestSerializer

    def get_queryset(self):
        staff_profile = get_object_or_404(StaffProfile, user=self.request.user)
        return DayOffRequest.objects.filter(staff=staff_profile).order_by('-created_at')

    def perform_create(self, serializer):
        from django.core.mail import send_mail
        from django.conf import settings
        from users.models import Notification

        staff_profile = get_object_or_404(StaffProfile, user=self.request.user)
        request_obj = serializer.save(staff=staff_profile, status='PENDING')

        # Notify Admin via Email
        subject = f"New Day Off Request from {staff_profile.user.name}"
        message = f"Staff {staff_profile.user.name} has requested a day off on {request_obj.date}.\nReason: {request_obj.reason}"
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [settings.DEFAULT_FROM_EMAIL], # Using default as admin email
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Error sending day off request email: {e}")

        # Notify Admin Dashboard
        try:
            Notification.objects.create(
                type='DAY_OFF_REQUEST',
                title=subject,
                message=message,
                actor=self.request.user
            )
        except Exception as e:
            logger.error(f"Error creating admin notification: {e}")

class AdminDayOffRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = DayOffRequestSerializer

    def get_queryset(self):
        return DayOffRequest.objects.all().order_by('-created_at')

    def perform_update(self, serializer):
        from django.core.mail import send_mail
        from django.conf import settings

        instance = self.get_object()
        old_status = instance.status
        updated_obj = serializer.save()

        if old_status != updated_obj.status:
            # Send Email to Staff
            subject = f"Day Off Request {updated_obj.status.capitalize()}"
            message = f"Your day off request for {updated_obj.date} has been {updated_obj.status.lower()}."
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [updated_obj.staff.user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Error sending day off approval email: {e}")

            # Notify Staff Dashboard
            try:
                StaffNotification.objects.create(
                    staff=updated_obj.staff,
                    title=subject,
                    message=message
                )
            except Exception as e:
                logger.error(f"Error creating staff notification: {e}")

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import StaffProfile, StaffShift, StaffTask, StaffNotification
from .serializers import (
    StaffProfileSerializer, CreateStaffSerializer, StaffShiftSerializer, 
    StaffTaskSerializer, StaffNotificationSerializer
)

# Custom Permission
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'user_type', '') == 'ADMIN')

class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'user_type', '') == 'STAFF')

# ==========================================
# ADMIN APIs
# ==========================================

class AdminStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = StaffProfile.objects.all().order_by('-created_at')
    serializer_class = StaffProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff_profile = serializer.save()
        return Response(StaffProfileSerializer(staff_profile).data, status=status.HTTP_201_CREATED)

class AdminStaffShiftViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = StaffShift.objects.all().order_by('-date', '-start_time')
    serializer_class = StaffShiftSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff_id')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        return queryset

class AdminStaffTaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
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

        return Response({
            'profile': StaffProfileSerializer(staff_profile).data,
            'shifts': StaffShiftSerializer(shifts, many=True).data,
            'tasks': StaffTaskSerializer(tasks, many=True).data,
            'notifications': StaffNotificationSerializer(notifications, many=True).data
        })

class MyStaffTasksView(generics.ListAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = StaffTaskSerializer

    def get_queryset(self):
        return StaffTask.objects.filter(staff__user=self.request.user).order_by('-created_at')

class MyStaffTaskUpdateView(generics.UpdateAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = StaffTaskSerializer
    
    def get_queryset(self):
        return StaffTask.objects.filter(staff__user=self.request.user)

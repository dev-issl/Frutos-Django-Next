from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/employees', views.AdminStaffViewSet, basename='admin-staff')
router.register(r'admin/shifts', views.AdminStaffShiftViewSet, basename='admin-shifts')
router.register(r'admin/tasks', views.AdminStaffTaskViewSet, basename='admin-tasks')

urlpatterns = [
    # Admin APIs
    path('', include(router.urls)),
    
    # Staff APIs
    path('me/dashboard/', views.MyStaffDashboardView.as_view(), name='staff-dashboard'),
    path('me/tasks/', views.MyStaffTasksView.as_view(), name='staff-tasks-list'),
    path('me/tasks/<int:pk>/', views.MyStaffTaskUpdateView.as_view(), name='staff-task-update'),
]

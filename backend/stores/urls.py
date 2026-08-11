"""
stores/urls.py  — FINAL VERSION

root urls.py তে:
    path('api/fulfillment/', include('stores.urls')),
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StoreListView, StoreDetailView,
    AdminStoreListCreateView, AdminStoreDetailView,
    AdminStoreFeaturesView, AdminStoreAvailabilityView,
    DashboardLeftoverPackViewSet, EligibleStoresView
)

router = DefaultRouter()
router.register(r'dashboard/leftover-packs', DashboardLeftoverPackViewSet, basename='dashboard-leftover-packs')

urlpatterns = [
    path('', include(router.urls)),
    
    # Public
    path('stores/',                        StoreListView.as_view(),              name='store-list'),
    path('stores/eligible/',               EligibleStoresView.as_view(),         name='store-eligible'),
    path('stores/slug/<slug:slug>/',       StoreDetailView.as_view(),            name='store-detail'),

    # Admin CRUD
    path('stores/admin/',                  AdminStoreListCreateView.as_view(),   name='admin-store-list'),
    path('stores/<int:pk>/',               AdminStoreDetailView.as_view(),       name='admin-store-detail'),
    path('stores/<int:pk>/features/',      AdminStoreFeaturesView.as_view(),     name='admin-store-features'),
    path('stores/<int:pk>/availability/',  AdminStoreAvailabilityView.as_view(), name='admin-store-availability'),
]
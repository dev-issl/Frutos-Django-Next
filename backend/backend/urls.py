# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView











# View to handle reload events silently
def reload_events_view(request):
    """Handle /__reload__/events/ requests to prevent 404 errors"""
    return HttpResponse(status=204)  # No Content

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Custom Admin Dashboard
    path('dashboard/', include('dashboard.urls')),
    
    # CKEditor 5 upload URLs
    path('ckeditor5/', include('django_ckeditor_5.urls')),
    
    # Handle development reload events
    path('__reload__/events/', reload_events_view, name='reload_events'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API endpoints organized by app
    path('api/products/', include('products.urls')),
    path('api/shops/', include('shops.urls')), 
    path('api/orders/', include('orders.urls')),
    path('api/auth/', include('accounts.urls')),  # Account/Auth endpoints (accounts app)
    path('api/wholesale/', include('wholesale.urls')),
    path('api/website/', include('website.urls')),
    path('api/sections/', include('sections.urls')),  # New sections API
    # path('api/stores/', include('stores.urls')),  # Stores API
    path('api/fulfillment/', include('stores.urls')),
    path('api/staff/', include('staff.urls')),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

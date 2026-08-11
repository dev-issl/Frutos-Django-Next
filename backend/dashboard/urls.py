"""
Dashboard URLs - Generic CRUD for ALL models with full export/import
"""
from django.urls import path
from . import crud_views
from . import analytics_views
from . import api_views
from . import views
from .views_dashboard_home import (
    dashboard_home_view, 
    total_revenue_partial, 
    sales_overview_partial, 
    top_selling_partial,
    order_summary_partial,
    top_sellers_partial,
    recent_orders_partial
)

app_name = 'dashboard'

urlpatterns = [
    # Dashboard home - Fila E-Commerce Template with Dynamic Data
    path('', dashboard_home_view, name='home'),
    
    # Enhanced Analytics Dashboard
    path('analytics/', analytics_views.enhanced_dashboard, name='analytics'),

    # HTMX Partials (Total Revenue and Sales Overview)
    path('partials/total-revenue/', total_revenue_partial, name='partial_total_revenue'),
    path('partials/sales-overview/', sales_overview_partial, name='partial_sales_overview'),
    path('partials/top-selling-products/', top_selling_partial, name='partial_top_selling'),
    path('partials/order-summary/', order_summary_partial, name='partial_order_summary'),
    path('partials/top-sellers/', top_sellers_partial, name='partial_top_sellers'),
    path('partials/recent-orders/', recent_orders_partial, name='partial_recent_orders'),
    
    # ========================================================================
    # API ENDPOINTS
    # ========================================================================
    path('api/add-color/', api_views.add_color, name='api_add_color'),
    path('api/add-size/', api_views.add_size, name='api_add_size'),
    path('api/subcategories/', api_views.get_subcategories, name='api_subcategories'),
    
    # ========================================================================
    # GENERIC MODEL CRUD ROUTES (Works for ALL 38 models automatically)
    # ========================================================================
    
    # List view: /dashboard/products/product/
    path('<str:app_label>/<str:model_name>/', crud_views.model_list, name='model_list'),
    
    # Create: /dashboard/products/product/create/
    path('<str:app_label>/<str:model_name>/create/', crud_views.model_create, name='model_create'),
    
    # Update: /dashboard/products/product/123/edit/
    path('<str:app_label>/<str:model_name>/<str:pk>/edit/', crud_views.model_update, name='model_update'),
    
    # Delete: /dashboard/products/product/123/delete/
    path('<str:app_label>/<str:model_name>/<str:pk>/delete/', crud_views.model_delete, name='model_delete'),
    
    # Detail (view): /dashboard/products/product/123/view/
    path('<str:app_label>/<str:model_name>/<str:pk>/view/', crud_views.model_detail, name='model_detail'),
    
    # ========================================================================
    # EXPORT ENDPOINTS (All Records)
    # ========================================================================
    
    # Export all to CSV
    path('<str:app_label>/<str:model_name>/export/csv/', crud_views.model_export_csv, name='model_export_csv'),
    
    # Export all to Excel
    path('<str:app_label>/<str:model_name>/export/excel/', crud_views.model_export_excel, name='model_export_excel'),
    
    # ========================================================================
    # EXPORT ENDPOINTS (Single Record)
    # ========================================================================
    
    # Export single record to CSV
    path('<str:app_label>/<str:model_name>/<str:pk>/export/csv/', crud_views.model_export_single_csv, name='model_export_single_csv'),
    
    # Export single record to Excel
    path('<str:app_label>/<str:model_name>/<str:pk>/export/excel/', crud_views.model_export_single_excel, name='model_export_single_excel'),
    
    # Download single record
    path('<str:app_label>/<str:model_name>/<str:pk>/download/', crud_views.model_download_single, name='model_download_single'),
    
    # ========================================================================
    # BULK OPERATIONS
    # ========================================================================
    
    # Bulk export to CSV
    path('<str:app_label>/<str:model_name>/bulk/export/csv/', crud_views.model_bulk_export_csv, name='model_bulk_export_csv'),
    
    # Bulk export to Excel
    path('<str:app_label>/<str:model_name>/bulk/export/excel/', crud_views.model_bulk_export_excel, name='model_bulk_export_excel'),
    
    # Bulk delete
    path('<str:app_label>/<str:model_name>/bulk/delete/', crud_views.model_bulk_delete, name='model_bulk_delete'),
    
    # ========================================================================
    # IMPORT ENDPOINTS
    # ========================================================================
    
    # Import data (GET = show form, POST = process)
    path('<str:app_label>/<str:model_name>/import/', crud_views.model_import, name='model_import'),
    
    # Download import template
    path('<str:app_label>/<str:model_name>/import/template/', crud_views.model_export_template, name='model_export_template'),

    # ------------------------------------------------------------------------
    # Legacy aliases for commonly-used dashboard routes (backwards compatible)
    # ------------------------------------------------------------------------
    # Orders
    path('orders/', views.order_list, name='order_list'),
    path('orders/create/', views.order_create, name='order_create'),
    path('orders/<int:pk>/edit/', views.order_edit, name='order_edit'),
    path('orders/<int:pk>/delete/', views.order_delete, name='order_delete'),
    path('orders/<int:pk>/', views.order_detail, name='order_detail'),
    path('orders/<int:pk>/print/', crud_views.model_print, {'app_label': 'orders', 'model_name': 'Order'}, name='order_print'),
    path('orders/<int:pk>/update-status/', views.order_update_status, name='order_update_status'),
    path('orders/item/<int:pk>/update/', views.order_item_update, name='order_item_update'),
    path('orders/export/csv/', crud_views.model_export_csv, {'app_label': 'orders', 'model_name': 'Order'}, name='order_export_csv'),

    # Products (Product uses UUID PK)
    path('products/', crud_views.model_list, {'app_label': 'products', 'model_name': 'Product'}, name='product_list'),
    path('products/create/', crud_views.model_create, {'app_label': 'products', 'model_name': 'Product'}, name='product_create'),
    path('products/<uuid:pk>/edit/', crud_views.model_update, {'app_label': 'products', 'model_name': 'Product'}, name='product_edit'),
    path('products/<uuid:pk>/delete/', crud_views.model_delete, {'app_label': 'products', 'model_name': 'Product'}, name='product_delete'),
    path('products/export/csv/', crud_views.model_export_csv, {'app_label': 'products', 'model_name': 'Product'}, name='product_export_csv'),
     path('products/<uuid:pk>/view/', crud_views.model_detail, {'app_label': 'products', 'model_name': 'Product'}, name='product_view'),
]


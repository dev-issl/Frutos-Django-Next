from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse, JsonResponse
from django.db.models import Q, Count, Sum, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.contrib import messages
from django.utils.text import slugify
from django.utils import timezone
from django.template.loader import render_to_string
from products.models import Product, Category, Brand
from orders.models import Order, OrderItem, OrderPayment
from users.models import User
from shops.models import Shop
from .forms import ProductForm, OrderForm
import csv
import json
from datetime import datetime, timedelta
from decimal import Decimal


def staff_required(user):
    """Check if user is staff"""
    return user.is_staff


@login_required
@user_passes_test(staff_required)
def dashboard_home(request):
    """Dashboard home page with comprehensive analytics and visualizations"""
    from .utils import model_registry
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 1. KPI CARDS - Key Performance Indicators
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    # Products metrics
    products_count = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    out_of_stock_products = Product.objects.filter(
        Q(stock__lte=0) | Q(stock__isnull=True)
    ).count()
    
    # Orders metrics
    orders_count = Order.objects.count()
    pending_orders = Order.objects.filter(status=Order.OrderStatus.PENDING).count()
    processing_orders = Order.objects.filter(status=Order.OrderStatus.PROCESSING).count()
    completed_orders = Order.objects.filter(status=Order.OrderStatus.DELIVERED).count()
    
    # Revenue calculation
    total_revenue = Order.objects.filter(
        payment_status=Order.PaymentStatus.PAID
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    # Users metrics
    total_users = User.objects.count()
    total_customers = User.objects.filter(user_type='CUSTOMER').count()
    total_sellers = User.objects.filter(user_type='SELLER').count()
    
    # Shops metrics
    total_shops = Shop.objects.count()
    active_shops = Shop.objects.filter(is_active=True).count()
    
    # Average order value
    avg_order_value = Order.objects.filter(
        payment_status=Order.PaymentStatus.PAID
    ).aggregate(
        avg=Avg('total_amount')
    )['avg'] or Decimal('0.00')
    
    # Recent 30 days comparison
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_orders = Order.objects.filter(ordered_at__gte=thirty_days_ago).count()
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 2. PIE CHARTS DATA
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    # Order Status Distribution
    order_status_data = Order.objects.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    order_status_labels = []
    order_status_series = []
    for item in order_status_data:
        status_label = dict(Order.OrderStatus.choices).get(item['status'], item['status'])
        order_status_labels.append(status_label)
        order_status_series.append(item['count'])
    
    # Product Category Distribution
    category_data = Product.objects.filter(
        is_active=True
    ).values(
        'sub_category__category__name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:6]
    
    category_labels = []
    category_series = []
    for item in category_data:
        category_name = item['sub_category__category__name'] or 'Uncategorized'
        category_labels.append(category_name)
        category_series.append(item['count'])
    
    # Payment Method Distribution
    payment_method_data = OrderPayment.objects.values('payment_method').annotate(
        count=Count('id')
    ).order_by('-count')
    
    payment_method_labels = []
    payment_method_series = []
    for item in payment_method_data:
        payment_method_labels.append(item['payment_method'] or 'Unknown')
        payment_method_series.append(item['count'])
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 3. BAR CHARTS DATA
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    # Orders per Day (Last 7 Days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    orders_per_day = Order.objects.filter(
        ordered_at__gte=seven_days_ago
    ).annotate(
        date=TruncDate('ordered_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    orders_daily_labels = []
    orders_daily_series = []
    for item in orders_per_day:
        orders_daily_labels.append(item['date'].strftime('%b %d'))
        orders_daily_series.append(item['count'])
    
    # Revenue per Month (Last 6 Months)
    six_months_ago = timezone.now() - timedelta(days=180)
    revenue_per_month = Order.objects.filter(
        payment_status=Order.PaymentStatus.PAID,
        ordered_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('ordered_at')
    ).values('month').annotate(
        total=Sum('total_amount')
    ).order_by('month')
    
    revenue_monthly_labels = []
    revenue_monthly_series = []
    for item in revenue_per_month:
        revenue_monthly_labels.append(item['month'].strftime('%b %Y'))
        revenue_monthly_series.append(float(item['total']))
    
    # Top 5 Selling Products
    top_products = OrderItem.objects.values(
        'product__name'
    ).annotate(
        total_quantity=Sum('quantity')
    ).order_by('-total_quantity')[:5]
    
    top_products_labels = []
    top_products_series = []
    for item in top_products:
        product_name = item['product__name'] or 'Unknown Product'
        if len(product_name) > 30:
            product_name = product_name[:27] + '...'
        top_products_labels.append(product_name)
        top_products_series.append(item['total_quantity'])
    
    # Top 5 Brands by Product Count
    top_brands = Product.objects.filter(
        is_active=True,
        brand__isnull=False
    ).values(
        'brand__name'
    ).annotate(
        product_count=Count('id')
    ).order_by('-product_count')[:5]
    
    top_brands_labels = []
    top_brands_series = []
    for item in top_brands:
        top_brands_labels.append(item['brand__name'])
        top_brands_series.append(item['product_count'])
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 4. MODEL REGISTRY STATS
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    model_stats = []
    for app_label, app_data in model_registry.get_all_apps().items():
        for model_name, model_meta in app_data['models'].items():
            try:
                model = model_meta['model']
                count = model.objects.count()
                model_stats.append({
                    'app_label': app_label,
                    'model_name': model_name,
                    'verbose_name': model_meta['verbose_name'],
                    'verbose_name_plural': model_meta['verbose_name_plural'],
                    'count': count,
                    'url': f'/dashboard/model/{app_label}/{model_name}/',
                })
            except:
                pass
    
    # Sort by count descending
    model_stats.sort(key=lambda x: x['count'], reverse=True)
    
    context = {
        # Basic KPIs
        'products_count': products_count,
        'active_products': active_products,
        'out_of_stock_products': out_of_stock_products,
        'orders_count': orders_count,
        'pending_orders': pending_orders,
        'processing_orders': processing_orders,
        'completed_orders': completed_orders,
        'total_revenue': total_revenue,
        'total_users': total_users,
        'total_customers': total_customers,
        'total_sellers': total_sellers,
        'total_shops': total_shops,
        'active_shops': active_shops,
        'avg_order_value': avg_order_value,
        'recent_orders': recent_orders,
        
        # Pie Charts - JSON encoded for JavaScript
        'order_status_labels': json.dumps(order_status_labels),
        'order_status_series': json.dumps(order_status_series),
        'category_labels': json.dumps(category_labels),
        'category_series': json.dumps(category_series),
        'payment_method_labels': json.dumps(payment_method_labels),
        'payment_method_series': json.dumps(payment_method_series),
        
        # Bar Charts - JSON encoded for JavaScript
        'orders_daily_labels': json.dumps(orders_daily_labels),
        'orders_daily_series': json.dumps(orders_daily_series),
        'revenue_monthly_labels': json.dumps(revenue_monthly_labels),
        'revenue_monthly_series': json.dumps(revenue_monthly_series),
        'top_products_labels': json.dumps(top_products_labels),
        'top_products_series': json.dumps(top_products_series),
        'top_brands_labels': json.dumps(top_brands_labels),
        'top_brands_series': json.dumps(top_brands_series),
        
        # Model Registry
        'model_stats': model_stats,
    }
    return render(request, 'dashboard/home.html', context)


# @login_required
# @user_passes_test(staff_required)
# def product_list(request):
#     """List all products with search and filter"""
#     from products.models import Category
    
#     query = request.GET.get('q', '')
#     category_filter = request.GET.get('category', '')
#     status_filter = request.GET.get('status', '')
    
#     products = Product.objects.select_related('shop', 'brand', 'sub_category').order_by('-created_at')
    
#     if query:
#         products = products.filter(
#             Q(name__icontains=query) |
#             Q(slug__icontains=query) |
#             Q(shop__name__icontains=query)
#         )
    
#     if category_filter:
#         products = products.filter(sub_category__category_id=category_filter)
    
#     if status_filter == 'active':
#         products = products.filter(is_active=True)
#     elif status_filter == 'inactive':
#         products = products.filter(is_active=False)
    
#     # Get all categories for filter dropdown
#     categories = Category.objects.all().order_by('name')
    
#     # If HTMX request, return only the table body
#     if request.headers.get('HX-Request'):
#         return render(request, 'dashboard/products/partials/product_table.html', {'products': products})
    
#     return render(request, 'dashboard/products/list.html', {
#         'products': products, 
#         'query': query,
#         'categories': categories,
#         'category_filter': category_filter,
#         'status_filter': status_filter,
#     })
@login_required
@user_passes_test(staff_required)
def product_list(request):
    """List all products with search and filter"""
    from products.models import Category, SubCategory
 
    query           = request.GET.get('q', '')
    category_filter = request.GET.get('category', '')
    sub_filter      = request.GET.get('sub_category', '')
    status_filter   = request.GET.get('status', '')
 
    products = Product.objects.select_related(
        'shop', 'brand', 'sub_category', 'sub_category__category'
    ).order_by('-created_at')
 
    if query:
        products = products.filter(
            Q(name__icontains=query) |
            Q(slug__icontains=query) |
            Q(shop__name__icontains=query)
        )
 
    if category_filter:
        products = products.filter(sub_category__category_id=category_filter)
 
    if sub_filter:
        products = products.filter(sub_category_id=sub_filter)
 
    if status_filter == 'active':
        products = products.filter(is_active=True)
    elif status_filter == 'inactive':
        products = products.filter(is_active=False)
 
    categories    = Category.objects.all().order_by('name')
    subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
 
    # ✅ FIX: HTMX request এও categories pass করো
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/products/partials/product_table.html', {
            'products': products,
            'categories': categories,
            'subcategories': subcategories,
            'category_filter': category_filter,
            'sub_filter': sub_filter,
            'status_filter': status_filter,
            'query': query,
        })
 
    return render(request, 'dashboard/products/list.html', {
        'products': products,
        'query': query,
        'categories': categories,
        'subcategories': subcategories,
        'category_filter': category_filter,
        'sub_filter': sub_filter,
        'status_filter': status_filter,
    })
    

# @login_required
# @user_passes_test(staff_required)
# def product_create(request):
#     """Create a new product"""
#     if request.method == 'POST':
#         form = ProductForm(request.POST, request.FILES)
#         if form.is_valid():
#             try:
#                 product = form.save(commit=False)
#                 # Auto-generate slug if not provided
#                 if not product.slug:
#                     product.slug = slugify(product.name)
#                 product.save()
#                 # Form's save method handles M2M and new colors/sizes
#                 form.save_m2m()
                
#                 messages.success(request, f'Product "{product.name}" created successfully!')
                
#                 # If HTMX request, return the updated table
#                 if request.headers.get('HX-Request'):
#                     products = Product.objects.select_related('shop', 'brand', 'sub_category').order_by('-created_at')
#                     response = render(request, 'dashboard/products/partials/product_table.html', {'products': products})
#                     # Add trigger to close modal
#                     response['HX-Trigger'] = 'closeModal'
#                     return response
                
#                 return redirect('dashboard:product_list')
#             except Exception as e:
#                 messages.error(request, f'Error creating product: {str(e)}')
#                 # Re-render form with errors
#                 if request.headers.get('HX-Request'):
#                     return render(request, 'dashboard/products/partials/product_form.html', {'form': form, 'action': 'create'})
#         else:
#             # Form validation failed - return form with errors
#             if request.headers.get('HX-Request'):
#                 return render(request, 'dashboard/products/partials/product_form.html', {'form': form, 'action': 'create'})
#     else:
#         form = ProductForm()
    
#     # Return modal content for HTMX
#     if request.headers.get('HX-Request'):
#         return render(request, 'dashboard/products/partials/product_form.html', {'form': form, 'action': 'create'})
    
#     return render(request, 'dashboard/products/form.html', {'form': form, 'action': 'create'})

@login_required
@user_passes_test(staff_required)
def product_create(request):
    """Create a new product"""
    from products.models import Category, SubCategory
 
    all_categories    = Category.objects.all().order_by('name')
    all_subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
 
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                product = form.save(commit=False)
                if not product.slug:
                    product.slug = slugify(product.name)
                product.save()
                form.save_m2m()
 
                messages.success(request, f'Product "{product.name}" created successfully!')
 
                if request.headers.get('HX-Request'):
                    products = Product.objects.select_related(
                        'shop', 'brand', 'sub_category', 'sub_category__category'
                    ).order_by('-created_at')
                    response = render(request, 'dashboard/products/partials/product_table.html', {
                        'products': products,
                    })
                    response['HX-Trigger'] = 'closeModal'
                    return response
 
                return redirect('dashboard:product_list')
 
            except Exception as e:
                messages.error(request, f'Error creating product: {str(e)}')
                if request.headers.get('HX-Request'):
                    return render(request, 'dashboard/products/partials/product_form.html', {
                        'form': form,
                        'action': 'create',
                        'all_categories': all_categories,
                        'all_subcategories': all_subcategories,
                    })
        else:
            if request.headers.get('HX-Request'):
                return render(request, 'dashboard/products/partials/product_form.html', {
                    'form': form,
                    'action': 'create',
                    'all_categories': all_categories,
                    'all_subcategories': all_subcategories,
                })
    else:
        form = ProductForm()
 
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/products/partials/product_form.html', {
            'form': form,
            'action': 'create',
            'all_categories': all_categories,
            'all_subcategories': all_subcategories,
        })
 
    return render(request, 'dashboard/products/form.html', {
        'form': form,
        'action': 'create',
        'all_categories': all_categories,
        'all_subcategories': all_subcategories,
    })
 

@login_required
@user_passes_test(staff_required)
def product_view(request, pk):
    """View product details in a modal (quick view without edit)"""
    product = get_object_or_404(Product.objects.select_related('shop', 'brand', 'sub_category', 'sub_category__category'), pk=pk)
    
    # Return modal content for HTMX
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/products/partials/product_view_modal.html', {'product': product})
    
    return render(request, 'dashboard/products/detail.html', {'product': product})


@login_required
@user_passes_test(staff_required)
def product_print(request, pk):
    """Print/Download product details as PDF-like view"""
    product = get_object_or_404(
        Product.objects.select_related('shop', 'brand', 'sub_category', 'sub_category__category')
        .prefetch_related('colors', 'sizes'),
        pk=pk
    )
    
    context = {
        'product': product,
        'print_view': True,
    }
    
    return render(request, 'dashboard/products/print.html', context)


# @login_required
# @user_passes_test(staff_required)
# def product_edit(request, pk):
#     """Edit an existing product"""
#     product = get_object_or_404(Product, pk=pk)
    
#     if request.method == 'POST':
#         form = ProductForm(request.POST, request.FILES, instance=product)
#         if form.is_valid():
#             try:
#                 product = form.save(commit=False)
#                 # Auto-generate slug if changed
#                 if not product.slug:
#                     product.slug = slugify(product.name)
#                 product.save()
#                 # Form's save method handles M2M and new colors/sizes
#                 form.save_m2m()
                
#                 messages.success(request, f'Product "{product.name}" updated successfully!')
                
#                 # If HTMX request, return updated table
#                 if request.headers.get('HX-Request'):
#                     products = Product.objects.select_related('shop', 'brand', 'sub_category').order_by('-created_at')
#                     response = render(request, 'dashboard/products/partials/product_table.html', {'products': products})
#                     # Add trigger to close modal
#                     response['HX-Trigger'] = 'closeModal'
#                     return response
                
#                 return redirect('dashboard:product_list')
#             except Exception as e:
#                 messages.error(request, f'Error updating product: {str(e)}')
#                 # Re-render form with errors
#                 if request.headers.get('HX-Request'):
#                     return render(request, 'dashboard/products/partials/product_form.html', {
#                         'form': form, 
#                         'action': 'edit', 
#                         'product': product
#                     })
#         else:
#             # Form validation failed - return form with errors
#             if request.headers.get('HX-Request'):
#                 return render(request, 'dashboard/products/partials/product_form.html', {
#                     'form': form, 
#                     'action': 'edit', 
#                     'product': product
#                 })
#     else:
#         form = ProductForm(instance=product)
    
#     # Return modal content for HTMX
#     if request.headers.get('HX-Request'):
#         return render(request, 'dashboard/products/partials/product_form.html', {
#             'form': form, 
#             'action': 'edit', 
#             'product': product
#         })
    
#     return render(request, 'dashboard/products/form.html', {
#         'form': form, 
#         'action': 'edit', 
#         'product': product
#     })

 
@login_required
@user_passes_test(staff_required)
def product_edit(request, pk):
    """Edit an existing product"""
    from products.models import Category, SubCategory
 
    product           = get_object_or_404(Product, pk=pk)
    all_categories    = Category.objects.all().order_by('name')
    all_subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
 
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            try:
                product = form.save(commit=False)
                if not product.slug:
                    product.slug = slugify(product.name)
                product.save()
                form.save_m2m()
 
                messages.success(request, f'Product "{product.name}" updated successfully!')
 
                if request.headers.get('HX-Request'):
                    products = Product.objects.select_related(
                        'shop', 'brand', 'sub_category', 'sub_category__category'
                    ).order_by('-created_at')
                    response = render(request, 'dashboard/products/partials/product_table.html', {
                        'products': products,
                    })
                    response['HX-Trigger'] = 'closeModal'
                    return response
 
                return redirect('dashboard:product_list')
 
            except Exception as e:
                messages.error(request, f'Error updating product: {str(e)}')
                if request.headers.get('HX-Request'):
                    return render(request, 'dashboard/products/partials/product_form.html', {
                        'form': form,
                        'action': 'edit',
                        'product': product,
                        'all_categories': all_categories,
                        'all_subcategories': all_subcategories,
                    })
        else:
            if request.headers.get('HX-Request'):
                return render(request, 'dashboard/products/partials/product_form.html', {
                    'form': form,
                    'action': 'edit',
                    'product': product,
                    'all_categories': all_categories,
                    'all_subcategories': all_subcategories,
                })
    else:
        form = ProductForm(instance=product)
 
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/products/partials/product_form.html', {
            'form': form,
            'action': 'edit',
            'product': product,
            'all_categories': all_categories,
            'all_subcategories': all_subcategories,
        })
 
    return render(request, 'dashboard/products/form.html', {
        'form': form,
        'action': 'edit',
        'product': product,
        'all_categories': all_categories,
        'all_subcategories': all_subcategories,
    })
 

@login_required
@user_passes_test(staff_required)
@require_http_methods(["DELETE", "POST", "GET"])
def product_delete(request, pk):
    """Delete a product"""
    product = get_object_or_404(Product, pk=pk)
    
    # For GET requests, show confirmation modal
    if request.method == 'GET':
        if request.headers.get('HX-Request'):
            return render(request, 'dashboard/products/partials/product_delete_modal.html', {'product': product})
        return redirect('dashboard:product_list')
    
    # For DELETE/POST, actually delete the product
    product_name = product.name
    product.delete()
    
    messages.success(request, f'Product "{product_name}" deleted successfully!')
    
    # If HTMX request, return updated table
    if request.headers.get('HX-Request'):
        products = Product.objects.select_related('shop', 'brand', 'sub_category').order_by('-created_at')
        return render(request, 'dashboard/products/partials/product_table.html', {'products': products})
    
    return redirect('dashboard:product_list')


# ============================================================================
# ORDERS CRUD VIEWS
# ============================================================================


@login_required
@user_passes_test(staff_required)
def order_list(request):
    """List all orders with search and filter"""
    query = request.GET.get('q', '')
    status_filter = request.GET.get('status', '')
    payment_status_filter = request.GET.get('payment_status', '')
    
    orders = Order.objects.select_related('user', 'shipping_address', 'shipping_method').order_by('-ordered_at')
    
    if query:
        orders = orders.filter(
            Q(order_number__icontains=query) |
            Q(customer_name__icontains=query) |
            Q(customer_email__icontains=query) |
            Q(customer_phone__icontains=query)
        )
    
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    if payment_status_filter:
        orders = orders.filter(payment_status=payment_status_filter)
    
    # If HTMX request, return only the table body
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/orders/partials/order_table.html', {
            'orders': orders,
            'status_filter': status_filter,
            'payment_status_filter': payment_status_filter,
            'order_statuses': Order.OrderStatus.choices,
            'payment_statuses': Order.PaymentStatus.choices,
        })
    
    return render(request, 'dashboard/orders/list.html', {
        'orders': orders,
        'query': query,
        'status_filter': status_filter,
        'payment_status_filter': payment_status_filter,
        'order_statuses': Order.OrderStatus.choices,
        'payment_statuses': Order.PaymentStatus.choices,
    })


@login_required
@user_passes_test(staff_required)
def order_detail(request, pk):
    """View order details with items - returns modal for HTMX or full page"""
    order = get_object_or_404(Order, pk=pk)
    order_items = order.items.select_related('product', 'color', 'size')
    
    context = {
        'order': order,
        'order_items': order_items,
    }
    
    # If HTMX request, return modal content
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/orders/partials/order_detail_modal.html', context)
    
    return render(request, 'dashboard/orders/detail.html', context)


@login_required
@user_passes_test(staff_required)
def order_create(request):
    """Create a new order"""
    if request.method == 'POST':
        form = OrderForm(request.POST)
        if form.is_valid():
            order = form.save()
            messages.success(request, f'Order "{order.order_number}" created successfully!')
            
            # If HTMX request, return updated table
            if request.headers.get('HX-Request'):
                orders = Order.objects.select_related('user', 'shipping_address', 'shipping_method').order_by('-ordered_at')
                return render(request, 'dashboard/orders/partials/order_table.html', {
                    'orders': orders,
                    'order_statuses': Order.OrderStatus.choices,
                    'payment_statuses': Order.PaymentStatus.choices,
                })
            
            return redirect('dashboard:order_list')
    else:
        form = OrderForm()
    
    # Return modal content for HTMX
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/orders/partials/order_form_modal.html', {
            'form': form,
            'action': 'create'
        })
    
    return render(request, 'dashboard/orders/form.html', {'form': form, 'action': 'create'})


@login_required
@user_passes_test(staff_required)
def order_edit(request, pk):
    """Edit an existing order"""
    from accounts.notifications import send_order_status_notification

    order = get_object_or_404(Order, pk=pk)
    old_status = order.status  # snapshot before any save

    if request.method == 'POST':
        form = OrderForm(request.POST, instance=order)
        if form.is_valid():
            order = form.save()
            # Send notification if status changed
            if order.status != old_status:
                send_order_status_notification(order)
            messages.success(request, f'Order "{order.order_number}" updated successfully!')
            
            # If HTMX request, return updated table
            if request.headers.get('HX-Request'):
                orders = Order.objects.select_related('user', 'shipping_address', 'shipping_method').order_by('-ordered_at')
                return render(request, 'dashboard/orders/partials/order_table.html', {
                    'orders': orders,
                    'order_statuses': Order.OrderStatus.choices,
                    'payment_statuses': Order.PaymentStatus.choices,
                })
            
            return redirect('dashboard:order_list')
    else:
        form = OrderForm(instance=order)
    
    # Return modal content for HTMX
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/orders/partials/order_form_modal.html', {
            'form': form,
            'action': 'edit',
            'order': order
        })
    
    return render(request, 'dashboard/orders/form.html', {
        'form': form,
        'action': 'edit',
        'order': order
    })


@login_required
@user_passes_test(staff_required)
@require_http_methods(["DELETE", "POST"])
def order_delete(request, pk):
    """Delete an order"""
    order = get_object_or_404(Order, pk=pk)
    order_number = order.order_number
    
    # For DELETE method via HTMX, confirm and delete
    if request.method in ['DELETE', 'POST']:
        order.delete()
        messages.success(request, f'Order "{order_number}" deleted successfully!')
        
        # If HTMX request, return updated table
        if request.headers.get('HX-Request'):
            orders = Order.objects.select_related('user', 'shipping_address', 'shipping_method').order_by('-ordered_at')
            return render(request, 'dashboard/orders/partials/order_table.html', {
                'orders': orders,
                'order_statuses': Order.OrderStatus.choices,
                'payment_statuses': Order.PaymentStatus.choices,
            })
        
        return redirect('dashboard:order_list')
    
    # For GET, show confirmation modal
    if request.headers.get('HX-Request'):
        return render(request, 'dashboard/orders/partials/delete_confirmation_modal.html', {
            'order': order
        })
    
    return redirect('dashboard:order_list')


@login_required
@user_passes_test(staff_required)
@require_http_methods(["POST"])
def order_update_status(request, pk):
    """Update order status inline from list"""
    from accounts.notifications import send_order_status_notification

    order = get_object_or_404(Order, pk=pk)
    new_status = request.POST.get('status', order.status)
    old_status = order.status

    if new_status in dict(Order.OrderStatus.choices):
        order.status = new_status
        order.save()
        # Send notification to the customer if status changed
        if new_status != old_status:
            send_order_status_notification(order)
        messages.success(request, f'Order #{order.order_number} status updated to {order.get_status_display()}')
    
    # Return updated order table
    orders = Order.objects.select_related('user', 'shipping_address', 'shipping_method').order_by('-ordered_at')
    return render(request, 'dashboard/orders/partials/order_table.html', {
        'orders': orders,
        'order_statuses': Order.OrderStatus.choices,
        'payment_statuses': Order.PaymentStatus.choices,
    })


@login_required
@user_passes_test(staff_required)
def order_print(request, pk):
    """Print/Download order details as PDF-like view"""
    order = get_object_or_404(Order, pk=pk)
    order_items = order.items.select_related('product', 'color', 'size')
    
    context = {
        'order': order,
        'order_items': order_items,
        'print_view': True,
    }
    
    return render(request, 'dashboard/orders/print.html', context)


@login_required
@user_passes_test(staff_required)
def order_export_csv(request):
    """Export orders to CSV"""
    # Get filter parameters
    query = request.GET.get('q', '')
    status_filter = request.GET.get('status', '')
    payment_status_filter = request.GET.get('payment_status', '')
    
    orders = Order.objects.select_related('user', 'shipping_address', 'shipping_method').order_by('-ordered_at')
    
    # Apply filters
    if query:
        orders = orders.filter(
            Q(order_number__icontains=query) |
            Q(customer_name__icontains=query) |
            Q(customer_email__icontains=query) |
            Q(customer_phone__icontains=query)
        )
    
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    if payment_status_filter:
        orders = orders.filter(payment_status=payment_status_filter)
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="orders_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Order Number', 'Customer Name', 'Email', 'Phone', 'Total Amount', 'Status', 'Payment Status', 'Order Date'])
    
    for order in orders:
        writer.writerow([
            order.order_number,
            order.customer_name,
            order.customer_email,
            order.customer_phone,
            f"{order.total_amount:.2f}",
            order.get_status_display(),
            order.get_payment_status_display(),
            order.ordered_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])
    
    return response


@login_required
@user_passes_test(staff_required)
def product_export_csv(request):
    """Export products to CSV"""
    query = request.GET.get('q', '')
    products = Product.objects.select_related('shop', 'brand', 'sub_category').order_by('-created_at')
    
    if query:
        products = products.filter(
            Q(name__icontains=query) |
            Q(slug__icontains=query) |
            Q(shop__name__icontains=query)
        )
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="products_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['ID', 'Name', 'Slug', 'Shop', 'Category', 'Sub Category', 'Price', 'Discount Price', 'Stock', 'Status', 'Created Date'])
    
    for product in products:
        writer.writerow([
            str(product.id),
            product.name,
            product.slug,
            product.shop.name,
            product.sub_category.category.name,
            product.sub_category.name,
            f"{product.price:.2f}",
            f"{product.discount_price:.2f}" if product.discount_price else '',
            product.stock,
            'Active' if product.is_active else 'Inactive',
            product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])
    
    return response

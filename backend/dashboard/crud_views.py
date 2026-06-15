"""
Generic CRUD Views - PRODUCTION GRADE
Handles ALL models automatically using introspection
HTMX-powered, no page reloads
With full export/import capabilities
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from django.db import models
from django.forms import modelform_factory
from django.views.decorators.http import require_http_methods
import csv
import io

from .model_inspector import ModelInspector, ModelDataFormatter
from .config import DEFAULT_PAGE_SIZE, user_has_model_permission
from .export_engine import ModelExporter
from .import_engine import ModelImporter, ImportResult


def jwt_or_session_required(view_func):
    """Decorator that allows access if user is authenticated via session OR JWT token."""
    from functools import wraps
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                auth_result = jwt_auth.authenticate(request)
                if auth_result:
                    user, token = auth_result
                    if user and user.is_active:
                        request.user = user
                        return view_func(request, *args, **kwargs)
            except Exception:
                pass
                
        from django.http import JsonResponse
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    return _wrapped_view


def apply_bootstrap_form_styling(form):
    """Apply Bootstrap 5 classes to form widgets dynamically"""
    for field_name, field in form.fields.items():
        widget = field.widget
        widget_class = widget.__class__.__name__
        
        # Get existing classes or create empty dict
        attrs = widget.attrs if hasattr(widget, 'attrs') else {}
        existing_classes = attrs.get('class', '')
        
        # Apply Bootstrap classes based on widget type
        if widget_class in ['TextInput', 'EmailInput', 'URLInput', 'NumberInput', 'PasswordInput']:
            attrs['class'] = f'{existing_classes} form-control'.strip()
        elif widget_class == 'Textarea':
            attrs['class'] = f'{existing_classes} form-control'.strip()
            if 'rows' not in attrs:
                attrs['rows'] = 4
        elif widget_class in ['Select', 'SelectMultiple']:
            attrs['class'] = f'{existing_classes} form-select'.strip()
        elif widget_class == 'CheckboxInput':
            attrs['class'] = f'{existing_classes} form-check-input'.strip()
        elif widget_class in ['FileInput', 'ClearableFileInput']:
            attrs['class'] = f'{existing_classes} form-control'.strip()
        elif widget_class in ['DateInput', 'DateTimeInput', 'TimeInput']:
            attrs['class'] = f'{existing_classes} form-control'.strip()
            # Add HTML5 input types
            if widget_class == 'DateInput':
                attrs['type'] = 'date'
            elif widget_class == 'DateTimeInput':
                attrs['type'] = 'datetime-local'
            elif widget_class == 'TimeInput':
                attrs['type'] = 'time'
        
        # Add placeholder hints for specific input types
        if widget_class == 'EmailInput':
            attrs.setdefault('placeholder', 'example@email.com')
        elif widget_class == 'URLInput':
            attrs.setdefault('placeholder', 'https://example.com')
        
        # Apply the updated attributes
        widget.attrs = attrs
    
    return form


@login_required
def dashboard_home(request):
    """Dashboard homepage with statistics"""
    from django.apps import apps
    from .model_inspector import get_model_groups
    
    # Get statistics
    stats = []
    
    # Orders
    try:
        Order = apps.get_model('orders', 'Order')
        pending_orders = Order.objects.filter(status='PENDING').count()
        processing_orders = Order.objects.filter(status='PROCESSING').count()
        total_orders = Order.objects.count()
        
        stats.append({
            'title': 'Pending Orders',
            'value': pending_orders,
            'icon': 'bi-cart-x',
            'color': 'warning',
            'url': '/dashboard/orders/order/?status=PENDING'
        })
        
        stats.append({
            'title': 'Processing Orders',
            'value': processing_orders,
            'icon': 'bi-arrow-repeat',
            'color': 'info',
            'url': '/dashboard/orders/order/?status=PROCESSING'
        })
        
        stats.append({
            'title': 'Total Orders',
            'value': total_orders,
            'icon': 'bi-cart-check',
            'color': 'success',
            'url': '/dashboard/orders/order/'
        })
    except:
        pass
    
    # Products
    try:
        Product = apps.get_model('products', 'Product')
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(stock__lt=10).count()
        
        stats.append({
            'title': 'Total Products',
            'value': total_products,
            'icon': 'bi-box-seam',
            'color': 'primary',
            'url': '/dashboard/products/product/'
        })
        
        stats.append({
            'title': 'Active Products',
            'value': active_products,
            'icon': 'bi-check-circle',
            'color': 'success',
            'url': '/dashboard/products/product/?is_active=true'
        })
        
        stats.append({
            'title': 'Low Stock',
            'value': low_stock,
            'icon': 'bi-exclamation-triangle',
            'color': 'danger',
            'url': '/dashboard/products/product/?stock__lt=10'
        })
    except:
        pass
    
    # Users
    try:
        User = apps.get_model('users', 'User')
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        stats.append({
            'title': 'Total Users',
            'value': total_users,
            'icon': 'bi-people',
            'color': 'primary',
            'url': '/dashboard/users/user/'
        })
        
        stats.append({
            'title': 'Active Users',
            'value': active_users,
            'icon': 'bi-person-check',
            'color': 'success',
            'url': '/dashboard/users/user/?is_active=true'
        })
    except:
        pass
    
    context = {
        'stats': stats,
        'model_groups': get_model_groups(),
    }
    
    return render(request, 'dashboard/home.html', context)


@login_required
def model_list(request, app_label, model_name):
    """Generic list view for any model"""
    
    # Get model
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        messages.error(request, f'Model {app_label}.{model_name} not found')
        return redirect('dashboard:home')
    
    # Check permission
    if not user_has_model_permission(request.user, model, 'view'):
        messages.error(request, 'You do not have permission to view this resource')
        return redirect('dashboard:home')
    
    # Get queryset
    queryset = model.objects.all()
    
    # Search
    search_query = request.GET.get('q', '').strip()
    if search_query:
        searchable_fields = ModelInspector.get_searchable_fields(model)
        if searchable_fields:
            q_objects = Q()
            for field_name in searchable_fields:
                q_objects |= Q(**{f'{field_name}__icontains': search_query})
            queryset = queryset.filter(q_objects)
    
    # Filters
    for field in ModelInspector.get_filterable_fields(model):
        filter_value = request.GET.get(field.name)
        if filter_value:
            queryset = queryset.filter(**{field.name: filter_value})
    
    # Ordering
    order_by = request.GET.get('order_by', '-pk')
    queryset = queryset.order_by(order_by)
    
    # Pagination
    page_size = int(request.GET.get('page_size', DEFAULT_PAGE_SIZE))
    page = request.GET.get('page', 1)
    
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)
    
    # Get fields for display
    display_fields = ModelInspector.get_list_display_fields(model)
    
    # Format data for template
    table_data = []
    for obj in page_obj:
        row = {
            'object': obj,
            'pk': obj.pk,
            'cells': []
        }
        
        for field in display_fields:
            row['cells'].append({
                'field': field,
                'value': ModelDataFormatter.format_field_value(obj, field)
            })
        
        table_data.append(row)
    
    # Prepare filterable fields with related model querysets
    filterable_fields_data = []
    for field in ModelInspector.get_filterable_fields(model):
        field_data = {
            'field': field,
            'name': field.name,
            'verbose_name': field.verbose_name,
            'type': field.get_internal_type(),
        }
        
        # For ForeignKey, get the related queryset
        if isinstance(field, models.ForeignKey):
            try:
                field_data['choices'] = field.related_model.objects.all()[:100]  # Limit to 100 for performance
            except Exception:
                field_data['choices'] = []
        
        filterable_fields_data.append(field_data)
    
    context = {
        'app_label': app_label,
        'model_name': model_name,
        'model': model,
        'model_verbose_name': model._meta.verbose_name,
        'model_verbose_name_plural': model._meta.verbose_name_plural,
        'display_fields': display_fields,
        'table_data': table_data,
        'page_obj': page_obj,
        'search_query': search_query,
        'filterable_fields': filterable_fields_data,
        'can_add': user_has_model_permission(request.user, model, 'add'),
        'can_change': user_has_model_permission(request.user, model, 'change'),
        'can_delete': user_has_model_permission(request.user, model, 'delete'),
    }
    
    return render(request, 'dashboard/model_list.html', context)


@login_required
@require_http_methods(["GET", "POST"])
def model_create(request, app_label, model_name):
    """Generic create view for any model"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return JsonResponse({'error': 'Model not found'}, status=404)
    
    if not user_has_model_permission(request.user, model, 'add'):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    if request.method == 'POST':
        # Get editable fields
        editable_fields = [f.name for f in ModelInspector.get_editable_fields(model)]
        
        # Create form
        FormClass = modelform_factory(model, fields=editable_fields)
        form = FormClass(request.POST, request.FILES)
        form = apply_bootstrap_form_styling(form)
        
        if form.is_valid():
            obj = form.save()
            
            # Handle additional images for Product model
            if model.__name__ == 'Product' and 'additional_images' in request.FILES:
                from products.models import ProductAdditionalImage
                for image in request.FILES.getlist('additional_images'):
                    ProductAdditionalImage.objects.create(product=obj, image=image)
            
            messages.success(request, f'{model._meta.verbose_name} created successfully')
            
            # Check if AJAX request (either HTMX or standard XHR)
            if request.headers.get('HX-Request') or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                # Return JSON with redirect URL for JavaScript to handle
                return JsonResponse({
                    'success': True,
                    'message': f'{model._meta.verbose_name} created successfully',
                    'redirect': f'/dashboard/{app_label}/{model_name}/'
                })
            
            return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)
        else:
            # Return form with errors
            context = {
                'form': form,
                'model': model,
                'app_label': app_label,
                'model_name': model_name,
                'model_name_verbose': model._meta.verbose_name,
                'model_name_verbose_plural': model._meta.verbose_name_plural,
                'action': 'create',
            }
            return render(request, 'dashboard/model_form.html', context)
    
    # GET request - show empty form
    editable_fields = [f.name for f in ModelInspector.get_editable_fields(model)]
    FormClass = modelform_factory(model, fields=editable_fields)
    form = FormClass()
    form = apply_bootstrap_form_styling(form)
    
    context = {
        'form': form,
        'model': model,
        'app_label': app_label,
        'model_name': model_name,
        'model_name_verbose': model._meta.verbose_name,
        'model_name_verbose_plural': model._meta.verbose_name_plural,
        'action': 'create',
    }
    
    return render(request, 'dashboard/model_form.html', context)


@login_required
@require_http_methods(["GET", "POST"])
def model_update(request, app_label, model_name, pk):
    """Generic update view for any model"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return JsonResponse({'error': 'Model not found'}, status=404)
    
    obj = get_object_or_404(model, pk=pk)
    
    if not user_has_model_permission(request.user, model, 'change'):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    if request.method == 'POST':
        editable_fields = [f.name for f in ModelInspector.get_editable_fields(model)]
        FormClass = modelform_factory(model, fields=editable_fields)
        form = FormClass(request.POST, request.FILES, instance=obj)
        form = apply_bootstrap_form_styling(form)
        
        if form.is_valid():
            updated_obj = form.save()
            
            # Handle additional images for Product model
            if model.__name__ == 'Product' and 'additional_images' in request.FILES:
                from products.models import ProductAdditionalImage
                for image in request.FILES.getlist('additional_images'):
                    ProductAdditionalImage.objects.create(product=updated_obj, image=image)
            
            messages.success(request, f'{model._meta.verbose_name} updated successfully')
            
            # Check if AJAX request (either HTMX or standard XHR)
            if request.headers.get('HX-Request') or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                # Return JSON with redirect URL for JavaScript to handle
                return JsonResponse({
                    'success': True,
                    'message': f'{model._meta.verbose_name} updated successfully',
                    'redirect': f'/dashboard/{app_label}/{model_name}/'
                })
            
            return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)
        else:
            context = {
                'form': form,
                'model': model,
                'app_label': app_label,
                'model_name': model_name,
                'model_name_verbose': model._meta.verbose_name,
                'model_name_verbose_plural': model._meta.verbose_name_plural,
                'object': obj,
                'action': 'update',
            }
            return render(request, 'dashboard/model_form.html', context)
    
    # GET request
    editable_fields = [f.name for f in ModelInspector.get_editable_fields(model)]
    FormClass = modelform_factory(model, fields=editable_fields)
    form = FormClass(instance=obj)
    form = apply_bootstrap_form_styling(form)
    
    context = {
        'form': form,
        'model': model,
        'app_label': app_label,
        'model_name': model_name,
        'model_name_verbose': model._meta.verbose_name,
        'model_name_verbose_plural': model._meta.verbose_name_plural,
        'object': obj,
        'action': 'update',
    }
    
    return render(request, 'dashboard/model_form.html', context)


@login_required
@require_http_methods(["POST"])
def model_delete(request, app_label, model_name, pk):
    """Generic delete view for any model"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return JsonResponse({'error': 'Model not found'}, status=404)
    
    obj = get_object_or_404(model, pk=pk)
    
    if not user_has_model_permission(request.user, model, 'delete'):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    obj_str = str(obj)
    obj.delete()
    
    messages.success(request, f'{model._meta.verbose_name} "{obj_str}" deleted successfully')
    
    if request.headers.get('HX-Request'):
        # Return empty response to remove the row via hx-target
        return HttpResponse(status=200, content='')
    
    return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)


@jwt_or_session_required
def model_export_csv(request, app_label, model_name):
    """Export model data to CSV"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    queryset = model.objects.all()
    return ModelExporter.export_to_csv(queryset, model)


@jwt_or_session_required
def model_export_excel(request, app_label, model_name):
    """Export model data to Excel"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    queryset = model.objects.all()
    
    try:
        return ModelExporter.export_to_excel(queryset, model)
    except ImportError:
        messages.error(request, 'Excel export requires openpyxl package')
        return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)


@jwt_or_session_required
def model_export_single_csv(request, app_label, model_name, pk):
    """Export single record to CSV"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    obj = get_object_or_404(model, pk=pk)
    return ModelExporter.export_single_record(obj, format='csv')


@jwt_or_session_required
def model_export_single_excel(request, app_label, model_name, pk):
    """Export single record to Excel"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    obj = get_object_or_404(model, pk=pk)
    
    try:
        return ModelExporter.export_single_record(obj, format='excel')
    except ImportError:
        messages.error(request, 'Excel export requires openpyxl package')
        return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)


@login_required
def model_download_single(request, app_label, model_name, pk):
    """Download single record (same as export single CSV for now)"""
    return model_export_single_csv(request, app_label, model_name, pk)


@jwt_or_session_required
def model_bulk_export_csv(request, app_label, model_name):
    """Bulk export selected records to CSV"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    # Get selected IDs
    ids = request.GET.get('ids', '').split(',')
    ids = [id.strip() for id in ids if id.strip()]
    
    if not ids:
        return HttpResponse('No items selected', status=400)
    
    queryset = model.objects.filter(pk__in=ids)
    return ModelExporter.export_to_csv(queryset, model)


@jwt_or_session_required
def model_bulk_export_excel(request, app_label, model_name):
    """Bulk export selected records to Excel"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    # Get selected IDs
    ids = request.GET.get('ids', '').split(',')
    ids = [id.strip() for id in ids if id.strip()]
    
    if not ids:
        return HttpResponse('No items selected', status=400)
    
    queryset = model.objects.filter(pk__in=ids)
    
    try:
        return ModelExporter.export_to_excel(queryset, model)
    except ImportError:
        messages.error(request, 'Excel export requires openpyxl package')
        return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)


@login_required
@require_http_methods(["POST"])
def model_bulk_delete(request, app_label, model_name):
    """Bulk delete selected records"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'delete'):
        return HttpResponse('Permission denied', status=403)
    
    # Get selected IDs
    ids = request.POST.get('ids', '').split(',')
    ids = [id.strip() for id in ids if id.strip()]
    
    if not ids:
        messages.error(request, 'No items selected')
        return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)
    
    # Delete
    count = model.objects.filter(pk__in=ids).delete()[0]
    messages.success(request, f'Successfully deleted {count} {model._meta.verbose_name_plural}')
    
    return redirect('dashboard:model_list', app_label=app_label, model_name=model_name)


@jwt_or_session_required
def model_export_template(request, app_label, model_name):
    """Download import template (CSV or Excel)"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    format_type = request.GET.get('format', 'csv')
    
    try:
        return ModelExporter.generate_import_template(model, format=format_type)
    except ImportError:
        # Fallback to CSV if openpyxl not available
        return ModelExporter.generate_import_template(model, format='csv')


@login_required
@require_http_methods(["GET", "POST"])
def model_import(request, app_label, model_name):
    """Import data from CSV/Excel"""
    
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return JsonResponse({'error': 'Model not found'}, status=404)
    
    if not user_has_model_permission(request.user, model, 'add'):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    if request.method == 'POST':
        # Handle file upload
        if 'import_file' not in request.FILES:
            return render(request, 'dashboard/import_results.html', {
                'error': 'No file uploaded'
            })
        
        file_obj = request.FILES['import_file']
        update_existing = request.POST.get('update_existing') == 'on'
        skip_errors = request.POST.get('skip_errors') == 'on'
        
        try:
            # Parse file
            rows = ModelImporter.parse_uploaded_file(file_obj)
            
            if not rows:
                return render(request, 'dashboard/import_results.html', {
                    'error': 'No data found in file'
                })
            
            # Import data
            if skip_errors:
                result = ModelImporter.import_data(model, rows, update_existing, skip_errors=True)
            else:
                result = ModelImporter.import_with_transaction(model, rows, update_existing, skip_errors=False)
            
            summary = result.get_summary()
            
            return render(request, 'dashboard/import_results.html', {
                'success': True,
                'summary': summary,
                'model_verbose_name': model._meta.verbose_name,
                'app_label': app_label,
                'model_name': model_name,
            })
            
        except Exception as e:
            return render(request, 'dashboard/import_results.html', {
                'error': str(e)
            })
    
    # GET - show import form
    context = {
        'model': model,
        'app_label': app_label,
        'model_name': model_name,
        'model_verbose_name': model._meta.verbose_name,
        'model_verbose_name_plural': model._meta.verbose_name_plural,
    }
    
    return render(request, 'dashboard/model_import.html', context)


@login_required
def model_detail(request, app_label, model_name, pk):
    """Generic object detail view (modal or full page)"""
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return JsonResponse({'error': 'Model not found'}, status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    obj = get_object_or_404(model, pk=pk)
    
    # Show all listable fields and relations for detail view
    detail_fields = ModelInspector.get_list_display_fields(model)
    
    # Get related data
    related_data = {}
    for related_obj in model._meta.related_objects:
        if related_obj.related_name:
            try:
                related_queryset = getattr(obj, related_obj.related_name).all()
                if related_queryset.exists():
                    related_data[related_obj.related_name] = list(related_queryset)
            except:
                pass
    
    context = {
        'object': obj,
        'model': model,
        'app_label': app_label,
        'model_name': model_name,
        'model_name_verbose': model._meta.verbose_name,
        'model_name_verbose_plural': model._meta.verbose_name_plural,
        'detail_fields': detail_fields,
        'related_data': related_data,
        'can_change': user_has_model_permission(request.user, model, 'change'),
    }
    
    return render(request, 'dashboard/model_detail.html', context)


@login_required
def model_print(request, app_label, model_name, pk):
    """Print-friendly view for an object"""
    # Reuse model_detail but render a print-ready template
    model = ModelInspector.get_model(app_label, model_name)
    if not model:
        return HttpResponse('Model not found', status=404)
    
    if not user_has_model_permission(request.user, model, 'view'):
        return HttpResponse('Permission denied', status=403)
    
    obj = get_object_or_404(model, pk=pk)
    detail_fields = ModelInspector.get_list_display_fields(model)
    
    context = {
        'object': obj,
        'model': model,
        'model_name_verbose': model._meta.verbose_name,
        'model_name_verbose_plural': model._meta.verbose_name_plural,
        'detail_fields': detail_fields,
    }
    
    return render(request, 'dashboard/print_detail.html', context)


@login_required
@require_http_methods(['POST'])
def order_update_status(request, pk):
    """Specific action to update an Order's status. Expects POST 'status' param"""
    from django.apps import apps
    Order = apps.get_model('orders', 'Order')
    order = get_object_or_404(Order, pk=pk)
    
    if not user_has_model_permission(request.user, Order, 'change'):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    new_status = request.POST.get('status')
    if not new_status:
        return JsonResponse({'error': 'Missing status'}, status=400)
    
    # Validate status
    if new_status not in [choice[0] for choice in Order.OrderStatus.choices]:
        return JsonResponse({'error': 'Invalid status'}, status=400)
    
    order.status = new_status
    order.save()
    
    messages.success(request, f'Order {order.order_number} status updated to {order.get_status_display()}')
    
    if request.headers.get('HX-Request'):
        # Return fragment to refresh order row or table
        return HttpResponse(status=204)
    
    return redirect('dashboard:order_list')

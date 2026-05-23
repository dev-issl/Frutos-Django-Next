
# ===================================================================
# orders/admin.py
# Enterprise-grade Order Management Admin
# Priority: HIGHEST - Daily operations, revenue tracking
# UX: Optimized for quick order processing and status updates
# ===================================================================

from django.contrib import admin
from django.forms import Media
from django.utils.html import format_html
from django.db.models import Count, Sum, Q
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget
from .models import (
    Order, OrderItem, ShippingMethod, OrderUpdate, OrderPayment, Coupon, ShippingTier,
    FreeShippingRule, DeliverySlot, BlockedDate
)
from users.models import User

class ShippingTierInline(admin.TabularInline):
    model = ShippingTier
    extra = 1
    fields = (
        'pricing_type', 'min_quantity', 'max_quantity', 'min_weight', 'max_weight',
        'base_price', 'has_incremental_pricing', 'increment_per_unit', 'increment_unit_size', 'priority'
    )
    ordering = ['pricing_type', 'priority', 'min_quantity', 'min_weight']
    
    def get_readonly_fields(self, request, obj=None):
        # Make certain fields conditional based on pricing_type
        return []
    
    class Media:
        css = {
            'all': ('admin/css/shipping_tier_admin.css',)
        }
        js = ('admin/js/shipping_tier_admin.js',)

@admin.register(ShippingMethod)
class ShippingMethodAdmin(ImportExportModelAdmin):
    list_display = ('name', 'price', 'preferred_pricing_type', 'delivery_estimated_time', 'max_weight', 'max_quantity', 'is_active', 'tier_count')
    list_filter = ('is_active', 'preferred_pricing_type')
    fields = (
        'name', 'description', 'price', 'preferred_pricing_type', 
        'delivery_estimated_time', 'max_weight', 'max_quantity', 'shipping_categories', 'is_active'
    )
    filter_horizontal = ('shipping_categories',)
    inlines = [ShippingTierInline]
    
    def tier_count(self, obj):
        quantity_tiers = obj.shipping_tiers.filter(pricing_type='quantity').count()
        weight_tiers = obj.shipping_tiers.filter(pricing_type='weight').count()
        return f"{quantity_tiers} qty, {weight_tiers} weight"
    tier_count.short_description = 'Pricing Tiers'
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['shipping_tier_help_text'] = format_html("""
        <div class="shipping-tier-help" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #007cba;">
            <h3 style="color: #007cba; margin-top: 0;">📋 How to Configure Shipping Tiers</h3>
            
            <div style="margin: 15px 0;">
                <h4>🎯 Priority System:</h4>
                <ul>
                    <li><strong>Lower numbers = Higher priority</strong> (Priority 1 beats Priority 10)</li>
                    <li>When ranges overlap, the tier with lowest priority number is selected</li>
                    <li>Use priority 10 for standard tiers, 5 for premium, 1 for special cases</li>
                </ul>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>⚖️ Weight-Based Pricing:</h4>
                <ul>
                    <li><strong>Min/Max Weight:</strong> Define weight ranges (e.g., 0-0.5kg, 0.5-1kg)</li>
                    <li><strong>Base Price:</strong> Fixed cost for this weight range</li>
        
                @admin.register(DeliverySlot)
                class DeliverySlotAdmin(admin.ModelAdmin):
                    list_display = ('name', 'start_time', 'end_time', 'is_active')
                    list_filter = ('is_active',)
                    ordering = ('start_time',)

                @admin.register(BlockedDate)
                class BlockedDateAdmin(admin.ModelAdmin):
                    list_display = ('date', 'reason')
                    list_filter = ('date',)
                    search_fields = ('reason',)
                    ordering = ('-date',)
                    <li><strong>Incremental Pricing:</strong> Add extra cost per additional weight unit</li>
                    <li><strong>Example:</strong> 70 BDT + 20 BDT per additional kg above 1kg</li>
                </ul>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>📦 Quantity-Based Pricing:</h4>
                <ul>
                    <li><strong>Min/Max Quantity:</strong> Define item count ranges (e.g., 1-5 items)</li>
                    <li><strong>Base Price:</strong> Fixed cost for this quantity range</li>
                    <li><strong>Incremental Pricing:</strong> Add extra cost per additional item</li>
                </ul>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>💰 Incremental Pricing Settings:</h4>
                <ul>
                    <li><strong>Increment Per Unit:</strong> Extra cost per additional unit (e.g., 20 BDT)</li>
                    <li><strong>Increment Unit Size:</strong> How to count units (e.g., per 1kg or per 0.5kg)</li>
                    <li><strong>Calculation:</strong> Base Price + (excess_units × increment_per_unit)</li>
                </ul>
            </div>
            
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; border: 1px solid #ffeaa7;">
                <strong>💡 Pro Tip:</strong> Test your configuration using the shipping test page to verify calculations work as expected!
            </div>
        </div>
        """)
        return super().change_view(request, object_id, form_url, extra_context)
    
    class Media:
        css = {
            'all': ('admin/css/shipping_tier_admin.css',)
        }
        js = ('admin/js/shipping_tier_admin.js',)

@admin.register(ShippingTier)
class ShippingTierAdmin(ImportExportModelAdmin):
    list_display = (
        'shipping_method', 'pricing_type', 'tier_range', 'pricing_display', 
        'has_incremental_pricing', 'priority'
    )
    list_filter = ('pricing_type', 'has_incremental_pricing', 'shipping_method')
    ordering = ['shipping_method', 'pricing_type', 'priority', 'min_quantity', 'min_weight']
    
    fields = (
        'shipping_method', 'pricing_type', 'priority',
        ('min_quantity', 'max_quantity'),
        ('min_weight', 'max_weight'),
        'base_price',
        ('has_incremental_pricing', 'increment_per_unit', 'increment_unit_size')
    )
    
    def tier_range(self, obj):
        if obj.pricing_type == 'weight':
            range_str = f"{obj.min_weight}kg"
            if obj.max_weight:
                range_str += f" - {obj.max_weight}kg"
            else:
                range_str += "+"
            return range_str
        else:
            range_str = f"{obj.min_quantity}"
            if obj.max_quantity:
                range_str += f" - {obj.max_quantity} items"
            else:
                range_str += "+ items"
            return range_str
    tier_range.short_description = 'Range'
    
    def pricing_display(self, obj):
        if obj.has_incremental_pricing:
            unit_type = "kg" if obj.pricing_type == 'weight' else "items"
            return f"{obj.base_price} BDT + {obj.increment_per_unit}/per {obj.increment_unit_size}{unit_type}"
        return f"{obj.base_price} BDT (fixed)"
    pricing_display.short_description = 'Pricing'

@admin.register(Coupon)
class CouponAdmin(ImportExportModelAdmin):
    list_display = ('code', 'type', 'discount_percent', 'min_quantity_required', 'min_cart_total', 'active', 'valid_from', 'expires_at', 'eligible_users_count')
    list_filter = ('type', 'active', 'created_at', 'valid_from', 'expires_at')
    search_fields = ('code',)
    readonly_fields = ('created_at',)
    filter_horizontal = ('eligible_users',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'type', 'active')
        }),
        ('Discount Settings', {
            'fields': ('discount_percent', 'min_quantity_required', 'min_cart_total')
        }),
        ('User Restrictions', {
            'fields': ('eligible_users',),
            'classes': ('collapse',),
            'description': 'Select specific users for USER_SPECIFIC coupon type'
        }),
        ('Validity Period', {
            'fields': ('created_at', 'valid_from', 'expires_at')
        }),
    )
    
    def eligible_users_count(self, obj):
        if obj.type == obj.CouponType.USER_SPECIFIC:
            return obj.eligible_users.count()
        return '-'
    eligible_users_count.short_description = 'Eligible Users'
    
    def get_queryset(self, request):
        """Add custom ordering and filters"""
        qs = super().get_queryset(request)
        return qs.select_related()

# Order Admin Configuration
class OrderItemInline(admin.TabularInline):
    """Inline for order items"""
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'color', 'size', 'quantity', 'unit_price')
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

class OrderPaymentInline(admin.StackedInline):
    """Inline for order payment"""
    model = OrderPayment
    extra = 0
    readonly_fields = ('payment_method', 'sender_number', 'transaction_id', 'admin_account_number', 'created_at', 'updated_at')
    can_delete = False
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment_method', 'admin_account_number', 'sender_number', 'transaction_id')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request, obj=None):
        return False

class OrderUpdateInline(admin.TabularInline):
    model = OrderUpdate
    extra = 1
    readonly_fields = ('timestamp',)

@admin.register(Order)
class OrderAdmin(ImportExportModelAdmin):
    """
    ═══════════════════════════════════════════════════════════════
    ORDER ADMIN - HIGHEST PRIORITY
    ═══════════════════════════════════════════════════════════════
    Business Context: Core revenue-generating transactions
    UX Goal: Fast order lookup, status updates, and fulfillment
    Performance: Optimized queries for large order datasets
    """
    
    # ───────────────────────────────────────────────────────────────
    # LIST VIEW - Optimized for Quick Scanning & Filtering
    # ───────────────────────────────────────────────────────────────
    list_display = (
        'order_number_display',     # Custom colored display
        'customer_info',             # Combined name + email for space efficiency
        'status_badge',              # Visual status badges
        'payment_status_badge',      # Visual payment status
        'total_amount_display',      # Formatted currency
        'ordered_at',
        'quick_actions',             # Quick action buttons
    )
    
    list_filter = (
        'status',                    # Primary filter for order processing
        'payment_status',            # Critical for accounting
        ('ordered_at', admin.DateFieldListFilter),  # Time-based filtering
        'shipping_method',
    )
    
    search_fields = (
        'order_number',              # Most common search
        'customer_name',
        'customer_email',
        'customer_phone',
        'tracking_number',
        'user__email',               # Search by registered user
    )
    
    readonly_fields = (
        'order_number', 
        'total_amount', 
        'cart_subtotal', 
        'ordered_at'
    )
    
    # Default ordering: Newest orders first (business priority)
    ordering = ('-ordered_at',)
    
    # Limit displayed items for better performance
    list_per_page = 50
    
    # Enable date hierarchy for time-based navigation
    date_hierarchy = 'ordered_at'
    
    inlines = [OrderItemInline, OrderPaymentInline, OrderUpdateInline]
    
    fieldsets = (
        ('📋 Order Information', {
            'fields': ('order_number', 'user', 'status', 'payment_status', 'ordered_at'),
            'classes': ('wide',)
        }),
        ('👤 Customer Details', {
            'fields': ('customer_name', 'customer_email', 'customer_phone'),
            'classes': ('wide',)
        }),
        ('🚚 Shipping & Delivery', {
            'fields': ('shipping_address', 'shipping_method', 'tracking_number''street_address', 'city', 'postcode', 'payment_method', 'delivery_date', 'delivery_slot_label',),
            'classes': ('wide',)
        }),
        ('💰 Financial Summary', {
            'fields': ('cart_subtotal', 'total_amount'),
            'classes': ('collapse',)
        }),
    )
    
    # ───────────────────────────────────────────────────────────────
    # CUSTOM DISPLAY METHODS - Enhanced UX
    # ───────────────────────────────────────────────────────────────
    
    def order_number_display(self, obj):
        """Display order number with link styling"""
        return format_html(
            '<strong style="color: #2563eb;">{}</strong>',
            obj.order_number
        )
    order_number_display.short_description = 'Order #'
    order_number_display.admin_order_field = 'order_number'
    
    def customer_info(self, obj):
        """Combined customer name and email for compact display"""
        return format_html(
            '<div><strong>{}</strong><br><small style="color: #6b7280;">{}</small></div>',
            obj.customer_name,
            obj.customer_email
        )
    customer_info.short_description = 'Customer'
    customer_info.admin_order_field = 'customer_name'
    
    def status_badge(self, obj):
        """Visual status badge with color coding"""
        status_colors = {
            'pending': '#f59e0b',      # Amber
            'confirmed': '#3b82f6',    # Blue
            'processing': '#8b5cf6',   # Purple
            'shipped': '#06b6d4',      # Cyan
            'delivered': '#10b981',    # Green
            'cancelled': '#ef4444',    # Red
            'returned': '#f97316',     # Orange
        }
        color = status_colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="display: inline-block; padding: 4px 12px; '
            'border-radius: 12px; background-color: {}; color: white; '
            'font-size: 11px; font-weight: 600; text-transform: uppercase;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def payment_status_badge(self, obj):
        """Visual payment status badge"""
        status_colors = {
            'pending': '#f59e0b',
            'paid': '#10b981',
            'failed': '#ef4444',
            'refunded': '#6b7280',
        }
        color = status_colors.get(obj.payment_status, '#6b7280')
        return format_html(
            '<span style="display: inline-block; padding: 4px 12px; '
            'border-radius: 12px; background-color: {}; color: white; '
            'font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_payment_status_display()
        )
    payment_status_badge.short_description = 'Payment'
    payment_status_badge.admin_order_field = 'payment_status'
    
    def total_amount_display(self, obj):
        """Formatted currency display"""
        from utils.currency import format_bdt
        return format_html(
            '<strong style="color: #059669;">{}</strong>',
            format_bdt(obj.total_amount, True)
        )
    total_amount_display.short_description = 'Total'
    total_amount_display.admin_order_field = 'total_amount'
    
    def quick_actions(self, obj):
        """Quick action buttons for common tasks"""
        return format_html(
            '<a class="button" style="padding: 4px 8px; font-size: 11px;" '
            'href="/admin/orders/order/{}/change/">Edit</a>',
            obj.pk
        )
    quick_actions.short_description = 'Actions'
    
    # ───────────────────────────────────────────────────────────────
    # QUERYSET OPTIMIZATION - Critical for Performance
    # ───────────────────────────────────────────────────────────────
    
    def get_queryset(self, request):
        """
        Optimize queryset with select_related for FK lookups
        Critical: Prevents N+1 queries on large order datasets
        """
        qs = super().get_queryset(request)
        return qs.select_related(
            'user', 
            'shipping_method', 
            'shipping_address'
        ).prefetch_related(
            'items',
            'items__product',
            'payment'
        )
    
    # ───────────────────────────────────────────────────────────────
    # ACTIONS - Batch Operations for Efficiency
    # ───────────────────────────────────────────────────────────────
    
    actions = ['mark_as_confirmed', 'mark_as_shipped', 'mark_as_delivered']
    
    def mark_as_confirmed(self, request, queryset):
        updated = queryset.update(status='confirmed')
        self.message_user(request, f'{updated} orders marked as confirmed.')
    mark_as_confirmed.short_description = 'Mark selected as Confirmed'
    
    def mark_as_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'{updated} orders marked as shipped.')
    mark_as_shipped.short_description = 'Mark selected as Shipped'
    
    def mark_as_delivered(self, request, queryset):
        updated = queryset.update(status='delivered')
        self.message_user(request, f'{updated} orders marked as delivered.')
    mark_as_delivered.short_description = 'Mark selected as Delivered'

@admin.register(OrderPayment)
class OrderPaymentAdmin(ImportExportModelAdmin):
    list_display = ('order', 'payment_method', 'sender_number', 'transaction_id', 'created_at')
    list_filter = ('payment_method', 'created_at')
    search_fields = ('order__order_number', 'sender_number', 'transaction_id', 'admin_account_number')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order',)
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'sender_number', 'transaction_id', 'admin_account_number')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FreeShippingRule)
class FreeShippingRuleAdmin(ImportExportModelAdmin):
    list_display = ('threshold_amount', 'active', 'applicable_categories_count', 'created_at')
    list_filter = ('active', 'created_at')
    filter_horizontal = ('applicable_categories',)
    readonly_fields = ('created_at',)
    
    def applicable_categories_count(self, obj):
        count = obj.applicable_categories.count()
        return f"{count} categories" if count > 0 else "All categories"
    applicable_categories_count.short_description = 'Applies To'



@admin.register(DeliverySlot)
class DeliverySlotAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'is_active')
    list_filter = ('is_active',)
    ordering = ('start_time',)
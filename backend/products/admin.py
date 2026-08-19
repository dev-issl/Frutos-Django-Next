# ═══════════════════════════════════════════════════════════════════════════
# products/admin.py
# Enterprise Product & Inventory Management
# Priority: HIGH - Critical for multivendor operations
# UX: Optimized for vendor-specific views, bulk editing, quick stock updates
# ═══════════════════════════════════════════════════════════════════════════

from django.contrib import admin
from django.utils.html import format_html
from import_export.admin import ImportExportModelAdmin
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget
from .models import *
from shops.models import Shop


# ============================================================================
# RESOURCE CLASSES FOR IMPORT/EXPORT
# ============================================================================

class BrandResource(resources.ModelResource):
    """Resource for Brand with proper field handling"""
    
    class Meta:
        model = Brand
        fields = ('id', 'name', 'slug', 'description', 'website', 'is_active', 'created_at', 'updated_at')
        export_order = fields
        import_id_fields = ['slug']
        skip_unchanged = True


class CategoryResource(resources.ModelResource):
    """Resource for Category"""
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug')
        export_order = fields
        import_id_fields = ['slug']
        skip_unchanged = True


class SubCategoryResource(resources.ModelResource):
    """Resource for SubCategory with category relationship"""
    
    category_name = fields.Field(
        column_name='category_name',
        attribute='category',
        widget=ForeignKeyWidget(Category, 'name')
    )
    
    class Meta:
        model = SubCategory
        fields = ('id', 'name', 'slug', 'category_name')
        export_order = fields
        import_id_fields = ['slug']
        skip_unchanged = True


class ProductResource(resources.ModelResource):
    """
    Comprehensive Product Resource with all relationships
    Handles: Shop, Brand, SubCategory, ShippingCategory, Colors, Sizes
    """
    
    # Foreign Key relationships
    shop_name = fields.Field(
        column_name='shop_name',
        attribute='shop',
        widget=ForeignKeyWidget(Shop, 'name')
    )
    
    brand_name = fields.Field(
        column_name='brand_name',
        attribute='brand',
        widget=ForeignKeyWidget(Brand, 'name')
    )
    
    category_name = fields.Field(
        column_name='category_name',
        attribute='sub_category__category',
        readonly=True
    )
    
    subcategory_name = fields.Field(
        column_name='subcategory_name',
        attribute='sub_category',
        widget=ForeignKeyWidget(SubCategory, 'name')
    )
    
    # Many-to-Many relationships
    colors_list = fields.Field(
        column_name='colors',
        attribute='colors',
        widget=ManyToManyWidget(Color, field='name', separator=', ')
    )
    
    sizes_list = fields.Field(
        column_name='sizes',
        attribute='sizes',
        widget=ManyToManyWidget(Size, field='name', separator=', ')
    )
    
    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'shop_name', 'brand_name', 
            'category_name', 'subcategory_name',
            'price', 'discount_price', 'wholesale_price', 'minimum_purchase',
            'stock', 'is_active',
            'weight', 'length', 'width', 'height',
            'colors_list', 'sizes_list', 'created_at', 'updated_at'
        )
        export_order = fields
        import_id_fields = ['slug']
        skip_unchanged = True
        report_skipped = True
    
    def dehydrate_category_name(self, product):
        """Export main category name"""
        return product.sub_category.category.name if product.sub_category else ''


# ============================================================================
# ADMIN CLASSES
# ============================================================================

@admin.register(Brand)
class BrandAdmin(ImportExportModelAdmin):
    """
    Brand Admin - Product Brand Management
    UX: Simple, visual brand management with logo preview
    """
    resource_class = BrandResource
    
    list_display = ('logo_preview', 'name_display', 'website_link', 'is_active_badge', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('-is_active', 'name')
    list_per_page = 50
    
    fieldsets = (
        ('📦 Brand Information', {
            'fields': ('name', 'slug', 'logo', 'description'),
            'classes': ('wide',)
        }),
        ('🌐 Online Presence', {
            'fields': ('website', 'is_active')
        }),
    )
    
    def logo_preview(self, obj):
        if obj.logo:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; object-fit: contain; '
                'border-radius: 4px; border: 1px solid #e5e7eb;">',
                obj.logo.url
            )
        return format_html('<div style="width: 40px; height: 40px; background: #f3f4f6; '
                          'border-radius: 4px; display: flex; align-items: center; '
                          'justify-content: center; color: #9ca3af;">🏷️</div>')
    logo_preview.short_description = 'Logo'
    
    def name_display(self, obj):
        return format_html('<strong>{}</strong>', obj.name)
    name_display.short_description = 'Brand'
    name_display.admin_order_field = 'name'
    
    def website_link(self, obj):
        if obj.website:
            return format_html('<a href="{}" target="_blank" style="color: #3b82f6;">🔗 Visit</a>', obj.website)
        return '-'
    website_link.short_description = 'Website'
    
    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: #10b981; font-weight: 600;">✓ Active</span>')
        return format_html('<span style="color: #ef4444; font-weight: 600;">✗ Inactive</span>')
    is_active_badge.short_description = 'Status'
    is_active_badge.admin_order_field = 'is_active'


@admin.register(Color)
class ColorAdmin(ImportExportModelAdmin):
    """Color Admin with Import/Export"""
    
    list_display = ('name', 'hex_code')
    search_fields = ('name', 'hex_code')


@admin.register(Size)
class SizeAdmin(ImportExportModelAdmin):
    """Size Admin with Import/Export"""
    
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    """
    Category Admin - Main Product Categories
    UX: Visual category management with image preview
    """
    resource_class = CategoryResource
    
    list_display = ('image_preview', 'name_display', 'slug', 'subcategory_count')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('name',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; '
                'border-radius: 6px; border: 1px solid #e5e7eb;">',
                obj.image.url
            )
        return format_html('<div style="width: 50px; height: 50px; background: #f3f4f6; '
                          'border-radius: 6px; display: flex; align-items: center; '
                          'justify-content: center; color: #9ca3af; font-size: 20px;">📁</div>')
    image_preview.short_description = 'Image'
    
    def name_display(self, obj):
        return format_html('<strong style="color: #6366f1;">{}</strong>', obj.name)
    name_display.short_description = 'Category'
    name_display.admin_order_field = 'name'
    
    def subcategory_count(self, obj):
        count = obj.subcategories.count()
        return format_html('<span style="color: #6b7280;">{} subcategories</span>', count)
    subcategory_count.short_description = 'Subcategories'


@admin.register(SubCategory)
class SubCategoryAdmin(ImportExportModelAdmin):
    """SubCategory Admin - Product Subcategories"""
    resource_class = SubCategoryResource
    list_display = ('name_display', 'category_display', 'slug')
    list_filter = ('category',)
    search_fields = ('name', 'slug', 'category__name')
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['category']
    ordering = ('category__name', 'name')
    
    def name_display(self, obj):
        return format_html('<strong>{}</strong>', obj.name)
    name_display.short_description = 'Subcategory'
    name_display.admin_order_field = 'name'
    
    def category_display(self, obj):
        return format_html('<span style="color: #6b7280;">📁 {}</span>', obj.category.name)
    category_display.short_description = 'Parent Category'
    category_display.admin_order_field = 'category__name'



# Inline classes
class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1


class ProductAdditionalImageInline(admin.TabularInline):
    model = ProductAdditionalImage
    extra = 1


@admin.register(Product)
class ProductAdmin(ImportExportModelAdmin):
    """
    ═══════════════════════════════════════════════════════════════
    PRODUCT ADMIN - HIGH PRIORITY
    ═══════════════════════════════════════════════════════════════
    Business Context: Core inventory management for multivendor
    UX Goal: Vendor-filtered views, quick stock updates, active/inactive toggle
    Performance: Optimized for large product catalogs
    Role-Based: Vendors see only their products
    """
    resource_class = ProductResource
    
    # ───────────────────────────────────────────────────────────────
    # LIST VIEW - High-Density, Business-Critical Columns
    # ───────────────────────────────────────────────────────────────
    list_display = (
        'thumbnail_preview',         # Visual product identification
        'name_display',              # Product name with link
        'shop_display',              # Vendor/shop name
        'brand_display',             # Brand name
        'category_display',          # Category breadcrumb
        'price_display',             # Formatted price with discount
        'stock_indicator',           # Visual stock status
        'is_active_toggle',          # Quick active/inactive indicator
        'created_at',
    )
    
    list_filter = (
        'is_active',                 # Primary filter: active products
        'shop',                      # Vendor filter (multivendor critical)
        'brand',                     # Brand filter
        'sub_category__category',    # Main category
        'sub_category',              # Subcategory
        'shipping_category',         # Shipping classification
        ('created_at', admin.DateFieldListFilter),
    )
    
    search_fields = (
        'name',                      # Product name (primary search)
        'slug',
        'brand__name',
        'shop__name',
        'sub_category__name',
        'sub_category__category__name',
    )
    
    # Default ordering: Active products first, then newest
    ordering = ('-is_active', '-created_at')
    
    # High-density display for large catalogs
    list_per_page = 100
    
    # Date hierarchy for time-based browsing
    date_hierarchy = 'created_at'
    
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductSpecificationInline, ProductAdditionalImageInline]
    filter_horizontal = ('colors', 'sizes')
    autocomplete_fields = ['shop', 'brand', 'sub_category', 'shipping_category']
    
    fieldsets = (
        ('📦 Product Information', {
            'fields': ('name', 'slug', 'description', 'thumbnail'),
            'classes': ('wide',)
        }),
        ('🏪 Business Details', {
            'fields': ('shop', 'brand', 'sub_category', 'shipping_category'),
            'classes': ('wide',)
        }),
        ('💰 Pricing & Inventory', {
            'fields': (
                ('price', 'discount_price'),
                ('wholesale_price', 'minimum_purchase'),
                'stock',
                'is_active'
            ),
            'classes': ('wide',)
        }),
        ('📏 Physical Properties', {
            'fields': (('weight', 'length', 'width', 'height'),),
            'classes': ('collapse',)
        }),
        ('🎨 Product Variants', {
            'fields': ('colors', 'sizes'),
            'classes': ('collapse',)
        }),
    )
    
    # ───────────────────────────────────────────────────────────────
    # CUSTOM DISPLAY METHODS - Enhanced Visual UX
    # ───────────────────────────────────────────────────────────────
    
    def thumbnail_preview(self, obj):
        """Display product thumbnail for visual identification"""
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; '
                'object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;">',
                obj.thumbnail.url
            )
        return format_html(
            '<div style="width: 50px; height: 50px; background: #f3f4f6; '
            'border-radius: 6px; display: flex; align-items: center; '
            'justify-content: center; color: #9ca3af; font-size: 20px;">📦</div>'
        )
    thumbnail_preview.short_description = 'Image'
    
    def name_display(self, obj):
        """Product name with truncation for long names"""
        name = obj.name[:50] + '...' if len(obj.name) > 50 else obj.name
        return format_html('<strong>{}</strong>', name)
    name_display.short_description = 'Product Name'
    name_display.admin_order_field = 'name'
    
    def shop_display(self, obj):
        """Display shop name with visual indicator"""
        return format_html(
            '<span style="color: #6366f1;">🏪 {}</span>',
            obj.shop.name if obj.shop else '-'
        )
    shop_display.short_description = 'Vendor'
    shop_display.admin_order_field = 'shop__name'
    
    def brand_display(self, obj):
        """Display brand name"""
        return obj.brand.name if obj.brand else '-'
    brand_display.short_description = 'Brand'
    brand_display.admin_order_field = 'brand__name'
    
    def category_display(self, obj):
        """Display category breadcrumb"""
        if obj.sub_category:
            return format_html(
                '<small style="color: #6b7280;">{} → {}</small>',
                obj.sub_category.category.name,
                obj.sub_category.name
            )
        return '-'
    category_display.short_description = 'Category'
    category_display.admin_order_field = 'sub_category__category__name'
    
    def price_display(self, obj):
        """Display price with discount indicator"""
        from utils.currency import format_bdt
        if obj.discount_price and obj.discount_price < obj.price:
            return format_html(
                '<div><strong style="color: #059669;">{}</strong><br>'
                '<small style="text-decoration: line-through; color: #9ca3af;">{}</small></div>',
                format_bdt(obj.discount_price, True),
                format_bdt(obj.price, True)
            )
        return format_html(
            '<strong style="color: #059669;">{}</strong>',
            format_bdt(obj.price, True)
        )
    price_display.short_description = 'Price'
    price_display.admin_order_field = 'price'
    
    def stock_indicator(self, obj):
        """Visual stock status with color coding"""
        if obj.stock <= 0:
            color = '#ef4444'  # Red
            text = 'Out of Stock'
            icon = '❌'
        elif obj.stock < 10:
            color = '#f59e0b'  # Amber
            text = f'{obj.stock} units'
            icon = '⚠️'
        else:
            color = '#10b981'  # Green
            text = f'{obj.stock} units'
            icon = '✅'
        
        return format_html(
            '<span style="color: {}; font-weight: 600;">{} {}</span>',
            color, icon, text
        )
    stock_indicator.short_description = 'Stock'
    stock_indicator.admin_order_field = 'stock'
    
    def is_active_toggle(self, obj):
        """Visual active/inactive badge"""
        if obj.is_active:
            return format_html(
                '<span style="display: inline-block; width: 12px; height: 12px; '
                'border-radius: 50%; background-color: #10b981;" '
                'title="Active"></span>'
            )
        return format_html(
            '<span style="display: inline-block; width: 12px; height: 12px; '
            'border-radius: 50%; background-color: #ef4444;" '
            'title="Inactive"></span>'
        )
    is_active_toggle.short_description = 'Status'
    is_active_toggle.admin_order_field = 'is_active'
    
    # ───────────────────────────────────────────────────────────────
    # QUERYSET OPTIMIZATION & ROLE-BASED FILTERING
    # ───────────────────────────────────────────────────────────────
    
    def get_queryset(self, request):
        """
        Optimize queryset for performance + vendor filtering
        Critical: Vendors see only their products (multivendor security)
        """
        qs = super().get_queryset(request).select_related(
            'shop', 
            'brand', 
            'sub_category', 
            'sub_category__category', 
            'shipping_category'
        ).prefetch_related('colors', 'sizes')
        
        # Role-based filtering: Vendors see only their products
        if request.user.is_superuser:
            return qs

        # If user owns shops, filter to their products only
        if request.user.shops.exists():
            return qs.filter(shop__owner=request.user)
        
        return qs
    
    # ───────────────────────────────────────────────────────────────
    # BULK ACTIONS - Operational Efficiency
    # ───────────────────────────────────────────────────────────────
    
    actions = ['mark_as_active', 'mark_as_inactive', 'mark_as_out_of_stock']
    
    def mark_as_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} products marked as active.')
    mark_as_active.short_description = 'Activate selected products'
    
    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} products marked as inactive.')
    mark_as_inactive.short_description = 'Deactivate selected products'
    
    def mark_as_out_of_stock(self, request, queryset):
        updated = queryset.update(stock=0, is_active=False)
        self.message_user(request, f'{updated} products marked as out of stock.')
    mark_as_out_of_stock.short_description = 'Mark as Out of Stock'


@admin.register(CategoryMinimumOrderQuantity)
class CategoryMinimumOrderQuantityAdmin(ImportExportModelAdmin):
    """CategoryMinimumOrderQuantity Admin with Import/Export"""
    
    list_display = ('category', 'minimum_quantity', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('category__name',)
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['category']
    
    fieldsets = (
        ('Wholesale Rules', {
            'fields': ('category', 'minimum_quantity')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    """Simple admin for user wishlists"""
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__email', 'user__username', 'product__name')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)

class OfferItemInline(admin.TabularInline):
    model = __import__('products.models', fromlist=['OfferItem']).OfferItem
    extra = 1

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    """Admin for Offers/Banners"""
    list_display = ('title', 'is_active', 'start_date', 'end_date', 'created_at')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OfferItemInline]
    
    fieldsets = (
        ('Offer Details', {
            'fields': ('title', 'slug', 'banner_image', 'description', 'is_active')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date')
        }),
    )

@admin.register(DisplayUnit)
class DisplayUnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'abbreviation', 'created_at')
    search_fields = ('name', 'abbreviation')

# products/models.py
import uuid
from django.db import models # type: ignore
from django.conf import settings
from shops.models import Shop
from django_ckeditor_5.fields import CKEditor5Field
from utils.image_optimizer import ImageOptimizer


class Brand(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="e.g., Nike, Apple, Samsung", db_index=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True, help_text="Brand logo image")
    description = models.TextField(blank=True, help_text="Brief description of the brand")
    website = models.URLField(blank=True, help_text="Official brand website")
    slug = models.SlugField(unique=True, help_text="URL-friendly brand name", db_index=True)
    is_active = models.BooleanField(default=True, help_text="Whether this brand is active", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            unique_slug = base_slug
            counter = 1
            
            # Ensure slug uniqueness
            while Brand.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = unique_slug
        
        # Optimize logo image before saving
        if self.logo and hasattr(self.logo, 'file'):
            try:
                optimized = ImageOptimizer.optimize_logo_image(self.logo.file)
                if optimized:
                    self.logo.file = optimized
            except Exception as e:
                print(f"Error optimizing brand logo: {e}")
        super().save(*args, **kwargs)

class Color(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="e.g., Red, Ocean Blue")
    hex_code = models.CharField(max_length=7, unique=True, help_text="e.g., #FF0000")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Size(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="e.g., S, M, L, XL, 42")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True, db_index=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    slug = models.SlugField(unique=True, max_length=255, db_index=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
            
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            unique_slug = base_slug
            counter = 1
            
            # Ensure slug uniqueness
            while Category.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = unique_slug
        
        # Optimize category image before saving
        if self.image and hasattr(self.image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_category_image(self.image.file)
                if optimized:
                    self.image.file = optimized
            except Exception as e:
                print(f"Error optimizing category image: {e}")
        super().save(*args, **kwargs)
    
    def get_sections(self):
        """Get all sections this category is part of"""
        from sections.models import SectionItem
        return SectionItem.objects.filter(category=self).select_related('section')
    
    def is_in_section(self, section_slug):
        """Check if category is in a specific section"""
        from sections.models import SectionItem
        return SectionItem.objects.filter(
            category=self, 
            section__slug=section_slug,
            section__is_active=True
        ).exists()

class SubCategory(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    image = models.ImageField(upload_to='subcategories/', blank=True, null=True)
    slug = models.SlugField(unique=True, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories', db_index=True)
    
    class Meta:
        unique_together = ('name', 'category')
        ordering = ['category__name', 'name']
        indexes = [
            models.Index(fields=['category', 'name'], name='subcat_cat_name_idx'),
        ]
        
    def __str__(self):
        return f"{self.name} ({self.category.name})"
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            unique_slug = base_slug
            counter = 1
            
            # Ensure slug uniqueness
            while SubCategory.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = unique_slug
        
        # Optimize subcategory image before saving
        if self.image and hasattr(self.image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_category_image(self.image.file)
                if optimized:
                    self.image.file = optimized
            except Exception as e:
                print(f"Error optimizing subcategory image: {e}")
        super().save(*args, **kwargs)



class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products', db_index=True)
    stores = models.ManyToManyField('stores.Store', blank=True, related_name='products', help_text="Physical fulfillment stores")
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='products', null=True, blank=True, help_text="Product brand", db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, max_length=255, db_index=True)
    description = CKEditor5Field('Description', config_name='default')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products', null=True, blank=True, db_index=True)
    sub_category = models.ForeignKey(SubCategory, on_delete=models.PROTECT, related_name='products', null=True, blank=True, db_index=True)
    shipping_category = models.ForeignKey(
        'Category',
        on_delete=models.PROTECT, 
        related_name='shipping_category_products',
        blank=True,
        null=True,
        help_text="Determines which shipping methods are available for this product",
        db_index=True
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    wholesale_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Special price for wholesale orders (leave empty if not applicable)"
    )
    minimum_purchase = models.PositiveIntegerField(
        default=1,
        help_text="Minimum quantity required for wholesale orders. Admin can set different values per product (e.g., Mobile=10, Laptop=5, Fashion=60)"
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=5.00,
        help_text="Tax percentage for this product (e.g., 5.00 for 5%)"
    )
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Physical properties for shipping calculation - TEMPORARILY COMMENTED OUT
    weight = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Weight in kg"
    )
    length = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Length in cm"
    )
    width = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Width in cm"
    )
    height = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Height in cm"
    )
    
    thumbnail = models.ImageField(upload_to='products/thumbnails/', blank=True, null=True)
    # Frutos-specific fields
    origin = models.CharField(max_length=100, blank=True, null=True, help_text="Country/region of origin")
    unit = models.CharField(max_length=200, blank=True, null=True, help_text='Display unit (e.g., "per kg", "6-pack")')
    wholesale_unit = models.CharField(max_length=200, blank=True, null=True, help_text='Wholesale unit (e.g., "per case")')
    badge = models.CharField(max_length=100, blank=True, null=True, help_text='Promo label (NEW, ORGANIC)')
    badge_color = models.CharField(max_length=200, blank=True, null=True, help_text='Tailwind CSS classes or hex for badge')
    variant = models.CharField(max_length=100, blank=True, null=True, help_text='Product quality or variant (e.g., C, B)')
    colors = models.ManyToManyField(Color, blank=True, related_name='products')
    sizes = models.ManyToManyField(Size, blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-created_at']  # Order by newest first
        indexes = [
            models.Index(fields=['-created_at'], name='product_created_idx'),
            models.Index(fields=['is_active', '-created_at'], name='product_active_created_idx'),
            models.Index(fields=['category', 'is_active'], name='product_cat_active_idx'),
            models.Index(fields=['sub_category', 'is_active'], name='product_subcat_active_idx'),
        ]

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            unique_slug = base_slug
            counter = 1
            
            # Ensure slug uniqueness
            while Product.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = unique_slug
        
        # Optimize product thumbnail before saving
        if self.thumbnail and hasattr(self.thumbnail, 'file'):
            try:
                optimized = ImageOptimizer.optimize_product_image(self.thumbnail.file)
                if optimized:
                    self.thumbnail.file = optimized
            except Exception as e:
                print(f"Error optimizing product thumbnail: {e}")
        super().save(*args, **kwargs)
    
    def get_sections(self):
        """Get all sections this product is part of"""
        from sections.models import SectionItem
        return SectionItem.objects.filter(product=self).select_related('section')
    
    def is_in_section(self, section_slug):
        """Check if product is in a specific section"""
        from sections.models import SectionItem
        return SectionItem.objects.filter(
            product=self, 
            section__slug=section_slug,
            section__is_active=True
        ).exists()
    
    def get_image_url(self):
        """Return product thumbnail URL or default placeholder"""
        if self.thumbnail:
            return self.thumbnail.url
        return '/static/assets/images/placeholder-product.svg'

class ProductAdditionalImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='additional_images')
    image = models.ImageField(upload_to='products/additional_images/')
    class Meta:
        verbose_name_plural = "Product Additional Images"
    def __str__(self):
        return f"Image for {self.product.name}"
    
    def save(self, *args, **kwargs):
        # Optimize additional product image before saving
        if self.image and hasattr(self.image, 'file'):
            try:
                optimized = ImageOptimizer.optimize_product_image(self.image.file)
                if optimized:
                    self.image.file = optimized
            except Exception as e:
                print(f"Error optimizing additional product image: {e}")
        super().save(*args, **kwargs)


class Wishlist(models.Model):
    """User wishlist for products (simple implementation)."""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"Wishlist: {self.user.email} -> {self.product.name}"

class ProductAdditionalDescription(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='additional_descriptions')
    description = CKEditor5Field('Description', config_name='default')
    def __str__(self):
        return f"Additional description for {self.product.name}"

class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specifications')
    name = models.CharField(max_length=255, help_text="e.g., Material, Weight (Not for Color or Size)")
    value = models.CharField(max_length=255, help_text="e.g., Cotton, 250g")
    class Meta:
        unique_together = ('product', 'name')
    def __str__(self):
        return f"{self.name}: {self.value}"

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)], db_index=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    class Meta:
        unique_together = ('user', 'product')
        indexes = [
            models.Index(fields=['product', '-created_at'], name='review_product_created_idx'),
            models.Index(fields=['product', 'rating'], name='review_product_rating_idx'),
        ]


class CategoryMinimumOrderQuantity(models.Model):
    """Minimum order quantities for wholesale orders by category"""
    category = models.OneToOneField(
        Category, 
        on_delete=models.CASCADE, 
        related_name='minimum_order_quantity',
        help_text="Category for which minimum order quantity applies"
    )
    minimum_quantity = models.PositiveIntegerField(
        help_text="Minimum quantity required for wholesale orders in this category"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Category Minimum Order Quantity"
        verbose_name_plural = "Category Minimum Order Quantities"
        ordering = ['category__name']
    
    def __str__(self):
        return f"{self.category.name}: {self.minimum_quantity} units minimum"

class Offer(models.Model):
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, max_length=255, db_index=True)
    banner_image = models.ImageField(upload_to='offers/banners/', help_text="Banner image for the offer")
    description = CKEditor5Field('Description', config_name='default', blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True, help_text="Optional start date for the offer")
    end_date = models.DateTimeField(blank=True, null=True, help_text="Optional end date for the offer timer")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.title)
            unique_slug = base_slug
            counter = 1
            while Offer.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)

class OfferItem(models.Model):
    offer = models.ForeignKey(Offer, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    offer_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Custom price for this product during the offer")

    class Meta:
        unique_together = ('offer', 'product')

    def __str__(self):
        return f"{self.product.name} in {self.offer.title}"

# orders/models.py
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
# from products.models import Product, Color, Size
from users.models import Address

class ShippingMethod(models.Model):
    PRICING_TYPE_CHOICES = [
        ('quantity', 'Quantity-based'),
        ('weight', 'Weight-based'),
    ]
    
    name = models.CharField(max_length=100, help_text="e.g., By Air, By Ship, Door to Door")
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base price (used if no tiers defined)")
    delivery_estimated_time = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., '1-2 days', '5-7 days', '2-3 weeks'")
    
    # Constraints
    max_weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text="Maximum weight this shipping method can handle (in kg). Leave blank for no weight limit."
    )
    max_quantity = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Maximum quantity this shipping method can handle. Leave blank for no quantity limit."
    )
    
    # Pricing configuration
    preferred_pricing_type = models.CharField(
        max_length=10,
        choices=PRICING_TYPE_CHOICES,
        default='quantity',
        help_text="Preferred pricing method for this shipping method"
    )
    
    shipping_categories = models.ManyToManyField(
        'products.Category',
        related_name='allowed_shipping_methods',
        blank=True,
        help_text="Shipping categories this method is available for"
    )
    
    is_active = models.BooleanField(default=True)
    is_wholesale_only = models.BooleanField(default=False, help_text="If checked, this shipping method will only be available for wholesale orders")

    class Meta:
        ordering = ['name']

    def __str__(self):
        from utils.currency import format_bdt
        return f"{self.name} - {format_bdt(self.price, True)}"
    
    def get_price_for_quantity(self, quantity):
        """
        Get price based on quantity using dynamic quantity-based tiers.
        Falls back to base price if no tiers match.
        """
        from decimal import Decimal
        
        quantity = int(quantity)
        
        # Get all applicable quantity-based tiers, ordered by priority and min_quantity
        applicable_tiers = self.shipping_tiers.filter(
            pricing_type='quantity',
            min_quantity__isnull=False,
            min_quantity__lte=quantity
        ).filter(
            models.Q(max_quantity__isnull=True) | models.Q(max_quantity__gte=quantity)
        ).order_by('-priority', '-min_quantity')
        
        if applicable_tiers.exists():
            best_tier = applicable_tiers.first()
            calculated_price = best_tier.get_price_for_quantity(quantity)
            if calculated_price is not None:
                return calculated_price
        
        # Fallback to base price if no tiers match
        return self.price
    
    def get_price_for_weight(self, weight):
        """
        Get price based on weight using dynamic weight-based tiers.
        Falls back to base price if no tiers match.
        """
        from decimal import Decimal
        
        weight = Decimal(str(weight))
        
        # Get all applicable weight-based tiers, ordered by priority and min_weight
        applicable_tiers = self.shipping_tiers.filter(
            pricing_type='weight',
            min_weight__isnull=False,
            min_weight__lte=weight
        ).filter(
            models.Q(max_weight__isnull=True) | models.Q(max_weight__gte=weight)
        ).order_by('-priority', '-min_weight')
        
        if applicable_tiers.exists():
            best_tier = applicable_tiers.first()
            calculated_price = best_tier.get_price_for_weight(weight)
            if calculated_price is not None:
                return calculated_price
        
        # Fallback to base price if no tiers match
        return self.price
    
    def get_price_for_cart(self, quantity=None, weight=None, pricing_type=None):
        """
        Get price based on specified pricing type or method's preference
        
        Args:
            quantity: Total quantity of items
            weight: Total weight in kg
            pricing_type: 'quantity', 'weight', or None (use method preference)
        
        Returns:
            Decimal: Calculated shipping price
        """
        # Use method's preferred pricing type if not specified
        if pricing_type is None:
            pricing_type = self.preferred_pricing_type
        
        if pricing_type == 'weight' and weight is not None:
            return self.get_price_for_weight(weight)
        elif pricing_type == 'quantity' and quantity is not None:
            return self.get_price_for_quantity(quantity)
        else:
            # Fallback to base price
            return self.price

class ShippingTier(models.Model):
    """
    Dynamic shipping pricing tiers supporting both quantity-based and weight-based pricing
    with customizable incremental pricing rules
    """
    PRICING_TYPE_CHOICES = [
        ('quantity', 'Quantity-based'),
        ('weight', 'Weight-based'),
    ]
    
    shipping_method = models.ForeignKey(ShippingMethod, on_delete=models.CASCADE, related_name='shipping_tiers')
    
    # Quantity-based pricing fields
    min_quantity = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Minimum quantity required for this pricing tier (for quantity-based pricing)"
    )
    max_quantity = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Maximum quantity for this pricing tier (leave empty for unlimited)"
    )
    
    # Weight-based pricing fields
    min_weight = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Minimum weight in kg required for this pricing tier (for weight-based pricing)"
    )
    max_weight = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Maximum weight in kg for this pricing tier (leave empty for unlimited)"
    )
    
    # Pricing configuration
    pricing_type = models.CharField(
        max_length=10,
        choices=PRICING_TYPE_CHOICES,
        default='quantity',
        help_text="Whether this tier is based on quantity or weight"
    )
    base_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Base price for this tier"
    )
    
    # Dynamic incremental pricing
    has_incremental_pricing = models.BooleanField(
        default=False,
        help_text="Enable incremental pricing for weights/quantities above the minimum"
    )
    increment_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Additional cost per unit (kg for weight, item for quantity) above minimum"
    )
    increment_unit_size = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=1.0,
        help_text="Size of each increment unit (e.g., 0.5 for every 0.5kg, 1.0 for every 1kg)"
    )
    
    # Priority for overlapping tiers
    priority = models.PositiveIntegerField(
        default=0,
        help_text="Higher priority tiers will be selected first when multiple tiers match"
    )
    
    # Backward compatibility
    @property
    def price(self):
        """Backward compatibility property"""
        return self.base_price
    
    @price.setter
    def price(self, value):
        """Backward compatibility setter"""
        self.base_price = value
    
    class Meta:
        ordering = ['pricing_type', 'priority', 'min_quantity', 'min_weight']
        verbose_name = "Shipping Tier"
        verbose_name_plural = "Shipping Tiers"
    
    def clean(self):
        """Validate tier configuration"""
        from django.core.exceptions import ValidationError
        
        if self.pricing_type == 'quantity':
            if self.min_quantity is None:
                raise ValidationError('min_quantity is required for quantity-based pricing')
            if self.max_quantity and self.max_quantity <= self.min_quantity:
                raise ValidationError('max_quantity must be greater than min_quantity')
        elif self.pricing_type == 'weight':
            if self.min_weight is None:
                raise ValidationError('min_weight is required for weight-based pricing')
            if self.max_weight and self.max_weight <= self.min_weight:
                raise ValidationError('max_weight must be greater than min_weight')
        
        if self.has_incremental_pricing:
            if self.increment_per_unit is None:
                raise ValidationError('increment_per_unit is required when has_incremental_pricing is True')
            if self.increment_unit_size <= 0:
                raise ValidationError('increment_unit_size must be greater than 0')
    
    def __str__(self):
        from utils.currency import format_bdt
        
        if self.pricing_type == 'quantity':
            range_text = f"{self.min_quantity}+"
            if self.max_quantity:
                range_text = f"{self.min_quantity}-{self.max_quantity}"
            
            if self.has_incremental_pricing:
                return f"{self.shipping_method.name} - {range_text} items: {format_bdt(self.base_price, True)} + {format_bdt(self.increment_per_unit, True)} per {self.increment_unit_size} items"
            return f"{self.shipping_method.name} - {range_text} items: {format_bdt(self.base_price, True)}"
        else:
            range_text = f"{self.min_weight}+"
            if self.max_weight:
                range_text = f"{self.min_weight}-{self.max_weight}"
            
            if self.has_incremental_pricing:
                return f"{self.shipping_method.name} - {range_text} kg: {format_bdt(self.base_price, True)} + {format_bdt(self.increment_per_unit, True)} per {self.increment_unit_size}kg"
            return f"{self.shipping_method.name} - {range_text} kg: {format_bdt(self.base_price, True)}"
    
    def applies_to_weight(self, weight):
        """Check if this weight-based tier applies to the given weight"""
        if self.pricing_type != 'weight':
            return False
        
        if weight < self.min_weight:
            return False
            
        if self.max_weight and weight > self.max_weight:
            return False
            
        return True
    
    def applies_to_quantity(self, quantity):
        """Check if this quantity-based tier applies to the given quantity"""
        if self.pricing_type != 'quantity':
            return False
        
        if quantity < self.min_quantity:
            return False
            
        if self.max_quantity and quantity > self.max_quantity:
            return False
            
        return True
    
    def get_price_for_weight(self, weight):
        """Calculate dynamic price for specific weight"""
        from decimal import Decimal
        import math
        
        if not self.applies_to_weight(weight):
            return None
        
        weight = Decimal(str(weight))
        base_price = self.base_price
        
        if not self.has_incremental_pricing:
            return base_price
        
        # Calculate incremental pricing
        excess_weight = weight - self.min_weight
        if excess_weight <= 0:
            return base_price
        
        # Calculate number of increment units
        increment_units = float(excess_weight) / float(self.increment_unit_size)
        # Round up to charge for partial units
        increment_units = math.ceil(increment_units)
        
        additional_cost = Decimal(str(increment_units)) * self.increment_per_unit
        return base_price + additional_cost
    
    def get_price_for_quantity(self, quantity):
        """Calculate dynamic price for specific quantity"""
        from decimal import Decimal
        import math
        
        if not self.applies_to_quantity(quantity):
            return None
        
        quantity = int(quantity)
        base_price = self.base_price
        
        if not self.has_incremental_pricing:
            return base_price
        
        # Calculate incremental pricing
        excess_quantity = quantity - self.min_quantity
        if excess_quantity <= 0:
            return base_price
        
        # Calculate number of increment units
        increment_units = float(excess_quantity) / float(self.increment_unit_size)
        # Round up to charge for partial units
        increment_units = math.ceil(increment_units)
        
        additional_cost = Decimal(str(increment_units)) * self.increment_per_unit
        return base_price + additional_cost
    
    def get_price_for_cart(self, cart_total_quantity, cart_total_weight):
        """Get price for cart based on tier type"""
        if self.pricing_type == 'weight':
            return self.get_price_for_weight(cart_total_weight)
        else:
            return self.get_price_for_quantity(cart_total_quantity)
    
    def get_pricing_explanation(self, cart_total_quantity=None, cart_total_weight=None):
        """Get explanation of how pricing is calculated for this tier"""
        if self.pricing_type == 'weight' and cart_total_weight is not None:
            weight = cart_total_weight
            if not self.applies_to_weight(weight):
                return "Does not apply to this weight"
            
            explanation = f"Base price for {self.min_weight}kg"
            if self.max_weight:
                explanation += f"-{self.max_weight}kg"
            else:
                explanation += "+"
            explanation += f": {self.base_price} BDT"
            
            if self.has_incremental_pricing and weight > self.min_weight:
                excess_weight = weight - self.min_weight
                import math
                increment_units = math.ceil(float(excess_weight) / float(self.increment_unit_size))
                additional_cost = increment_units * self.increment_per_unit
                explanation += f" + {increment_units} × {self.increment_per_unit} BDT (for {excess_weight}kg excess in {self.increment_unit_size}kg increments) = {self.get_price_for_weight(weight)} BDT"
            
            return explanation
        
        elif self.pricing_type == 'quantity' and cart_total_quantity is not None:
            quantity = cart_total_quantity
            if not self.applies_to_quantity(quantity):
                return "Does not apply to this quantity"
            
            explanation = f"Base price for {self.min_quantity}"
            if self.max_quantity:
                explanation += f"-{self.max_quantity}"
            else:
                explanation += "+"
            explanation += f" items: {self.base_price} BDT"
            
            if self.has_incremental_pricing and quantity > self.min_quantity:
                excess_quantity = quantity - self.min_quantity
                import math
                increment_units = math.ceil(float(excess_quantity) / float(self.increment_unit_size))
                additional_cost = increment_units * self.increment_per_unit
                explanation += f" + {increment_units} × {self.increment_per_unit} BDT (for {excess_quantity} excess items in {self.increment_unit_size} item increments) = {self.get_price_for_quantity(quantity)} BDT"
            
            return explanation
        
        return "No calculation available"

class FreeShippingRule(models.Model):
    """Rules that define when free shipping should be applied"""
    name = models.CharField(max_length=150, blank=True, default='', help_text="Display name for the rule")
    threshold_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Minimum order amount required for free shipping"
    )
    applicable_categories = models.ManyToManyField(
        'products.Category',
        blank=True,
        help_text="Shipping categories this rule applies to. Leave blank for all categories."
    )
    applicable_products = models.ManyToManyField(
        'products.Product',  # ← string reference
        blank=True,
        related_name='free_shipping_rules',
    )
    active = models.BooleanField(default=True, help_text="Whether this rule is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Free Shipping Rule"
        verbose_name_plural = "Free Shipping Rules"
        ordering = ['-threshold_amount']  # Higher thresholds first
    
    def __str__(self):
        from utils.currency import format_bdt
        categories_count = self.applicable_categories.count()
        categories_str = f"({categories_count} categories)" if categories_count > 0 else "(all categories)"
        return f"Free shipping over {format_bdt(self.threshold_amount, True)} {categories_str}"
    
    def applies_to_category(self, shipping_category):
        """Check if this rule applies to the given shipping category"""
        if not self.active:
            return False
        
        # If no specific categories are set, rule applies to all
        if self.applicable_categories.count() == 0:
            return True
        
        # Check if the category is in the applicable categories
        return self.applicable_categories.filter(id=shipping_category.id).exists()

class Coupon(models.Model):
    class CouponType(models.TextChoices):
        PRODUCT_DISCOUNT    = 'PRODUCT_DISCOUNT',    'Product Discount'
        MIN_PRODUCT_QUANTITY= 'MIN_PRODUCT_QUANTITY','Minimum Product Quantity'
        SHIPPING_DISCOUNT   = 'SHIPPING_DISCOUNT',   'Shipping Discount'
        CART_TOTAL_DISCOUNT = 'CART_TOTAL_DISCOUNT', 'Cart Total Discount'
        FIRST_TIME_USER     = 'FIRST_TIME_USER',     'First Time User'
        USER_SPECIFIC       = 'USER_SPECIFIC',       'User Specific'

    class DiscountType(models.TextChoices):
        PERCENT = 'PERCENT', 'Percentage'
        FLAT    = 'FLAT',    'Flat Amount'

    code                  = models.CharField(max_length=50, unique=True, db_index=True)
    type                  = models.CharField(max_length=25, choices=CouponType.choices, default=CouponType.PRODUCT_DISCOUNT, db_index=True)
    discount_type         = models.CharField(max_length=10, choices=DiscountType.choices, default=DiscountType.PERCENT)  # ← NEW
    discount_percent      = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount       = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # ← NEW (flat)
    min_quantity_required = models.PositiveIntegerField(default=1)
    min_cart_total        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    usage_limit           = models.PositiveIntegerField(null=True, blank=True)
    used_count            = models.PositiveIntegerField(default=0)
    applicable_products   = models.ManyToManyField('products.Product', blank=True, related_name='coupons')
    eligible_users        = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='specific_coupons')
    active                = models.BooleanField(default=True, db_index=True)
    created_at            = models.DateTimeField(auto_now_add=True)
    valid_from            = models.DateTimeField(default=timezone.now, db_index=True)
    expires_at            = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"
        indexes = [
            models.Index(fields=['code', 'active'], name='coupon_code_active_idx'),
            models.Index(fields=['active', 'expires_at'], name='coupon_active_expires_idx'),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.get_type_display()} ({self.discount_percent}%)"
    
    def is_expired(self):
        """Check if the coupon has expired"""
        return timezone.now() > self.expires_at
    
    def is_valid_period(self):
        """Check if the current time is within the coupon's valid period"""
        now = timezone.now()
        return self.valid_from <= now <= self.expires_at
    
    def is_valid_for_cart(self, cart_items, user=None, cart_total=None):
        """
        Validate if the coupon can be applied to the given cart
        
        Args:
            cart_items: List of cart items, each having 'quantity' and 'product' attributes
            user: User instance for user-specific validations (optional)
            cart_total: Total cart amount for cart total discount validation (optional)
            
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        # Check if coupon is active
        if not self.active:
            return False, "This coupon is not active."
        
        # Check if current time is within valid period (valid_from to expires_at)
        if not self.is_valid_period():
            now = timezone.now()
            if now < self.valid_from:
                return False, f"This coupon is not yet valid. It becomes active on {self.valid_from.strftime('%Y-%m-%d %H:%M')}."
            elif now > self.expires_at:
                return False, "This coupon has expired."
        
        # Calculate total quantity in cart
        total_quantity = sum(item.get('quantity', 0) for item in cart_items)
        
        # Type-specific validations
        if self.type == self.CouponType.PRODUCT_DISCOUNT:
            # PRODUCT_DISCOUNT: Apply to product subtotal
            # Basic quantity check for any product discount
            if total_quantity < self.min_quantity_required:
                return False, f"You need at least {self.min_quantity_required} items in your cart to use this product discount coupon."
            
        elif self.type == self.CouponType.MIN_PRODUCT_QUANTITY:
            # MIN_PRODUCT_QUANTITY: Check total items in cart
            if total_quantity < self.min_quantity_required:
                return False, f"This coupon requires at least {self.min_quantity_required} products in your cart. You currently have {total_quantity} items."
        
        elif self.type == self.CouponType.SHIPPING_DISCOUNT:
            # SHIPPING_DISCOUNT: Only apply to shipping amount
            # Check if minimum quantity is met for shipping discount eligibility
            if total_quantity < self.min_quantity_required:
                return False, f"You need at least {self.min_quantity_required} items in your cart to qualify for shipping discount. You currently have {total_quantity} items."
        
        elif self.type == self.CouponType.CART_TOTAL_DISCOUNT:
            # CART_TOTAL_DISCOUNT: Check minimum cart total requirement
            if cart_total is None:
                return False, "Cart total is required to validate this coupon."
            
            if self.min_cart_total and float(cart_total) < float(self.min_cart_total):
                from utils.currency import format_bdt
                return False, f"This coupon requires a minimum cart total of {format_bdt(self.min_cart_total, True)}. Your current total is {format_bdt(cart_total, True)}."
            
            # Also check minimum quantity if specified
            if total_quantity < self.min_quantity_required:
                return False, f"You need at least {self.min_quantity_required} items in your cart to use this coupon."
        
        elif self.type == self.CouponType.FIRST_TIME_USER:
            # FIRST_TIME_USER: Check if user has no previous orders
            if user is None:
                return False, "User authentication is required for this coupon."
            
            if user.orders.filter(status__in=['PROCESSING', 'SHIPPED', 'DELIVERED']).exists():
                return False, "This coupon is only available for first-time customers."
            
            # Also check minimum quantity if specified
            if total_quantity < self.min_quantity_required:
                return False, f"You need at least {self.min_quantity_required} items in your cart to use this first-time user coupon."
        
        elif self.type == self.CouponType.USER_SPECIFIC:
            # USER_SPECIFIC: Check if user is in eligible users list
            if user is None:
                return False, "User authentication is required for this coupon."
            
            if not self.eligible_users.filter(id=user.id).exists():
                return False, "This coupon is not available for your account."
            
            # Also check minimum quantity if specified
            if total_quantity < self.min_quantity_required:
                return False, f"You need at least {self.min_quantity_required} items in your cart to use this coupon."
        
        # If all validations pass
        return True, "Coupon is valid and can be applied."
    
    def calculate_discount(self, cart_total, shipping_cost=0):
        """
        Calculate the discount amount based on coupon type
        
        Args:
            cart_total: Total cart value
            shipping_cost: Shipping cost
            
        Returns:
            dict: {'product_discount': amount, 'shipping_discount': amount}
        """
        discount_amount = float(self.discount_percent) / 100
        
        if self.type == self.CouponType.PRODUCT_DISCOUNT:
            return {
                'product_discount': float(cart_total) * discount_amount,
                'shipping_discount': 0
            }
        elif self.type == self.CouponType.MIN_PRODUCT_QUANTITY:
            return {
                'product_discount': float(cart_total) * discount_amount,
                'shipping_discount': 0
            }
        elif self.type == self.CouponType.SHIPPING_DISCOUNT:
            return {
                'product_discount': 0,
                'shipping_discount': float(shipping_cost) * discount_amount
            }
        elif self.type == self.CouponType.CART_TOTAL_DISCOUNT:
            return {
                'product_discount': float(cart_total) * discount_amount,
                'shipping_discount': 0
            }
        elif self.type == self.CouponType.FIRST_TIME_USER:
            # First time user discount applies to cart total
            return {
                'product_discount': float(cart_total) * discount_amount,
                'shipping_discount': 0
            }
        elif self.type == self.CouponType.USER_SPECIFIC:
            # User specific discount applies to cart total
            return {
                'product_discount': float(cart_total) * discount_amount,
                'shipping_discount': 0
            }
        
        return {'product_discount': 0, 'shipping_discount': 0}

class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        PROCESSING = 'PROCESSING', 'Processing'
        SHIPPED = 'SHIPPED', 'Shipped'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', db_index=True)
    order_number = models.CharField(max_length=50, unique=True, blank=True, db_index=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    cart_subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Subtotal before shipping and discounts")
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True)
    # Frutos-specific fields
    fulfillment = models.CharField(max_length=20, blank=True, null=True, help_text='delivery, collect, instore')
    delivery_date = models.CharField(max_length=50, blank=True, null=True, help_text='YYYY-MM-DD')
    delivery_slot = models.ForeignKey('DeliverySlot', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    original_subtotal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text='Subtotal before discounts')
    promo_discount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0)
    wholesale_user = models.ForeignKey(
        'wholesale.WholesaleUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='wholesale_orders'
    )
    fulfillment_store = models.ForeignKey(
        'stores.Store', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fulfilled_orders', help_text="Store from which this order is fulfilled"
    )
    
    # Make shipping fields nullable for safe migration of existing data
    shipping_address = models.ForeignKey(Address, on_delete=models.PROTECT, null=True, blank=True, help_text="Shipping address", db_index=True)
    shipping_method = models.ForeignKey(ShippingMethod, on_delete=models.PROTECT, null=True, blank=True, help_text="Shipping method", db_index=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True, help_text="Tracking number for order tracking")
    
    # Customer visibility
    is_hidden_from_customer = models.BooleanField(default=False, help_text="If True, order is hidden from the customer's history.")
    
    # Track which staff created this order (for staff order history)
    created_by_staff = models.ForeignKey(
        'staff.StaffProfile', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_orders', help_text="Staff member who created this order"
    )

    customer_name = models.CharField(max_length=100, help_text="Required customer name")
    customer_email = models.EmailField(help_text="Required customer email", db_index=True)
    customer_phone = models.CharField(max_length=50, help_text="Required customer phone number")
    


     # ── Inline address fields ──────────────────────────────────────
    street_address      = models.CharField(max_length=255, blank=True, default='')
    city                = models.CharField(max_length=100, blank=True, default='')
    postcode            = models.CharField(max_length=20,  blank=True, default='')
    payment_method      = models.CharField(max_length=50,  blank=True, default='cash')
    delivery_slot_label = models.CharField(max_length=100, blank=True, default='')

    ordered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['-ordered_at'], name='order_ordered_at_idx'),
            models.Index(fields=['user', '-ordered_at'], name='order_user_ordered_idx'),
            models.Index(fields=['status', '-ordered_at'], name='order_status_ordered_idx'),
            models.Index(fields=['customer_email', '-ordered_at'], name='order_email_ordered_idx'),
        ]

    def __str__(self):
        return str(self.order_number)
    
    def save(self, *args, **kwargs):
        # Generate a human-readable order number if not set
        if not self.order_number:
            import datetime
            import random
            
            now = datetime.datetime.now()
            
            # Create readable order number: ORD + HHMMSS + 3-digit random number
            # Format: ORD242320004 (ORD + time in HHMMSS + 3 random digits)
            time_part = now.strftime('%H%M%S')  # Hours, minutes, seconds (HHMMSS)
            random_part = f"{random.randint(0, 999):03d}"  # 3-digit random number with leading zeros
            
            self.order_number = f"ORD{time_part}{random_part}"
            
            # Ensure uniqueness (handle unlikely collision by incrementing random part)
            counter = 1
            original_order_number = self.order_number
            while Order.objects.filter(order_number=self.order_number).exclude(pk=self.pk).exists():
                # If collision occurs, increment the random part
                new_random = (int(random_part) + counter) % 1000
                self.order_number = f"ORD{time_part}{new_random:03d}"
                counter += 1
                # If we've tried 1000 combinations, add a suffix
                if counter > 999:
                    self.order_number = f"{original_order_number}X{counter - 999}"
                    break
        
        super().save(*args, **kwargs)


class DeliverySlot(models.Model):
    """Time slot for scheduled deliveries"""
    name = models.CharField(max_length=100, help_text='e.g., morning, afternoon')
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        if self.start_time and self.end_time:
            return f"{self.name} ({self.start_time} - {self.end_time})"
        return self.name


class BlockedDate(models.Model):
    date = models.DateField()
    reason = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Blocked: {self.date} - {self.reason or ''}"




class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', db_index=True)
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    leftover_pack = models.ForeignKey('stores.LeftoverPack', on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    color = models.ForeignKey('products.Color', on_delete=models.SET_NULL, null=True, blank=True)
    size = models.ForeignKey('products.Size', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['order', 'product'], name='orderitem_order_product_idx'),
        ]

    def __str__(self):
        if self.product:
            return f"{self.quantity} of {self.product.name}"
        if self.leftover_pack:
            return f"{self.quantity} of Pack: {self.leftover_pack.name}"
        return f"{self.quantity} of Unknown Item"

class OrderUpdate(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='updates')
    status = models.CharField(max_length=20, choices=Order.OrderStatus.choices)
    notes = models.TextField(blank=True, null=True, help_text="e.g., 'Package has left the warehouse.'")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Update for {self.order.order_number} at {self.timestamp}"

class OrderPayment(models.Model):
    class PaymentMethod(models.TextChoices):
        BKASH = 'bkash', 'bKash'
        NAGAD = 'nagad', 'Nagad'
        CARD = 'card', 'Card'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    admin_account_number = models.CharField(max_length=50, help_text="Required backend-set account number")
    sender_number = models.CharField(max_length=50, help_text="Required customer's payment number")
    transaction_id = models.CharField(max_length=100, help_text="Required transaction/Reference ID")
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Order Payment"
        verbose_name_plural = "Order Payments"

    def __str__(self):
        return f"Payment for {self.order.order_number} - {self.get_payment_method_display()}"




# ══════════════════════════════════════════════════════════════════
# APPEND THIS ENTIRE BLOCK to the bottom of orders/models.py
# Do NOT modify anything above in orders/models.py
# ══════════════════════════════════════════════════════════════════

class ShippingZone(models.Model):
    ZONE_CHOICES = [
        ('DHK', 'Dhaka'),
        ('CTG', 'Chattogram'),
        ('RJH', 'Rajshahi'),
        ('KHL', 'Khulna'),
        ('SYL', 'Sylhet'),
        ('BRS', 'Barisal'),
        ('RNG', 'Rangpur'),
        ('MYM', 'Mymensingh'),
    ]
    name         = models.CharField(max_length=100)
    code         = models.CharField(max_length=20, unique=True, choices=ZONE_CHOICES)
    base_charge  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_sla = models.CharField(max_length=50, blank=True, help_text="e.g. '1-2 days'")
    is_active    = models.BooleanField(default=True)
    priority     = models.SmallIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['priority', 'name']
        verbose_name = 'Shipping Zone'
        verbose_name_plural = 'Shipping Zones'

    def __str__(self):
        return f'{self.name} ({self.code})'


class ShippingZoneCoverage(models.Model):
    zone     = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='coverages')
    city     = models.CharField(max_length=100, blank=True, db_index=True)
    postcode = models.CharField(max_length=20, blank=True, db_index=True)
    district = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = 'Zone Coverage'
        verbose_name_plural = 'Zone Coverages'

    def __str__(self):
        return f'{self.zone.code}: {self.city or self.postcode}'


class WeightShippingRule(models.Model):
    name        = models.CharField(max_length=100)
    min_weight  = models.DecimalField(max_digits=8, decimal_places=2)
    max_weight  = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    base_cost   = models.DecimalField(max_digits=10, decimal_places=2)
    per_kg_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    zone        = models.ForeignKey(
        ShippingZone, on_delete=models.CASCADE,
        null=True, blank=True, related_name='weight_rules',
    )
    is_active   = models.BooleanField(default=True)
    priority    = models.SmallIntegerField(default=0)

    class Meta:
        ordering = ['zone', 'min_weight']
        verbose_name = 'Weight Shipping Rule'
        verbose_name_plural = 'Weight Shipping Rules'

    def applies_to(self, weight):
        from decimal import Decimal
        w = Decimal(str(weight))
        if w < self.min_weight:
            return False
        if self.max_weight is not None and w > self.max_weight:
            return False
        return True

    def calculate_cost(self, weight):
        import math
        from decimal import Decimal
        if not self.applies_to(weight):
            return None
        w      = Decimal(str(weight))
        excess = max(w - self.min_weight, Decimal('0'))
        extra  = Decimal(str(math.ceil(float(excess)))) * self.per_kg_cost
        return self.base_cost + extra

    def __str__(self):
        max_w = f'-{self.max_weight}kg' if self.max_weight else 'kg+'
        zone  = f' [{self.zone.code}]' if self.zone else ' [Global]'
        return f'{self.min_weight}{max_w}{zone} → ৳{self.base_cost}'


class OrderValueShippingRule(models.Model):
    name             = models.CharField(max_length=100)
    min_order_value  = models.DecimalField(max_digits=10, decimal_places=2)
    max_order_value  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shipping_cost    = models.DecimalField(max_digits=10, decimal_places=2)
    is_free_shipping = models.BooleanField(default=False)
    zone             = models.ForeignKey(
        ShippingZone, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='value_rules',
    )
    is_active        = models.BooleanField(default=True)

    class Meta:
        ordering = ['min_order_value']
        verbose_name = 'Order Value Shipping Rule'
        verbose_name_plural = 'Order Value Shipping Rules'

    def applies_to(self, order_value, zone=None):
        from decimal import Decimal
        v = Decimal(str(order_value))
        if v < self.min_order_value:
            return False
        if self.max_order_value is not None and v > self.max_order_value:
            return False
        if self.zone_id and zone and self.zone_id != zone.id:
            return False
        return True

    def __str__(self):
        max_v = f'-৳{self.max_order_value}' if self.max_order_value else '+'
        return f'৳{self.min_order_value}{max_v} → ৳{self.shipping_cost}'


class CategoryShippingRule(models.Model):
    category          = models.OneToOneField(
        'products.Category', on_delete=models.CASCADE, related_name='shipping_rule',
    )
    additional_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_override       = models.BooleanField(
        default=False,
        help_text='If True, override_cost replaces all other shipping charges',
    )
    override_cost     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active         = models.BooleanField(default=True)
    notes             = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Category Shipping Rule'
        verbose_name_plural = 'Category Shipping Rules'

    def __str__(self):
        return f'{self.category.name}: +৳{self.additional_charge}'


class CourierProvider(models.Model):
    name            = models.CharField(max_length=100)
    slug            = models.SlugField(unique=True)
    api_key         = models.CharField(max_length=255, blank=True)
    api_secret      = models.CharField(max_length=255, blank=True)
    tracking_url    = models.CharField(
        max_length=500, blank=True,
        help_text='Use {tracking_number} as placeholder',
    )
    webhook_url     = models.CharField(max_length=500, blank=True)
    base_url        = models.CharField(max_length=500, blank=True)
    is_active       = models.BooleanField(default=True)
    supported_zones = models.ManyToManyField(ShippingZone, blank=True, related_name='couriers')
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Courier Provider'
        verbose_name_plural = 'Courier Providers'

    def get_tracking_url(self, tracking_number):
        return self.tracking_url.replace('{tracking_number}', str(tracking_number))

    def __str__(self):
        return self.name


class Warehouse(models.Model):
    name               = models.CharField(max_length=150)
    code               = models.CharField(max_length=30, unique=True)
    address            = models.TextField(blank=True)
    city               = models.CharField(max_length=100, blank=True)
    postcode           = models.CharField(max_length=20, blank=True)
    zone               = models.ForeignKey(
        ShippingZone, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='warehouses',
    )
    delivery_radius_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    priority           = models.SmallIntegerField(default=0, help_text='Lower = preferred')
    is_active          = models.BooleanField(default=True)
    contact_phone      = models.CharField(max_length=50, blank=True)
    contact_email      = models.EmailField(blank=True)

    class Meta:
        ordering = ['priority', 'name']
        verbose_name = 'Warehouse'
        verbose_name_plural = 'Warehouses'

    def __str__(self):
        return f'{self.name} ({self.code})'


class WarehouseZoneMapping(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='zone_mappings')
    zone      = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='warehouse_mappings')

    class Meta:
        unique_together = ('warehouse', 'zone')
        verbose_name = 'Warehouse Zone Mapping'

    def __str__(self):
        return f'{self.warehouse.code} → {self.zone.code}'


class LeftoverPackShippingRule(models.Model):
    RULE_TYPE_CHOICES = [
        ('fixed',      'Fixed Cost'),
        ('reduced',    'Reduced (% off standard)'),
        ('free',       'Free Shipping'),
        ('zone_based', 'Zone-Based Cost'),
    ]
    name              = models.CharField(max_length=150)
    rule_type         = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    fixed_cost        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reduction_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="For 'reduced' type: % off standard shipping",
    )
    zone              = models.ForeignKey(
        ShippingZone, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='leftover_rules',
        help_text='For zone_based type only',
    )
    zone_cost         = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active         = models.BooleanField(default=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Leftover Pack Shipping Rule'
        verbose_name_plural = 'Leftover Pack Shipping Rules'

    def __str__(self):
        return f'{self.name} ({self.get_rule_type_display()})'

    def calculate_cost(self, standard_cost, zone=None):
        from decimal import Decimal
        if self.rule_type == 'free':
            return Decimal('0')
        if self.rule_type == 'fixed':
            return self.fixed_cost
        if self.rule_type == 'reduced':
            discount = Decimal(str(self.reduction_percent)) / 100
            return standard_cost * (1 - discount)
        if self.rule_type == 'zone_based':
            if zone and self.zone_id and self.zone_id == zone.id:
                return self.zone_cost or Decimal('0')
            return standard_cost
        return standard_cost
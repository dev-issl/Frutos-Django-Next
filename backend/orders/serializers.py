# orders/serializers.py
import logging
import traceback
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import (
    Order, OrderItem, OrderUpdate, ShippingMethod, OrderPayment,
    Coupon, ShippingTier, FreeShippingRule
)
from products.models import Product, Color, Size, CategoryMinimumOrderQuantity, Category
from products.serializers import ColorSerializer, SizeSerializer
from users.models import Address

User = get_user_model()
logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
#  ORDER CREATION SERIALIZERS
# ══════════════════════════════════════════════════════════════════

class OrderItemCreateSerializer(serializers.Serializer):
    """Single item in an order — product or leftover_pack is ID/UUID string."""
    product       = serializers.UUIDField(required=False, allow_null=True)
    leftover_pack = serializers.IntegerField(required=False, allow_null=True)
    item_type     = serializers.CharField(required=False, default='product')
    quantity      = serializers.IntegerField(min_value=1)
    color         = serializers.CharField(allow_null=True, required=False, allow_blank=True)
    size          = serializers.CharField(allow_null=True, required=False, allow_blank=True)

    def validate(self, data):
        item_type = data.get('item_type', 'product')
        if item_type == 'product':
            if not data.get('product'):
                raise serializers.ValidationError({"product": "Product ID is required for product items."})
            if not Product.objects.filter(id=data['product']).exists():
                raise serializers.ValidationError({"product": "Product does not exist."})
        elif item_type == 'pack':
            if not data.get('leftover_pack'):
                raise serializers.ValidationError({"leftover_pack": "Pack ID is required for leftover pack items."})
            from stores.models import LeftoverPack
            if not LeftoverPack.objects.filter(id=data['leftover_pack']).exists():
                raise serializers.ValidationError({"leftover_pack": "Leftover Pack does not exist."})
        else:
            raise serializers.ValidationError({"item_type": "Invalid item_type. Must be 'product' or 'pack'."})
        return data

    def validate_color(self, value):
        if not value:
            return None
            
        try:
            if str(value).isdigit():
                color_obj = Color.objects.filter(id=value).first()
                if color_obj:
                    return color_obj.id
                raise serializers.ValidationError(f"Color with ID '{value}' does not exist.")
            else:
                color_obj = Color.objects.filter(name__iexact=value).first()
                if color_obj:
                    return color_obj.id
                raise serializers.ValidationError(f"Color '{value}' does not exist.")
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate_size(self, value):
        if not value:
            return None
            
        try:
            if str(value).isdigit():
                size_obj = Size.objects.filter(id=value).first()
                if size_obj:
                    return size_obj.id
                raise serializers.ValidationError(f"Size with ID '{value}' does not exist.")
            else:
                size_obj = Size.objects.filter(name__iexact=value).first()
                if size_obj:
                    return size_obj.id
                raise serializers.ValidationError(f"Size '{value}' does not exist.")
        except Exception as e:
            raise serializers.ValidationError(str(e))


class OrderCreateSerializer(serializers.Serializer):
    """
    Accepts inline address data from the frontend.
    No shipping_address FK or shipping_method FK required.
    """
    # ── Customer ──────────────────────────────────────────────────
    customer_name  = serializers.CharField(max_length=100)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=50)

    # ── Inline address ────────────────────────────────────────────
    street_address = serializers.CharField(max_length=255)
    city           = serializers.CharField(max_length=100)
    postcode       = serializers.CharField(max_length=20)

    # ── Delivery ──────────────────────────────────────────────────
    delivery_date       = serializers.CharField(max_length=50,  required=False, allow_blank=True, default='')
    delivery_slot       = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    delivery_slot_label = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    # ── Payment ───────────────────────────────────────────────────
    payment_method = serializers.CharField(max_length=50, default='cash')

    # ── Coupon ────────────────────────────────────────────────────
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')

    # ── Items ─────────────────────────────────────────────────────
    items = OrderItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def create(self, validated_data):
        items_data  = validated_data.pop('items')
        coupon_code = validated_data.pop('coupon_code', '').strip()

        request = self.context.get('request')
        user    = request.user if request and request.user.is_authenticated else None

        with transaction.atomic():
            # ── Build cart ────────────────────────────────────────
            cart_subtotal = Decimal('0.00')
            cart_items    = []

            for item_data in items_data:
                item_type = item_data.get('item_type', 'product')
                qty       = item_data['quantity']
                
                if item_type == 'product':
                    try:
                        product = Product.objects.get(id=item_data['product'])
                    except Product.DoesNotExist:
                        raise serializers.ValidationError(f"Product '{item_data['product']}' not found.")
                    
                    if product.stock is not None and product.stock < qty:
                        raise serializers.ValidationError(f"Not enough stock for '{product.name}'. Available: {product.stock}, Requested: {qty}")
                    
                    unit_price = product.discount_price if product.discount_price else product.price
                    subtotal   = unit_price * qty
                    cart_subtotal += subtotal
                    cart_items.append({
                        'item_type':  'product',
                        'product':    product,
                        'quantity':   qty,
                        'unit_price': unit_price,
                        'color_id':   item_data.get('color'),
                        'size_id':    item_data.get('size'),
                    })
                elif item_type == 'pack':
                    from stores.models import LeftoverPack
                    try:
                        pack = LeftoverPack.objects.get(id=item_data['leftover_pack'])
                    except LeftoverPack.DoesNotExist:
                        raise serializers.ValidationError(f"Pack '{item_data['leftover_pack']}' not found.")
                    
                    if pack.stock is not None and pack.stock < qty:
                        raise serializers.ValidationError(f"Not enough stock for '{pack.name}'. Available: {pack.stock}, Requested: {qty}")
                    
                    unit_price = pack.price
                    subtotal   = unit_price * qty
                    cart_subtotal += subtotal
                    cart_items.append({
                        'item_type':     'pack',
                        'leftover_pack': pack,
                        'quantity':      qty,
                        'unit_price':    unit_price,
                        'color_id':      None,
                        'size_id':       None,
                    })

            # ── Wholesale validation ──────────────────────────────
            is_wholesale = False
            if user:
                is_wholesale_user = (getattr(user, 'user_type', None) == 'WHOLESALER') or (user.__class__.__name__ == 'WholesaleUser')
                if is_wholesale_user:
                    is_approved = False
                    if user.__class__.__name__ == 'WholesaleUser':
                        is_approved = getattr(user, 'status', '').lower() == 'approved' or getattr(user, 'is_approved', False)
                    else:
                        profile = getattr(user, 'wholesaler_profile', None)
                        is_approved = profile and getattr(profile, 'approval_status', None) == 'APPROVED'
                        
                    if is_approved:
                        self._validate_wholesale_minimums(cart_items)
                        is_wholesale = True
                    else:
                        raise serializers.ValidationError("Your wholesaler account is not yet approved.")

            # ── Coupon ────────────────────────────────────────────
            product_discount = Decimal('0.00')
            if coupon_code:
                try:
                    coupon = Coupon.objects.get(code=coupon_code, active=True)
                    is_valid, message = coupon.is_valid_for_cart(
                        [{'quantity': i['quantity']} for i in cart_items],
                        user,
                        cart_subtotal,
                    )
                    if not is_valid:
                        raise serializers.ValidationError(f"Coupon error: {message}")
                    discounts        = coupon.calculate_discount(cart_subtotal)
                    product_discount = Decimal(str(discounts.get('product_discount', 0)))
                except Coupon.DoesNotExist:
                    raise serializers.ValidationError("Invalid coupon code.")

            total_amount = cart_subtotal - product_discount

            # ── Create Order ──────────────────────────────────────
            final_user = None
            final_wholesale_user = None
            
            if user:
                if user.__class__.__name__ == 'WholesaleUser':
                    final_wholesale_user = user
                else:
                    final_user = user

            order = Order.objects.create(
                user                = final_user,
                wholesale_user      = final_wholesale_user,
                customer_name       = validated_data['customer_name'],
                customer_email      = validated_data['customer_email'],
                customer_phone      = validated_data['customer_phone'],
                street_address      = validated_data.get('street_address', ''),
                city                = validated_data.get('city', ''),
                postcode            = validated_data.get('postcode', ''),
                payment_method      = validated_data.get('payment_method', 'cash'),
                delivery_date       = validated_data.get('delivery_date', ''),
                delivery_slot_label = (
                    validated_data.get('delivery_slot_label', '')
                    or validated_data.get('delivery_slot', '')
                ),
                promo_discount      = product_discount,
                cart_subtotal       = cart_subtotal,
                total_amount        = total_amount,
            )

            # ── Create OrderItems ─────────────────────────────────
            for item in cart_items:
                color = None
                size  = None
                if item.get('color_id'):
                    color = Color.objects.filter(id=item['color_id']).first()
                if item.get('size_id'):
                    size_val = item['size_id']
                    if isinstance(size_val, int) or str(size_val).isdigit():
                        size = Size.objects.filter(id=size_val).first()
                    elif isinstance(size_val, str) and size_val.strip():
                        from products.models import Size
                        size, _ = Size.objects.get_or_create(name=size_val.strip())

                if item.get('item_type') == 'product':
                    product = item['product']

                    OrderItem.objects.create(
                        order      = order,
                        product    = product,
                        quantity   = item['quantity'],
                        unit_price = item['unit_price'],
                        color      = color,
                        size       = size,
                    )
                else:
                    pack = item['leftover_pack']

                    OrderItem.objects.create(
                        order         = order,
                        leftover_pack = pack,
                        quantity      = item['quantity'],
                        unit_price    = item['unit_price'],
                        color         = color,
                        size          = size,
                    )

            # ── Order log ─────────────────────────────────────────
            OrderUpdate.objects.create(
                order  = order,
                status = order.status,
                notes  = "Order placed successfully.",
            )

            # ── Send Notifications ────────────────────────────────────────
            from accounts.notifications import send_admin_notification
            
            # 1. Notify Admins about the new order
            try:
                send_admin_notification(
                    notification_type='admin_alert',
                    title='New Order Placed 🛍️',
                    message=f'Order #{order.order_number} has been placed. Total: €{order.total_amount}',
                    metadata={'orderNumber': str(order.order_number), 'icon': 'shopping_bag'}
                )
            except Exception as e:
                logger.error(f"Failed to send new order notification to admins: {e}")

            # 1.5 Notify Customer about the new order
            try:
                from accounts.notifications import send_order_status_notification
                send_order_status_notification(order)
            except Exception as e:
                logger.error(f"Failed to send new order notification to customer: {e}")

            # 2. Check if any product went out of stock
            for item in cart_items:
                if item.get('item_type') == 'product':
                    product = item['product']
                    if product.stock is not None and product.stock <= 0:
                        try:
                            send_admin_notification(
                                notification_type='out_of_stock',
                                title='Product Out of Stock ⚠️',
                                message=f'Product "{product.name}" is now out of stock after order #{order.order_number}.',
                                metadata={'productId': str(product.id), 'productName': product.name, 'icon': 'warning'}
                            )
                        except Exception as e:
                            logger.error(f"Failed to send out of stock notification for {product.name}: {e}")

            return order

    def _validate_wholesale_minimums(self, cart_items):
        from collections import defaultdict
        category_quantities = defaultdict(int)
        for item in cart_items:
            if item.get('item_type') == 'pack':
                continue
            product  = item['product']
            category = product.sub_category.category
            category_quantities[category] += item['quantity']

        errors = []
        for category, qty in category_quantities.items():
            try:
                req = CategoryMinimumOrderQuantity.objects.get(category=category)
                if qty < req.minimum_quantity:
                    errors.append(
                        f"'{category.name}' requires minimum {req.minimum_quantity} units "
                        f"(you have {qty})."
                    )
            except CategoryMinimumOrderQuantity.DoesNotExist:
                continue
        if errors:
            raise serializers.ValidationError(" | ".join(errors))


# ══════════════════════════════════════════════════════════════════
#  READ SERIALIZERS
# ══════════════════════════════════════════════════════════════════

class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderUpdate
        fields = ['id', 'status', 'notes', 'timestamp']


class OrderItemReadSerializer(serializers.ModelSerializer):
    product_name  = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    color_name    = serializers.CharField(source='color.name',     read_only=True)
    size_name     = serializers.SerializerMethodField()
    line_total    = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_image', 'leftover_pack',
            'color', 'color_name', 'size', 'size_name',
            'quantity', 'unit_price', 'line_total',
        ]

    def get_product_name(self, obj):
        if obj.product:
            if obj.product.variant:
                return f"{obj.product.name} ({obj.product.variant})"
            return obj.product.name
        if obj.leftover_pack:
            return f"Leftover Pack: {obj.leftover_pack.name}"
        return "Unknown"

    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product and obj.product.thumbnail:
            url = obj.product.thumbnail.url
            return request.build_absolute_uri(url) if request else url
        if obj.leftover_pack and obj.leftover_pack.image:
            url = obj.leftover_pack.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_line_total(self, obj):
        return str(obj.quantity * obj.unit_price)

    def get_size_name(self, obj):
        if obj.size:
            return obj.size.name
        if obj.product and obj.product.unit:
            unit_str = obj.product.unit.lower()
            if unit_str.startswith('per '):
                return unit_str[4:].strip()
            return obj.product.unit
        return None


class OrderPaymentReadSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )

    class Meta:
        model  = OrderPayment
        fields = [
            'admin_account_number', 'sender_number', 'transaction_id',
            'payment_method', 'payment_method_display', 'created_at',
        ]


class OrderReadSerializer(serializers.ModelSerializer):
    items                  = OrderItemReadSerializer(many=True, read_only=True)
    payment                = OrderPaymentReadSerializer(read_only=True)
    updates                = OrderUpdateSerializer(many=True, read_only=True)
    status_display         = serializers.CharField(source='get_status_display',         read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    is_wholesale_order     = serializers.SerializerMethodField()

    # Writable fields for PATCH (admin status update)
    status         = serializers.CharField(required=False)
    payment_status = serializers.CharField(required=False)
    tracking_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    fulfillment_store = serializers.PrimaryKeyRelatedField(
        queryset=__import__('stores.models', fromlist=['Store']).Store.objects.all(),
        required=False, allow_null=True
    )

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'total_amount', 'cart_subtotal',
            'status', 'status_display', 'payment_status', 'payment_status_display',
            'customer_name', 'customer_email', 'customer_phone',
            'street_address', 'city', 'postcode',
            'payment_method', 'delivery_date', 'delivery_slot_label',
            'tracking_number', 'is_wholesale_order', 'fulfillment_store',
            'ordered_at', 'items', 'payment', 'updates',
        ]

    def get_is_wholesale_order(self, obj):
        if getattr(obj, 'is_wholesale_order', False) or obj.wholesale_user_id:
            return True
        if obj.user_id and getattr(obj.user, 'user_type', None) == 'WHOLESALER':
            return True
        if obj.customer_email:
            try:
                from wholesale.models import WholesaleUser
                if WholesaleUser.objects.filter(email__iexact=obj.customer_email).exists():
                    return True
            except Exception:
                pass
        return False


# ══════════════════════════════════════════════════════════════════
#  PAYMENT CONFIRM SERIALIZER
# ══════════════════════════════════════════════════════════════════

class OrderPaymentCreateSerializer(serializers.Serializer):
    sender_number        = serializers.CharField(max_length=50)
    transaction_id       = serializers.CharField(max_length=100)
    payment_method       = serializers.ChoiceField(choices=OrderPayment.PaymentMethod.choices)
    admin_account_number = serializers.CharField(max_length=50, required=False)

    def validate_transaction_id(self, value):
        if OrderPayment.objects.filter(transaction_id=value).exists():
            raise serializers.ValidationError("Transaction ID already exists.")
        return value


# ══════════════════════════════════════════════════════════════════
#  SHIPPING SERIALIZERS
# ══════════════════════════════════════════════════════════════════

class ShippingTierSerializer(serializers.ModelSerializer):
    pricing_explanation = serializers.SerializerMethodField()
    applicable_range    = serializers.SerializerMethodField()

    class Meta:
        model  = ShippingTier
        fields = [
            'id', 'min_quantity', 'max_quantity', 'min_weight', 'max_weight',
            'pricing_type', 'base_price', 'has_incremental_pricing',
            'increment_per_unit', 'increment_unit_size', 'priority',
            'pricing_explanation', 'applicable_range',
        ]

    def get_pricing_explanation(self, obj):
        if obj.has_incremental_pricing:
            unit = "kg" if obj.pricing_type == 'weight' else "items"
            return f"Base: {obj.base_price} + {obj.increment_per_unit} per {obj.increment_unit_size} {unit}"
        return f"Fixed: {obj.base_price}"

    def get_applicable_range(self, obj):
        if obj.pricing_type == 'weight':
            r = f"{obj.min_weight}kg"
            return r + (f" - {obj.max_weight}kg" if obj.max_weight else "+")
        r = f"{obj.min_quantity}"
        return r + (f" - {obj.max_quantity} items" if obj.max_quantity else "+ items")


class ShippingMethodSerializer(serializers.ModelSerializer):
    title               = serializers.CharField(source='name', read_only=True)
    shipping_tiers      = ShippingTierSerializer(many=True, read_only=True)
    quantity_tiers      = serializers.SerializerMethodField()
    weight_tiers        = serializers.SerializerMethodField()
    shipping_categories = serializers.SerializerMethodField()

    class Meta:
        model  = ShippingMethod
        fields = [
            'id', 'title', 'name', 'description', 'price',
            'delivery_estimated_time', 'max_weight', 'max_quantity',
            'preferred_pricing_type', 'is_wholesale_only', 'shipping_tiers',
            'quantity_tiers', 'weight_tiers', 'shipping_categories',
        ]

    def get_quantity_tiers(self, obj):
        return ShippingTierSerializer(
            obj.shipping_tiers.filter(pricing_type='quantity'), many=True
        ).data

    def get_weight_tiers(self, obj):
        return ShippingTierSerializer(
            obj.shipping_tiers.filter(pricing_type='weight'), many=True
        ).data

    def get_shipping_categories(self, obj):
        return [
            {'id': c.id, 'name': c.name}
            for c in obj.shipping_categories.all()
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['quantity_pricing_examples'] = [
            {'quantity': q, 'price': str(instance.get_price_for_quantity(q))}
            for q in [1, 5, 10, 20]
        ]
        rep['weight_pricing_examples'] = [
            {'weight': w, 'price': str(instance.get_price_for_weight(w))}
            for w in [0.5, 1.0, 1.5, 2.0, 3.0]
        ]
        return rep


class ShippingCategorySerializer(serializers.ModelSerializer):
    allowed_shipping_methods = ShippingMethodSerializer(many=True, read_only=True)

    class Meta:
        model  = Category
        fields = ['id', 'name', 'allowed_shipping_methods']


class FreeShippingRuleSerializer(serializers.ModelSerializer):
    applicable_categories = ShippingCategorySerializer(many=True, read_only=True)

    class Meta:
        model  = FreeShippingRule
        fields = [
            'id', 'name', 'threshold_amount', 'applicable_categories',
            'applicable_products', 'active', 'created_at',
        ]


class FreeShippingRuleWriteSerializer(serializers.ModelSerializer):
    applicable_categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    applicable_products = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Product.objects.all(), required=False
    )

    class Meta:
        model  = FreeShippingRule
        fields = ['id', 'name', 'threshold_amount', 'applicable_categories', 'applicable_products', 'active']


# ══════════════════════════════════════════════════════════════════
#  COUPON SERIALIZERS
# ══════════════════════════════════════════════════════════════════
class CouponSerializer(serializers.ModelSerializer):
    type_display             = serializers.CharField(source='get_type_display', read_only=True)
    is_expired               = serializers.SerializerMethodField()
    is_valid_period          = serializers.SerializerMethodField()
    eligible_users_count     = serializers.SerializerMethodField()
    applicable_products_data = serializers.SerializerMethodField()

    class Meta:
        model  = Coupon
        fields = [
            'id', 'code', 'type', 'type_display',
            'discount_type', 'discount_percent', 'discount_amount',
            'min_quantity_required', 'min_cart_total',
            'usage_limit', 'used_count',
            'applicable_products', 'applicable_products_data',
            'active', 'is_expired', 'is_valid_period',
            'eligible_users_count', 'created_at', 'valid_from', 'expires_at',
        ]
        read_only_fields = ['created_at', 'used_count']

    def get_is_expired(self, obj):
        try: return obj.is_expired()
        except: return False

    def get_is_valid_period(self, obj):
        try: return obj.is_valid_period()
        except: return True

    def get_eligible_users_count(self, obj):
        if obj.type == 'USER_SPECIFIC':
            return obj.eligible_users.count()
        return None

    def get_applicable_products_data(self, obj):
        return [{'id': p.id, 'name': p.name} for p in obj.applicable_products.all()]


class CouponValidationSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(max_length=50)
    cart_items  = serializers.ListField(child=serializers.DictField())
    cart_total  = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    user_id     = serializers.IntegerField(required=False)


# ══════════════════════════════════════════════════════════════════
#  LEGACY / ADMIN SERIALIZERS
# ══════════════════════════════════════════════════════════════════

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Address
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    color   = serializers.StringRelatedField()
    size    = serializers.StringRelatedField()

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'leftover_pack', 'color', 'size', 'quantity', 'unit_price']

    def get_product(self, obj):
        if obj.product:
            if obj.product.variant:
                return f"{obj.product.name} ({obj.product.variant})"
            return obj.product.name
        if obj.leftover_pack:
            return f"Pack: {obj.leftover_pack.name}"
        return "Unknown"


class OrderPaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )

    class Meta:
        model  = OrderPayment
        fields = [
            'id', 'order', 'admin_account_number', 'sender_number',
            'transaction_id', 'payment_method', 'payment_method_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ShippingTierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingTier
        fields = [
            'id', 'shipping_method', 'min_quantity', 'max_quantity',
            'min_weight', 'max_weight', 'pricing_type', 'base_price',
            'has_incremental_pricing', 'increment_per_unit',
            'increment_unit_size', 'priority',
        ]


class ShippingMethodWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingMethod
        fields = [
            'id', 'name', 'description', 'price', 'delivery_estimated_time',
            'max_weight', 'max_quantity', 'preferred_pricing_type', 'is_active',
            'is_wholesale_only',
        ]


class ShippingCategoryWriteSerializer(serializers.ModelSerializer):
    allowed_shipping_methods = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ShippingMethod.objects.all(), required=False
    )

    class Meta:
        model  = Category
        fields = ['id', 'name', 'allowed_shipping_methods']

    def create(self, validated_data):
        methods = validated_data.pop('allowed_shipping_methods', [])
        obj     = Category.objects.create(**validated_data)
        obj.allowed_shipping_methods.set(methods)
        return obj

    def update(self, instance, validated_data):
        if 'allowed_shipping_methods' in validated_data:
            instance.allowed_shipping_methods.set(
                validated_data.pop('allowed_shipping_methods')
            )
        return super().update(instance, validated_data)


class OrderSerializer(serializers.ModelSerializer):
    items           = OrderItemSerializer(many=True, read_only=True)
    updates         = OrderUpdateSerializer(many=True, read_only=True)
    payment         = OrderPaymentSerializer(read_only=True)
    shipping_method = ShippingMethodSerializer(read_only=True)
    shipping_address = AddressSerializer(read_only=True)
    is_wholesale_order = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'total_amount', 'status', 'payment_status',
            'shipping_address', 'shipping_method', 'tracking_number', 'fulfillment_store',
            'ordered_at', 'items', 'updates', 'payment', 'is_wholesale_order'
        ]

    def get_is_wholesale_order(self, obj):
        if getattr(obj, 'is_wholesale_order', False) or obj.wholesale_user_id:
            return True
        if obj.user_id and getattr(obj.user, 'user_type', None) == 'WHOLESALER':
            return True
        if obj.customer_email:
            try:
                from wholesale.models import WholesaleUser
                if WholesaleUser.objects.filter(email__iexact=obj.customer_email).exists():
                    return True
            except Exception:
                pass
        return False
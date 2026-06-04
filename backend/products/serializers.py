# products/serializers.py
from rest_framework import serializers
from django.db.models import Q
from .models import *
from shops.serializers import ShopSerializer
from orders.models import OrderItem

class BrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'logo_url', 'description', 'website', 'is_active']
    
    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and hasattr(obj.logo, 'url'):
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None

class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name', 'hex_code']

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name']

class SubCategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = SubCategory
        fields = ['id','name','slug','image','image_url','category', 'category_name']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    total_products = serializers.IntegerField(read_only=True)
    sub_category_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'image', 'image_url',
            'subcategories', 'total_products', 'sub_category_count'
        ]
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True, 'validators': []},
            'image': {'required': False, 'allow_null': True},
        }

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ['name', 'value']

class ProductAdditionalImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model = ProductAdditionalImage
        fields = ['id', 'image']
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url)
        return None

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'product_name', 'rating', 'comment', 'created_at']

    def get_user(self, obj):
        u = obj.user
        full_name = getattr(u, 'name', '') or ''
        parts = full_name.strip().split(' ', 1)
        first = parts[0] if parts[0] else u.email.split('@')[0]
        last = parts[1] if len(parts) > 1 else ''
        return {
            'first_name': first,
            'last_name': last,
        }

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['product', 'rating', 'comment']

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
            
        user = request.user
        product = attrs.get('product')

        if user.is_staff or getattr(user, 'user_type', '') == 'ADMIN':
            return attrs

        has_purchased = OrderItem.objects.filter(
            Q(order__user=user) | Q(order__wholesale_user=user) | Q(order__customer_email=user.email),
            order__status='DELIVERED',
            product=product
        ).exists()

        if not has_purchased:
            raise serializers.ValidationError({"detail": "You can only review products you have purchased and received."})

        review_exists = Review.objects.filter(user=user, product=product)
        if self.instance:
            review_exists = review_exists.exclude(id=self.instance.id)
            
        if review_exists.exists():
            raise serializers.ValidationError({"detail": "You have already reviewed this product."})

        return attrs

class ProductSerializer(serializers.ModelSerializer):
    shop = ShopSerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    sub_category = SubCategorySerializer(read_only=True)
    shipping_category = CategorySerializer(read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    additional_images = ProductAdditionalImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    colors = ColorSerializer(many=True, read_only=True)
    sizes = SizeSerializer(many=True, read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    user_can_review = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'shop', 'brand', 'name', 'slug', 'description', 'category', 'sub_category', 'shipping_category',
            'price', 'discount_price', 'wholesale_price', 'minimum_purchase', 'affiliate_commission_rate', 'stock', 'is_active',
            'weight', 'length', 'width', 'height',  # Added physical properties for shipping
            'thumbnail_url', 'specifications', 'additional_images',
            'origin', 'unit', 'wholesale_unit', 'badge', 'badge_color',
            'colors', 'sizes', 'reviews', 'rating', 'review_count', 'user_can_review'
        ]
        
    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and hasattr(obj.thumbnail, 'url'):
            return request.build_absolute_uri(obj.thumbnail.url)
        return None
        
    def get_rating(self, obj):
        from django.db.models import Avg
        return obj.reviews.aggregate(Avg('rating'))['rating__avg'] or 0

    def get_review_count(self, obj):
        return obj.reviews.count()
        
    def get_user_can_review(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {"can_review": False, "message": "Please log in to submit a review."}
        
        user = request.user
        if user.is_staff or getattr(user, 'user_type', '') == 'ADMIN':
            return {"can_review": True, "message": ""}
            
        has_purchased = OrderItem.objects.filter(
            Q(order__user=user) | Q(order__wholesale_user=user) | Q(order__customer_email=user.email),
            order__status='DELIVERED',
            product=obj
        ).exists()
        
        if not has_purchased:
            return {"can_review": False, "message": "You can only review products you have purchased and received."}
            
        if Review.objects.filter(user=user, product=obj).exists():
            return {"can_review": False, "message": "You have already reviewed this product."}
            
        return {"can_review": True, "message": ""}

    def to_representation(self, instance):
        """
        Custom representation to handle dynamic pricing based on user type and wholesaler approval status
        """
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Initialize user context info
        user_context = {
            'is_wholesaler': False,
            'is_approved_wholesaler': False,
            'wholesaler_status': None
        }
        
        # Check if user is authenticated and get wholesaler info
        if (request and hasattr(request, 'user') and request.user and request.user.is_authenticated):
            if request.user.user_type == 'WHOLESALER':
                user_context['is_wholesaler'] = True
                # Check wholesaler approval status
                try:
                    if hasattr(request.user, 'wholesaler_profile'):
                        profile = request.user.wholesaler_profile
                        user_context['wholesaler_status'] = profile.approval_status
                        if profile.approval_status == 'APPROVED':
                            user_context['is_approved_wholesaler'] = True
                except:
                    # If wholesaler_profile doesn't exist, user is not approved
                    user_context['wholesaler_status'] = 'PENDING'
        
        # Add user context to response for frontend logic
        data['_user_context'] = user_context
        
        # Handle pricing data based on user type and approval status
        if user_context['is_approved_wholesaler']:
            # For approved wholesalers: only include wholesale_price if it exists and >= 1
            wholesale_price = instance.wholesale_price
            if not wholesale_price or wholesale_price < 1:
                # Remove wholesale pricing if not available
                data.pop('wholesale_price', None)
                data.pop('minimum_purchase', None)
            # If wholesale_price >= 1, keep both wholesale_price and minimum_purchase
        else:
            # For non-approved wholesalers, customers, and unauthenticated users: 
            # Remove wholesale_price and minimum_purchase for security
            data.pop('wholesale_price', None)
            data.pop('minimum_purchase', None)
        
        # Show affiliate_commission_rate to all authenticated users
        if not (request and hasattr(request, 'user') and request.user and request.user.is_authenticated):
            # Remove affiliate_commission_rate for unauthenticated users
            data.pop('affiliate_commission_rate', None)
        
        return data


class ProductWriteSerializer(serializers.ModelSerializer):
    """
    Write-only serializer for creating/updating products.
    Accepts FK IDs for brand, sub_category, shipping_category, shop,
    and lists of IDs for colors and sizes.
    """
    # Explicit declarations so DRF uses CharField (not ModelField) for
    # CKEditor5Field — ModelField does not accept allow_blank.
    description = serializers.CharField(required=False, allow_blank=True, default='')
    # Explicit slug to strip UniqueValidator on updates and allow blank.
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=50, validators=[])

    class Meta:
        model = Product
        fields = [
            'shop', 'brand', 'name', 'slug', 'description',
            'category', 'sub_category', 'shipping_category',
            'price', 'discount_price', 'wholesale_price',
            'minimum_purchase', 'affiliate_commission_rate',
            'origin', 'unit', 'wholesale_unit', 'badge', 'badge_color',
            'stock', 'is_active',
            'weight', 'length', 'width', 'height',
            'thumbnail', 'colors', 'sizes',
        ]
        extra_kwargs = {
            'shop':                    {'required': False},
            'brand':                   {'allow_null': True, 'required': False},
            'category':                {'allow_null': True, 'required': False},
            'sub_category':            {'allow_null': True, 'required': False},
            'shipping_category':       {'allow_null': True, 'required': False},
            'thumbnail':               {'allow_null': True, 'required': False},
            'discount_price':          {'allow_null': True, 'required': False},
            'wholesale_price':         {'allow_null': True, 'required': False},
            'minimum_purchase':        {'required': False},
            'affiliate_commission_rate': {'allow_null': True, 'required': False},
            'weight':                  {'allow_null': True, 'required': False},
            'length':                  {'allow_null': True, 'required': False},
            'width':                   {'allow_null': True, 'required': False},
            'height':                  {'allow_null': True, 'required': False},
            'colors':                  {'required': False},
            'sizes':                   {'required': False},
        }


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True, required=True)

    class Meta:
        model = __import__('products.models', fromlist=['Wishlist']).Wishlist
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'product', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data.pop('product_id')
        ProductModel = __import__('products.models', fromlist=['Product']).Product
        product = ProductModel.objects.get(id=product_id)
        wishlist, created = __import__('products.models', fromlist=['Wishlist']).Wishlist.objects.get_or_create(user=user, product=product)
        return wishlist

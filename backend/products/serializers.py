# products/serializers.py
from rest_framework import serializers
from django.db.models import Q
from .models import *
from shops.serializers import ShopSerializer
from orders.models import OrderItem
from stores.models import Store

class ProductStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'slug']

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
    total_products = serializers.SerializerMethodField()

    class Meta:
        model = SubCategory
        fields = ['id','name','slug','image','image_url','category', 'category_name', 'total_products']

    def get_total_products(self, obj):
        return getattr(obj, 'total_products', obj.products.count())

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

        # Only true admins (superuser or ADMIN user_type) can bypass purchase check
        # NOTE: STAFF users must go through the same review purchase check
        if user.is_superuser or getattr(user, 'user_type', '') == 'ADMIN':
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
    stores = ProductStoreSerializer(many=True, read_only=True)
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
            'id', 'shop', 'stores', 'brand', 'name', 'slug', 'description', 'category', 'sub_category', 'shipping_category',
            'price', 'discount_price', 'wholesale_price', 'minimum_purchase', 'tax_rate', 'stock', 'is_active',
            'weight', 'length', 'width', 'height',  # Added physical properties for shipping
            'thumbnail_url', 'specifications', 'additional_images',
            'origin', 'unit', 'wholesale_unit', 'badge', 'badge_color', 'variant',
            'colors', 'sizes', 'reviews', 'rating', 'review_count', 'user_can_review',
            'created_at', 'updated_at'
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
        # Only true admins (superuser or ADMIN user_type) can bypass purchase check
        # NOTE: STAFF users are NOT treated as admin
        if getattr(user, 'is_superuser', False) or getattr(user, 'user_type', '') == 'ADMIN':
            return {"can_review": True, "message": ""}
            
        if user.__class__.__name__ == 'WholesaleUser':
            has_purchased = OrderItem.objects.filter(
                order__customer_email=user.email,
                order__status='DELIVERED',
                product=obj
            ).exists()
            if not has_purchased:
                return {"can_review": False, "message": "You can only review products you have purchased and received."}
            return {"can_review": True, "message": ""}
        else:
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
            'wholesaler_status': None,
            'is_admin': False
        }
        
        # Check if user is authenticated and get wholesaler info
        if (request and hasattr(request, 'user') and request.user and request.user.is_authenticated):
            # Only superusers and ADMIN user_type are treated as admin
            # NOTE: STAFF users are NOT admin
            if request.user.is_superuser or getattr(request.user, 'user_type', '') == 'ADMIN':
                user_context['is_admin'] = True
            elif getattr(request.user, 'user_type', '') == 'WHOLESALER' or request.user.__class__.__name__ == 'WholesaleUser':
                user_context['is_wholesaler'] = True
                # Check wholesaler approval status
                try:
                    if hasattr(request.user, 'wholesaler_profile'):
                        profile = request.user.wholesaler_profile
                        user_context['wholesaler_status'] = profile.approval_status
                        if profile.approval_status == 'APPROVED':
                            user_context['is_approved_wholesaler'] = True
                    elif hasattr(request.user, 'is_approved'):
                        user_context['wholesaler_status'] = getattr(request.user, 'status', 'PENDING').upper()
                        if request.user.is_approved:
                            user_context['is_approved_wholesaler'] = True
                except:
                    # If wholesaler_profile doesn't exist, user is not approved
                    user_context['wholesaler_status'] = 'PENDING'
        
        # Add user context to response for frontend logic
        data['_user_context'] = user_context
        
        # Handle pricing data based on user type and approval status
        if user_context['is_admin']:
            # Admins see everything, do nothing
            pass
        elif user_context['is_approved_wholesaler']:
            # For approved wholesalers: only include wholesale_price if it exists and >= 1
            wholesale_price = instance.wholesale_price
            if not wholesale_price or wholesale_price < 1:
                # Remove wholesale pricing if not available
                data.pop('wholesale_price', None)
            # Always keep minimum_purchase for approved wholesalers
        else:
            # For non-approved wholesalers, customers, and unauthenticated users: 
            # Remove wholesale_price and minimum_purchase for security
            data.pop('wholesale_price', None)
            data.pop('minimum_purchase', None)
        
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
            'shop', 'stores', 'brand', 'name', 'slug', 'description',
            'category', 'sub_category', 'shipping_category',
            'price', 'discount_price', 'wholesale_price',
            'minimum_purchase', 'tax_rate',
            'origin', 'unit', 'wholesale_unit', 'badge', 'badge_color', 'variant',
            'stock', 'is_active',
            'weight', 'length', 'width', 'height',
            'thumbnail', 'colors', 'sizes',
        ]
        extra_kwargs = {
            'shop':                    {'required': False},
            'stores':                  {'required': False, 'allow_empty': True},
            'brand':                   {'allow_null': True, 'required': False},
            'category':                {'allow_null': True, 'required': False},
            'sub_category':            {'allow_null': True, 'required': False},
            'shipping_category':       {'allow_null': True, 'required': False},
            'thumbnail':               {'allow_null': True, 'required': False},
            'discount_price':          {'allow_null': True, 'required': False},
            'wholesale_price':         {'allow_null': True, 'required': False},
            'minimum_purchase':        {'required': False},
            'tax_rate':                {'required': False},
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

class OfferItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = __import__('products.models', fromlist=['OfferItem']).OfferItem
        fields = ['id', 'product', 'offer_price']

class OfferSerializer(serializers.ModelSerializer):
    banner_image_url = serializers.SerializerMethodField()
    items_data = serializers.CharField(write_only=True, required=False)
    items = serializers.SerializerMethodField()
    
    class Meta:
        model = Offer
        fields = ['id', 'title', 'slug', 'banner_image', 'banner_image_url', 'description', 'start_date', 'end_date', 'is_active', 'created_at', 'items_data', 'items']
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True}
        }

    def get_items(self, obj):
        """Return offer items with product info (for dashboard edit form)."""
        qs = obj.items.select_related(
            'product', 'product__category', 'product__brand', 'product__sub_category'
        ).prefetch_related('product__additional_images')
        return OfferItemSerializer(qs, many=True, context=self.context).data

    def get_banner_image_url(self, obj):
        request = self.context.get('request')
        if obj.banner_image and hasattr(obj.banner_image, 'url'):
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None

    def create(self, validated_data):
        items_json = validated_data.pop('items_data', None)
        offer = super().create(validated_data)
        self._handle_items(offer, items_json)
        return offer

    def update(self, instance, validated_data):
        items_json = validated_data.pop('items_data', None)
        offer = super().update(instance, validated_data)
        if items_json is not None:
            self._handle_items(offer, items_json)
        return offer

    def _handle_items(self, offer, items_json):
        if items_json:
            import json
            try:
                items = json.loads(items_json)
                offer.items.all().delete()
                OfferItem = __import__('products.models', fromlist=['OfferItem']).OfferItem
                Product = __import__('products.models', fromlist=['Product']).Product
                
                offer_items = []
                for item in items:
                    product_id = item.get('product_id') or item.get('id')
                    offer_price = item.get('offer_price')
                    if product_id and offer_price:
                        product = Product.objects.get(pk=product_id)
                        offer_items.append(OfferItem(offer=offer, product=product, offer_price=offer_price))
                OfferItem.objects.bulk_create(offer_items)
            except Exception as e:
                pass

class OfferDetailSerializer(OfferSerializer):
    items = OfferItemSerializer(many=True, read_only=True)

    class Meta(OfferSerializer.Meta):
        fields = OfferSerializer.Meta.fields + ['items']

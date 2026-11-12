# products/views.py
import logging
from django.db import transaction
from rest_framework import viewsets, permissions
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from rest_framework.views import APIView
from orders.models import Order
from .models import Product, ProductDetailSettings, Category, SubCategory, Color, Brand, Size, DisplayUnit, ProductSpecification, ProductAdditionalImage, Review, Offer, ProductStoreStock
from django.db.models import Count, ProtectedError, Prefetch, Q, Sum, Value
from django.db.models.functions import Coalesce
from .serializers import (
    ProductSerializer, ProductWriteSerializer, ProductDetailSettingsSerializer,
    CategorySerializer, SubCategorySerializer,
    ColorSerializer, BrandSerializer, SizeSerializer, DisplayUnitSerializer,
    ReviewSerializer, ReviewCreateSerializer,
    OfferSerializer, OfferDetailSerializer
)
from .permissions import IsShopOwnerOrReadOnly
from .filters import ProductFilter
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import WishlistSerializer
from .models import Wishlist

# Set up logging
logger = logging.getLogger(__name__)


def _create_notification(notification_type, title, message='', actor=None):
    """Create a notification for admin dashboard."""
    try:
        from users.models import Notification
        Notification.objects.create(
            type=notification_type,
            title=title,
            message=message,
            actor=actor,
        )
    except Exception as exc:
        logger.warning(f"Failed to create notification: {exc}")

class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read access to anyone, write access only to admin users.
    NOTE: STAFF users (user_type='STAFF') are NOT granted admin write access here."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and
            request.user.is_authenticated and
            (
                request.user.is_superuser or
                (getattr(request.user, 'user_type', '') == 'ADMIN' and getattr(request.user, 'user_type', '') != 'STAFF')
            )
        )

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ProductFilter
    lookup_field = 'slug'
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return ProductWriteSerializer
        return ProductSerializer

    def get_queryset(self):
        """Admin users see all products, public sees only active."""
        qs = Product.objects.select_related(
            'shop', 'brand', 'category', 'sub_category', 'sub_category__category', 'shipping_category'
        ).prefetch_related(
            'colors', 'sizes', 'reviews__user', 'specifications',
            'additional_images', 'shipping_category__allowed_shipping_methods',
            'shipping_category__allowed_shipping_methods__shipping_tiers'
        ).annotate(
            total_ordered=Coalesce(
                Sum('orderitem__quantity', filter=~Q(orderitem__order__status='CANCELLED')),
                Value(0),
            )
        ).order_by('-created_at')
        
        store_id = self.request.query_params.get('store')
        if store_id:
            qs = qs.filter(stores__id=store_id)
            
        store_slug = self.request.query_params.get('store_slug')
        if store_slug:
            qs = qs.filter(stores__slug=store_slug)
        
        if self.request.user and self.request.user.is_authenticated:
            if getattr(self.request.user, 'user_type', '') == 'ADMIN' or self.request.user.is_superuser:
                return qs
            if getattr(self.request.user, 'user_type', '') == 'STAFF':
                return qs
                
        return qs.filter(is_active=True)

    def get_permissions(self):
        """
        Override to apply different permissions based on the action.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Write operations require authentication (or custom IsShopOwnerOrReadOnly)
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Read operations are public
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """
        Override list method to add proper error handling and logging.
        """
        try:
            logger.info(f"ProductViewSet.list called with params: {request.query_params}")
            
            # Get the queryset
            queryset = self.filter_queryset(self.get_queryset())
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                logger.info(f"Successfully paginated {len(page)} products")
                return self.get_paginated_response(serializer.data)
            
            # If no pagination
            serializer = self.get_serializer(queryset, many=True)
            logger.info(f"Successfully returned {len(queryset)} products")
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in ProductViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve method to add proper error handling and logging.
        """
        try:
            logger.info(f"ProductViewSet.retrieve called with slug: {kwargs.get('slug')}")
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            logger.info(f"Successfully retrieved product: {instance.name}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in ProductViewSet.retrieve: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            "request": self.request,
            "include_detail_defaults": getattr(self, "action", None) == "retrieve",
        })
        return context

    def _get_user_type(self, user):
        """Return normalised (uppercase) user_type string."""
        return str(getattr(user, 'user_type', '') or '').upper()

    def _is_admin(self, user):
        """Return True for superusers or ADMIN user_type (case-insensitive).
        STAFF users are NEVER treated as admin."""
        user_type = self._get_user_type(user)
        return bool(getattr(user, 'is_superuser', False) or user_type == 'ADMIN')

    def _is_staff_user(self, user):
        """Return True ONLY for users whose user_type is STAFF."""
        return self._get_user_type(user) == 'STAFF'

    def perform_create(self, serializer):
        user = self.request.user

        # ── ADMIN: always allowed, skip all staff checks ──────────────────
        if self._is_admin(user):
            serializer.save(created_by=user, updated_by=user)
            return

        # ── STAFF: check StaffProfile permission ──────────────────────────
        # This block runs EXCLUSIVELY for users with user_type == 'STAFF'.
        # Admins, vendors, sellers, customers will never reach this block.
        if self._is_staff_user(user):
            from rest_framework.exceptions import PermissionDenied
            profile = getattr(user, 'staff_profile', None)
            if profile is None or not profile.can_create_products:
                raise PermissionDenied("You do not have permission to create products.")
            # Staff with permission — they don't own a shop, so just save without shop
            serializer.save(created_by=user, updated_by=user)
            return

        # ── VENDOR / SELLER: must have a shop ─────────────────────────────
        if user.shops.exists():
            serializer.save(shop=user.shops.first(), created_by=user, updated_by=user)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You do not have a shop to add products to.")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        variants_json = request.data.get('variants_json')
        variants_list = []
        if variants_json:
            import json
            try:
                variants_list = json.loads(variants_json) if isinstance(variants_json, str) else variants_json
            except Exception as exc:
                logger.warning(f"Could not parse variants_json: {exc}")
                variants_list = []

        # If multiple variants are submitted in one go
        if variants_list and len(variants_list) > 0:
            created_products = []
            thumbnail_file = request.FILES.get('thumbnail')
            promo_card_image_file = request.FILES.get('promo_card_image')
            farm_story_image_file = request.FILES.get('farm_story_image')
            additional_image_files = request.FILES.getlist('additional_images')
            specs_json = request.data.get('specifications_json')

            for idx, v_data in enumerate(variants_list):
                item_data = request.data.copy()
                if 'variants_json' in item_data:
                    del item_data['variants_json']
                if idx > 0:
                    for file_key in ('thumbnail', 'promo_card_image', 'farm_story_image'):
                        if file_key in item_data:
                            del item_data[file_key]

                v_name = (v_data.get('variant') or v_data.get('name') or '').strip()
                item_data['variant'] = v_name

                if 'price' in v_data and v_data['price'] != '':
                    item_data['price'] = v_data['price']
                if 'discount_price' in v_data:
                    item_data['discount_price'] = v_data['discount_price'] or None
                if 'wholesale_price' in v_data:
                    item_data['wholesale_price'] = v_data['wholesale_price'] or None
                if 'wholesale_discount_price' in v_data:
                    item_data['wholesale_discount_price'] = v_data['wholesale_discount_price'] or None
                if 'restaurant_price' in v_data:
                    item_data['restaurant_price'] = v_data['restaurant_price'] or None
                if 'restaurant_discount_price' in v_data:
                    item_data['restaurant_discount_price'] = v_data['restaurant_discount_price'] or None
                if 'unit' in v_data and v_data['unit']:
                    item_data['unit'] = v_data['unit']
                if 'wholesale_unit' in v_data and v_data['wholesale_unit']:
                    item_data['wholesale_unit'] = v_data['wholesale_unit']
                if 'restaurant_unit' in v_data and v_data['restaurant_unit']:
                    item_data['restaurant_unit'] = v_data['restaurant_unit']
                if 'stock' in v_data:
                    item_data['stock'] = 0 if v_data.get('is_unlimited_stock') else (v_data.get('stock') or 0)
                if 'wholesale_stock' in v_data:
                    item_data['wholesale_stock'] = 0 if v_data.get('is_unlimited_wholesale_stock') else (v_data.get('wholesale_stock') or 0)
                if 'restaurant_stock' in v_data:
                    item_data['restaurant_stock'] = 0 if v_data.get('is_unlimited_restaurant_stock') else (v_data.get('restaurant_stock') or 0)
                if 'is_unlimited_stock' in v_data:
                    item_data['is_unlimited_stock'] = bool(v_data['is_unlimited_stock'])
                if 'is_unlimited_wholesale_stock' in v_data:
                    item_data['is_unlimited_wholesale_stock'] = bool(v_data['is_unlimited_wholesale_stock'])
                if 'is_unlimited_restaurant_stock' in v_data:
                    item_data['is_unlimited_restaurant_stock'] = bool(v_data['is_unlimited_restaurant_stock'])
                if 'minimum_purchase' in v_data and v_data['minimum_purchase']:
                    item_data['minimum_purchase'] = v_data['minimum_purchase']
                if 'restaurant_minimum_purchase' in v_data and v_data['restaurant_minimum_purchase']:
                    item_data['restaurant_minimum_purchase'] = v_data['restaurant_minimum_purchase']

                # Unique slug for each variant
                from django.utils.text import slugify
                base_name = item_data.get('name', 'product')
                base_slug = slugify(f"{base_name} {v_name}".strip())
                unique_slug = base_slug
                cnt = 1
                while Product.objects.filter(slug=unique_slug).exists():
                    unique_slug = f"{base_slug}-{cnt}"
                    cnt += 1
                item_data['slug'] = unique_slug

                serializer = self.get_serializer(data=item_data)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                p = serializer.instance

                # Thumbnail / highlight card / farm story image assignment (reusing file uploaded on first)
                updated_img_fields = []
                if thumbnail_file:
                    if idx == 0:
                        p.thumbnail = thumbnail_file
                        updated_img_fields.append('thumbnail')
                    elif created_products and created_products[0].thumbnail:
                        p.thumbnail = created_products[0].thumbnail.name
                        updated_img_fields.append('thumbnail')
                if promo_card_image_file:
                    if idx == 0:
                        p.promo_card_image = promo_card_image_file
                        updated_img_fields.append('promo_card_image')
                    elif created_products and created_products[0].promo_card_image:
                        p.promo_card_image = created_products[0].promo_card_image.name
                        updated_img_fields.append('promo_card_image')
                if farm_story_image_file:
                    if idx == 0:
                        p.farm_story_image = farm_story_image_file
                        updated_img_fields.append('farm_story_image')
                    elif created_products and created_products[0].farm_story_image:
                        p.farm_story_image = created_products[0].farm_story_image.name
                        updated_img_fields.append('farm_story_image')
                if updated_img_fields:
                    p.save(update_fields=updated_img_fields)

                # Auto-assign product to staff's store
                if getattr(request.user, 'user_type', '') == 'STAFF':
                    profile = getattr(request.user, 'staff_profile', None)
                    if profile and profile.store:
                        p.stores.add(profile.store)

                # Specifications
                if specs_json:
                    import json
                    try:
                        for s in json.loads(specs_json):
                            if s.get('name') and s.get('value'):
                                ProductSpecification.objects.create(product=p, name=s['name'], value=s['value'])
                    except Exception:
                        pass

                # Additional images
                if idx == 0:
                    for img in additional_image_files:
                        ProductAdditionalImage.objects.create(product=p, image=img)
                elif created_products:
                    for img_obj in created_products[0].additional_images.all():
                        ProductAdditionalImage.objects.create(product=p, image=img_obj.image.name)

                # Store stocks
                stock_value = p.stock
                for store in p.stores.all():
                    ProductStoreStock.objects.get_or_create(
                        product=p, store=store,
                        defaults={'stock': stock_value}
                    )

                created_products.append(p)

            # Notify admin when vendor/seller creates a product
            if request.user.user_type in ('VENDOR', 'SELLER'):
                _create_notification(
                    'PRODUCT_CREATED',
                    f'{request.user.name or request.user.email} added "{created_products[0].name}" ({len(created_products)} variants)',
                    f'New product with {len(created_products)} variants added.',
                    actor=request.user,
                )

            read_serializer = ProductSerializer(created_products[0], context=self.get_serializer_context())
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        # Standard single product creation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        product = serializer.instance
        
        # Auto-assign product to staff's store
        if getattr(request.user, 'user_type', '') == 'STAFF':
            profile = getattr(request.user, 'staff_profile', None)
            if profile and profile.store:
                product.stores.add(profile.store)
                
        # Handle specification JSON (sent as JSON string in FormData)
        specs_json = request.data.get('specifications_json')
        if specs_json:
            import json
            try:
                for s in json.loads(specs_json):
                    if s.get('name') and s.get('value'):
                        ProductSpecification.objects.create(product=product, name=s['name'], value=s['value'])
            except Exception as exc:
                logger.warning(f"Could not parse specifications_json: {exc}")
        # Handle additional image uploads
        for img in request.FILES.getlist('additional_images'):
            ProductAdditionalImage.objects.create(product=product, image=img)
        read_serializer = ProductSerializer(product, context=self.get_serializer_context())
        # Notify admin when vendor/seller creates a product
        if request.user.user_type in ('VENDOR', 'SELLER'):
            _create_notification(
                'PRODUCT_CREATED',
                f'{request.user.name or request.user.email} added "{product.name}"',
                f'New product added to shop "{product.shop.name if product.shop else "N/A"}".',
                actor=request.user,
            )

        # Handle store stocks
        stock_value = product.stock
        if 'stock' in request.data:
            try:
                stock_value = int(request.data['stock'])
            except ValueError:
                pass
        for store in product.stores.all():
            ProductStoreStock.objects.get_or_create(
                product=product, store=store,
                defaults={'stock': stock_value}
            )

        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = self.request.user
        user_type = self._get_user_type(user)
        logger.info(
            f"[PRODUCT UPDATE] user={getattr(user, 'email', '?')} user_type={user_type} "
            f"is_superuser={getattr(user, 'is_superuser', False)} "
            f"is_admin={self._is_admin(user)} is_staff={self._is_staff_user(user)}"
        )

        # ── ABSOLUTE ADMIN SAFEGUARD ───────────────────────────────────────
        # Admins and superusers ALWAYS skip all permission checks below.
        # This guard runs before ANY staff check.
        if self._is_admin(user):
            pass  # fall through to the actual update logic below

        # ── STAFF ONLY: check StaffProfile permission ─────────────────────
        # This block runs EXCLUSIVELY for STAFF users.
        # Admins (user_type='ADMIN' or is_superuser=True) will NEVER enter here.
        elif self._is_staff_user(user):
            from rest_framework.exceptions import PermissionDenied
            profile = getattr(user, 'staff_profile', None)
            if profile is None or not profile.can_update_products:
                logger.warning(
                    f"[PRODUCT UPDATE BLOCKED] STAFF user={getattr(user, 'email', '?')} "
                    f"can_update_products={getattr(profile, 'can_update_products', None)}"
                )
                raise PermissionDenied("You do not have permission to update products.")
        else:
            # Neither ADMIN nor STAFF — VENDOR/SELLER/CUSTOMER etc.
            logger.info(
                f"[PRODUCT UPDATE] Non-admin, non-staff user={getattr(user, 'email', '?')} user_type={user_type}"
            )

        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Track explicit image clears ('', 'null', 'None', None) without failing DRF ImageField file validation
        raw_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        cleared_image_fields = []
        for img_field in ('thumbnail', 'promo_card_image', 'farm_story_image'):
            if img_field in raw_data and img_field not in request.FILES:
                val = raw_data.get(img_field)
                if val in (None, '', 'null', 'None'):
                    cleared_image_fields.append(img_field)
                    raw_data.pop(img_field, None)

        serializer = self.get_serializer(instance, data=raw_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=user)

        product = serializer.instance

        # Handle specification JSON (sent as JSON string in FormData)
        specs_json = request.data.get('specifications_json')
        if specs_json:
            import json
            try:
                specs_list = json.loads(specs_json)
                # Replace all specs: clear old, add new
                product.specifications.all().delete()
                for s in specs_list:
                    if s.get('name') and s.get('value'):
                        ProductSpecification.objects.create(
                            product=product, name=s['name'], value=s['value']
                        )
            except Exception as exc:
                logger.warning(f"Could not parse specifications_json: {exc}")
        elif 'specifications' in request.data and isinstance(request.data.get('specifications'), list):
            product.specifications.all().delete()
            for s in request.data['specifications']:
                if s.get('name') and s.get('value'):
                    ProductSpecification.objects.create(
                        product=product, name=s['name'], value=s['value']
                    )

        # Handle removal of specific additional images
        remove_image_ids = request.data.getlist('remove_image_ids') if hasattr(request.data, 'getlist') else request.data.get('remove_image_ids', [])
        if remove_image_ids:
            if isinstance(remove_image_ids, str):
                import json as _json
                try:
                    remove_image_ids = _json.loads(remove_image_ids)
                except Exception:
                    remove_image_ids = [remove_image_ids]
            ProductAdditionalImage.objects.filter(product=product, id__in=remove_image_ids).delete()

        # Handle new additional image uploads
        new_images = request.FILES.getlist('additional_images') if hasattr(request.FILES, 'getlist') else []
        for img in new_images:
            ProductAdditionalImage.objects.create(product=product, image=img)

        # Handle explicit image removal
        if cleared_image_fields:
            for img_field in cleared_image_fields:
                setattr(product, img_field, None)
            product.save(update_fields=cleared_image_fields)

        # Return the full read serializer
        product.refresh_from_db()
        read_serializer = ProductSerializer(product, context=self.get_serializer_context())
        # Notify admin when vendor/seller updates a product
        if request.user.user_type in ('VENDOR', 'SELLER'):
            _create_notification(
                'PRODUCT_UPDATED',
                f'{request.user.name or request.user.email} updated "{product.name}"',
                f'Product in shop "{product.shop.name if product.shop else "N/A"}" was modified.',
                actor=request.user,
            )
        return Response(read_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = self.request.user

        # ── STAFF ONLY: check StaffProfile permission ─────────────────────
        # Admins (user_type='ADMIN' or is_superuser=True) will NEVER enter here.
        if self._is_staff_user(user):
            from rest_framework.exceptions import PermissionDenied
            profile = getattr(user, 'staff_profile', None)
            if profile is None or not profile.can_delete_products:
                raise PermissionDenied("You do not have permission to delete products.")


        instance = self.get_object()
        product_name = instance.name
        shop_name = instance.shop.name if instance.shop else 'N/A'
        # Notify admin when vendor/seller deletes a product
        if request.user.user_type in ('VENDOR', 'SELLER'):
            _create_notification(
                'PRODUCT_DELETED',
                f'{request.user.name or request.user.email} deleted "{product_name}"',
                f'Product was removed from shop "{shop_name}".',
                actor=request.user,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CategoryViewSet(viewsets.ModelViewSet):
    # Annotate with subcategory count for richer frontend data
    # Prefetch subcategories to avoid N+1 queries
    queryset = Category.objects.prefetch_related('subcategories').annotate(
        sub_category_count=Count('subcategories', distinct=True)
    ).order_by('name')
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'slug']

    def list(self, request, *args, **kwargs):
        """Override list method to add proper error handling and logging."""
        try:
            logger.info(f"CategoryViewSet.list called with params: {request.query_params}")
            response = super().list(request, *args, **kwargs)
            logger.info(f"Successfully returned {len(response.data)} categories")
            return response
        except Exception as e:
            logger.error(f"Error in CategoryViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method to add proper error handling and logging."""
        try:
            logger.info(f"CategoryViewSet.retrieve called with slug: {kwargs.get('slug')}")
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Successfully retrieved category")
            return response
        except Exception as e:
            logger.error(f"Error in CategoryViewSet.retrieve: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # 1. Unlink any products or leftover packs that reference this category purely for shipping
        Product.objects.filter(shipping_category=instance).update(shipping_category=None)
        try:
            from stores.models import LeftoverPack
            LeftoverPack.objects.filter(shipping_category=instance).update(shipping_category=None)
        except Exception:
            pass

        # 2. Check if this category has actual catalog products (directly or through subcategories)
        associated_products = Product.objects.filter(
            Q(category=instance) | Q(sub_category__category=instance)
        ).distinct()
        product_count = associated_products.count()

        if product_count > 0:
            sample_names = ", ".join(associated_products.values_list('name', flat=True)[:3])
            more_text = f" and {product_count - 3} more" if product_count > 3 else ""
            return Response(
                {
                    'detail': f'Cannot delete category "{instance.name}" because it contains {product_count} product(s) ({sample_names}{more_text}). Remove or reassign those products first.'
                },
                status=status.HTTP_409_CONFLICT
            )

        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            protected_items = [f"{getattr(obj, 'name', str(obj))}" for obj in list(e.protected_objects)[:3]]
            items_str = ", ".join(protected_items)
            return Response(
                {
                    'detail': f'Cannot delete category "{instance.name}" because it is referenced by: {items_str}.'
                },
                status=status.HTTP_409_CONFLICT
            )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            "request": self.request,
            "include_detail_defaults": getattr(self, "action", None) == "retrieve",
        })
        return context

class SubCategoryViewSet(viewsets.ModelViewSet):
    # Optimize with select_related to avoid N+1 queries
    queryset = SubCategory.objects.select_related('category').order_by('category__name', 'name')
    serializer_class = SubCategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'slug', 'category__name']

    def get_queryset(self):
        """
        Filter subcategories based on category if provided
        """
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        
        if category:
            # Filter subcategories that belong to the specified category
            queryset = queryset.filter(category__slug=category)
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Override list method to add proper error handling and logging."""
        try:
            logger.info(f"SubCategoryViewSet.list called with params: {request.query_params}")
            response = super().list(request, *args, **kwargs)
            logger.info(f"Successfully returned {len(response.data)} subcategories")
            return response
        except Exception as e:
            logger.error(f"Error in SubCategoryViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method to add proper error handling and logging."""
        try:
            logger.info(f"SubCategoryViewSet.retrieve called with slug: {kwargs.get('slug')}")
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Successfully retrieved subcategory")
            return response
        except Exception as e:
            logger.error(f"Error in SubCategoryViewSet.retrieve: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        associated_products = Product.objects.filter(sub_category=instance).distinct()
        product_count = associated_products.count()
        if product_count > 0:
            sample_names = ", ".join(associated_products.values_list('name', flat=True)[:3])
            more_text = f" and {product_count - 3} more" if product_count > 3 else ""
            return Response(
                {
                    'detail': f'Cannot delete subcategory "{instance.name}" because it contains {product_count} product(s) ({sample_names}{more_text}). Remove or reassign those products first.'
                },
                status=status.HTTP_409_CONFLICT
            )

        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            protected_items = [f"{getattr(obj, 'name', str(obj))}" for obj in list(e.protected_objects)[:3]]
            return Response(
                {
                    'detail': f'Cannot delete subcategory "{instance.name}" because it is referenced by: {", ".join(protected_items)}.'
                },
                status=status.HTTP_409_CONFLICT
            )

class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all().order_by('name')
    serializer_class = ColorSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'hex_code']

    def get_queryset(self):
        """
        Filter colors based on category if provided
        """
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        
        if category:
            # Filter colors that have products in the specified category
            queryset = queryset.filter(
                products__sub_category__category__slug=category
            ).distinct()
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Override list method to add proper error handling and logging."""
        try:
            logger.info(f"ColorViewSet.list called with params: {request.query_params}")
            response = super().list(request, *args, **kwargs)
            logger.info(f"Successfully returned {len(response.data)} colors")
            return response
        except Exception as e:
            logger.error(f"Error in ColorViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('product')

    def perform_create(self, serializer):
        serializer.save()


class WishlistItemDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Wishlist.objects.all()

    def get_object(self):
        product_id = self.kwargs.get('product_id')
        from django.shortcuts import get_object_or_404
        obj = get_object_or_404(Wishlist, user=self.request.user, product_id=product_id)
        return obj


from rest_framework.views import APIView

class WishlistClearView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        Wishlist.objects.filter(user=request.user).delete()
        return Response({'detail': 'Wishlist cleared'}, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method to add proper error handling and logging."""
        try:
            logger.info(f"ColorViewSet.retrieve called with id: {kwargs.get('pk')}")
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Successfully retrieved color")
            return response
        except Exception as e:
            logger.error(f"Error in ColorViewSet.retrieve: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SizeViewSet(viewsets.ModelViewSet):
    queryset = Size.objects.all().order_by('name')
    serializer_class = SizeSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name']

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            return response
        except Exception as e:
            logger.error(f"Error in SizeViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'Cannot delete this size because it is used by one or more products.'},
                status=status.HTTP_409_CONFLICT
            )

class DisplayUnitViewSet(viewsets.ModelViewSet):
    queryset = DisplayUnit.objects.all().order_by('name')
    serializer_class = DisplayUnitSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'abbreviation']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'Cannot delete this display unit because it is used by one or more products.'},
                status=status.HTTP_409_CONFLICT
            )

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'slug']

    def get_queryset(self):
        """Filter brands by active status for non-admins, and optionally by category."""
        qs = super().get_queryset()
        # Hide inactive brands from non-admin users
        # NOTE: STAFF users are NOT treated as admin here
        if not (self.request.user and self.request.user.is_authenticated and
                (self.request.user.is_superuser or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            qs = qs.filter(is_active=True)
        # Optional category filter
        category = self.request.query_params.get('category', None)
        if category:
            qs = qs.filter(
                products__sub_category__category__slug=category
            ).distinct()
        return qs

    def list(self, request, *args, **kwargs):
        """Override list method to add proper error handling and logging."""
        try:
            logger.info(f"BrandViewSet.list called with params: {request.query_params}")
            response = super().list(request, *args, **kwargs)
            logger.info(f"Successfully returned {len(response.data)} brands")
            return response
        except Exception as e:
            logger.error(f"Error in BrandViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method to add proper error handling and logging."""
        try:
            logger.info(f"BrandViewSet.retrieve called with id: {kwargs.get('pk')}")
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Successfully retrieved brand")
            return response
        except Exception as e:
            logger.error(f"Error in BrandViewSet.retrieve: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'Cannot delete this brand because it is used by one or more products. Remove or reassign those products first.'},
                status=status.HTTP_409_CONFLICT
            )
            logger.info(f"Successfully returned {len(response.data)} sizes")
            return response
        except Exception as e:
            logger.error(f"Error in SizeViewSet.list: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method to add proper error handling and logging."""
        try:
            logger.info(f"SizeViewSet.retrieve called with id: {kwargs.get('pk')}")
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Successfully retrieved size")
            return response
        except Exception as e:
            logger.error(f"Error in SizeViewSet.retrieve: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Internal server error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReviewCreateSerializer
        return ReviewSerializer
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OfferViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows offers to be viewed or edited.
    """
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Offer.objects.prefetch_related(
            'items',
            'items__product',
            'items__product__category',
            'items__product__brand',
            'items__product__sub_category',
            'items__product__sub_category__category',
            'items__product__additional_images',
        ).order_by('-created_at')
        if self.request.user and self.request.user.is_authenticated and (self.request.user.is_superuser or getattr(self.request.user, 'user_type', '') == 'ADMIN'):
            return qs
        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OfferDetailSerializer
        return OfferSerializer


class ProductDetailSettingsView(APIView):
    """Singleton GET/PATCH endpoint for global Product Detail page defaults."""

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def _is_admin(self, user):
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, 'is_superuser', False) or getattr(user, 'user_type', '').upper() == 'ADMIN')
        )

    def get(self, request):
        obj = ProductDetailSettings.get_solo()
        serializer = ProductDetailSettingsSerializer(obj, context={'request': request})
        return Response(serializer.data)

    def _update(self, request, partial=True):
        if not self._is_admin(request.user):
            return Response(
                {'detail': 'Only administrators can update default product page sections.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        obj = ProductDetailSettings.get_solo()
        raw_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        cleared_image_fields = []
        for img_field in ('promo_card_image', 'farm_story_image'):
            if img_field in raw_data and img_field not in request.FILES:
                val = raw_data.get(img_field)
                if val in (None, '', 'null', 'None'):
                    cleared_image_fields.append(img_field)
                    raw_data.pop(img_field, None)

        serializer = ProductDetailSettingsSerializer(
            obj, data=raw_data, partial=partial, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        updated_obj = serializer.save()

        if cleared_image_fields:
            for img_field in cleared_image_fields:
                setattr(updated_obj, img_field, None)
            updated_obj.save(update_fields=cleared_image_fields)
            updated_obj.refresh_from_db()

        return Response(
            ProductDetailSettingsSerializer(updated_obj, context={'request': request}).data
        )

    def patch(self, request):
        return self._update(request, partial=True)

    def put(self, request):
        return self._update(request, partial=False)



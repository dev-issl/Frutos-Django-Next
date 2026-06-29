# products/views.py
import logging
from rest_framework import viewsets, permissions
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from orders.models import Order
from .models import Product, Category, SubCategory, Color, Brand, Size, ProductSpecification, ProductAdditionalImage, Review, Offer
from django.db.models import Count, ProtectedError, Prefetch
from .serializers import (
    ProductSerializer, ProductWriteSerializer,
    CategorySerializer, SubCategorySerializer,
    ColorSerializer, BrandSerializer, SizeSerializer,
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
        ).order_by('-created_at')
        
        if self.request.user and self.request.user.is_authenticated:
            if getattr(self.request.user, 'user_type', '') == 'ADMIN' or self.request.user.is_superuser:
                return qs
            if getattr(self.request.user, 'user_type', '') == 'STAFF':
                profile = getattr(self.request.user, 'staff_profile', None)
                if profile and profile.store:
                    return qs.filter(stores=profile.store)
                return qs.none()
                
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
        context.update({"request": self.request})
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
            if 'shop' not in serializer.validated_data:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"shop": "Please select a shop for this product."})
            serializer.save()
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
            serializer.save()
            return

        # ── VENDOR / SELLER: must have a shop ─────────────────────────────
        if user.shops.exists():
            serializer.save(shop=user.shops.first())
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You do not have a shop to add products to.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        product = serializer.instance
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
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

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

        # Handle thumbnail removal (explicit null)
        if 'thumbnail' in request.data and request.data['thumbnail'] in (None, '', 'null', 'None'):
            product.thumbnail = None
            product.save(update_fields=['thumbnail'])

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
    # Annotate with product & subcategory counts for richer frontend data
    # Prefetch subcategories to avoid N+1 queries
    queryset = Category.objects.prefetch_related(
        Prefetch('subcategories', queryset=SubCategory.objects.annotate(total_products=Count('products', distinct=True)))
    ).annotate(
        total_products=Count('subcategories__products', distinct=True),
        sub_category_count=Count('subcategories', distinct=True)
    ).order_by('name')
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]
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
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': 'Cannot delete this category because it has products. Remove or reassign those products first.'},
                status=status.HTTP_409_CONFLICT
            )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class SubCategoryViewSet(viewsets.ModelViewSet):
    # Optimize with select_related to avoid N+1 queries
    queryset = SubCategory.objects.select_related('category').order_by('category__name', 'name')
    serializer_class = SubCategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]
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

class ColorViewSet(viewsets.ModelViewSet):
    queryset = Color.objects.all().order_by('name')
    serializer_class = ColorSerializer
    permission_classes = [IsAdminOrReadOnly]
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

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'
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
            'items__product__additional_images',
        ).order_by('-created_at')
        if self.request.user and self.request.user.is_authenticated and (self.request.user.is_superuser or getattr(self.request.user, 'user_type', '') == 'ADMIN'):
            return qs
        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OfferDetailSerializer
        return OfferSerializer


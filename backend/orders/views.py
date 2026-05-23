# orders/views.py
import logging
import traceback
from decimal import Decimal
from rest_framework import viewsets, permissions, status, generics, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.template.loader import render_to_string
from django.http import HttpResponse
from products.models import Product, ShippingCategory
from .models import (
    Order, ShippingMethod, OrderPayment, Coupon, OrderItem, OrderUpdate,
    FreeShippingRule, ShippingTier
)
from .serializers import (
    OrderSerializer, ShippingMethodSerializer, OrderPaymentSerializer,
    OrderCreateSerializer, OrderReadSerializer, CouponSerializer, CouponValidationSerializer,
    ShippingCategorySerializer, FreeShippingRuleSerializer, FreeShippingRuleWriteSerializer,
    ShippingTierSerializer,
    ShippingTierWriteSerializer, ShippingMethodWriteSerializer, ShippingCategoryWriteSerializer,
)
from users.permissions import IsCustomerForOrder, ReadOnlyOrIsAdmin

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def analyze_cart_shipping(request):
    """
    Advanced cart and shipping analysis API
    Analyzes cart items to determine:
    - Available shipping methods based on product shipping categories
    - Free shipping eligibility
    - Shipping costs with quantity-based pricing
    - Whether split shipping is required
    
    POST /api/analyze-cart-shipping/
    Body: {
        "cart_items": [
            {"product_id": "uuid", "quantity": 2},
            ...
        ]
    }
    """
    try:
        cart_items = request.data.get('cart_items', [])
        if not cart_items:
            return Response({
                'error': 'cart_items is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract and validate product IDs from cart items
        product_ids = []
        invalid_items = []
        
        for item in cart_items:
            # Support multiple productId field names for compatibility
            product_id = item.get('product_id') or item.get('productId') or item.get('id') or item.get('uuid')
            
            if not product_id:
                invalid_items.append(item)
                continue
            
            # Convert to string and validate UUID format
            product_id_str = str(product_id)
            
            # Check if it looks like a valid UUID (basic validation)
            try:
                import uuid
                # Try to parse as UUID to validate format
                uuid.UUID(product_id_str)
                product_ids.append(product_id_str)
            except (ValueError, TypeError):
                # Invalid UUID format
                invalid_items.append({
                    **item,
                    'error': f'Invalid product ID format: {product_id}. Expected UUID format.',
                    'received_type': 'invalid'
                })
                continue
        
        # Return error if no valid products found
        if not product_ids:
            return Response({
                'error': 'No valid product IDs found in cart items',
                'invalid_items': invalid_items,
                'help': 'Product IDs must be in valid UUID format (e.g., 12345678-1234-5678-9abc-123456789def)'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # If some items are invalid but some are valid, log the invalid ones but continue
        if invalid_items:
            logger.warning(f"Some cart items have invalid product IDs: {invalid_items}")
        
        # Fetch products with their shipping categories (optimized for N+1 queries)
        products = Product.objects.select_related(
            'shipping_category',
            'shop',
            'brand',
            'sub_category',
            'sub_category__category'
        ).prefetch_related(
            'shipping_category__allowed_shipping_methods',
            'shipping_category__allowed_shipping_methods__shipping_tiers'
        ).filter(id__in=product_ids)
        
        # Create product lookup for easy access
        product_lookup = {str(p.id): p for p in products}
        
        # Calculate cart totals
        cart_subtotal = Decimal('0')
        total_quantity = 0
        total_weight = Decimal('0')  # Calculate actual total weight from products
        
        # Collect shipping categories
        shipping_categories = set()
        cart_analysis = []
        
        missing_products = []
        for item in cart_items:
            # Extract product_id using the same logic as above
            product_id = str(item.get('product_id') or item.get('productId') or item.get('id') or item.get('uuid'))
            quantity = item.get('quantity', 1)

            if product_id not in product_lookup:
                # Collect missing instead of aborting entire analysis
                missing_products.append(product_id)
                continue

            product = product_lookup[product_id]
            item_total = product.price * quantity
            cart_subtotal += item_total
            total_quantity += quantity
            
            # Calculate weight for this item
            item_weight = Decimal('0')
            if product.weight:
                item_weight = product.weight * quantity
                total_weight += item_weight

            # Collect shipping category
            if product.shipping_category:
                shipping_categories.add(product.shipping_category.id)

            cart_analysis.append({
                'product_id': product_id,
                'product_name': product.name,
                'quantity': quantity,
                'unit_price': str(product.price),
                'item_total': str(item_total),
                'unit_weight': str(product.weight) if product.weight else '0.00',
                'item_weight': str(item_weight),
                'shipping_category': product.shipping_category.name if product.shipping_category else None,
                'shipping_category_id': product.shipping_category.id if product.shipping_category else None,
            })
        
        # Determine available shipping methods
        available_methods = []
        requires_split_shipping = False
        
        if not shipping_categories:
            # No specific shipping categories - use all active methods
            available_methods = ShippingMethod.objects.filter(is_active=True)
        elif len(shipping_categories) == 1:
            # Single shipping category - use its allowed methods
            category = ShippingCategory.objects.prefetch_related(
                'allowed_shipping_methods__shipping_tiers'
            ).get(id=list(shipping_categories)[0])
            available_methods = category.allowed_shipping_methods.filter(is_active=True)
        else:
            # Multiple shipping categories - attempt intersection, but be resilient if some categories
            # have no explicitly configured allowed methods. In such a case we treat those categories
            # as "wildcards" (i.e., they don't constrain the available set) instead of eliminating
            # all options.
            category_objects = ShippingCategory.objects.prefetch_related('allowed_shipping_methods').filter(id__in=shipping_categories)

            all_active_method_ids = set(ShippingMethod.objects.filter(is_active=True).values_list('id', flat=True))
            method_sets = []
            wildcard_present = False
            for category in category_objects:
                ids = set(category.allowed_shipping_methods.filter(is_active=True).values_list('id', flat=True))
                if not ids:
                    # No explicit methods configured -> treat as wildcard (no restriction)
                    wildcard_present = True
                else:
                    method_sets.append(ids)

            if not method_sets:
                # All categories were wildcards (no allowed methods configured), fallback to all active methods
                available_methods = ShippingMethod.objects.filter(is_active=True).prefetch_related('shipping_tiers')
            else:
                # Compute intersection among configured sets
                common_ids = set.intersection(*method_sets) if method_sets else set()
                if wildcard_present:
                    # Wildcard categories mean we don't further restrict beyond intersection of configured ones
                    common_candidate_ids = common_ids if common_ids else set.union(*method_sets)
                else:
                    common_candidate_ids = common_ids

                if common_candidate_ids:
                    available_methods = ShippingMethod.objects.filter(id__in=common_candidate_ids, is_active=True).prefetch_related('shipping_tiers')
                else:
                    # No overlap. Mark split shipping and provide union (or all active if union empty)
                    requires_split_shipping = True
                    union_ids = set.union(*method_sets) if method_sets else set()
                    if not union_ids:
                        union_ids = all_active_method_ids  # extreme fallback
                    available_methods = ShippingMethod.objects.filter(id__in=union_ids, is_active=True).prefetch_related('shipping_tiers')
        
        # Apply quantity and weight constraints and collect constraint violations
        filtered_methods = []
        constraint_violations = []
        
        for method in available_methods:
            method_violations = []
            
            # Check quantity constraint
            if method.max_quantity and total_quantity > method.max_quantity:
                method_violations.append({
                    'type': 'quantity_exceeded',
                    'message': f'Maximum quantity for {method.name} is {method.max_quantity} items. Your cart has {total_quantity} items.',
                    'current_value': total_quantity,
                    'max_allowed': method.max_quantity,
                    'method_name': method.name
                })
            
            # Check weight constraint
            if method.max_weight and total_weight > method.max_weight:
                method_violations.append({
                    'type': 'weight_exceeded',
                    'message': f'Maximum weight for {method.name} is {method.max_weight}kg. Your cart weighs {total_weight}kg.',
                    'current_value': float(total_weight),
                    'max_allowed': float(method.max_weight),
                    'method_name': method.name
                })
            
            # If method has violations, add to violations list but don't include in available methods
            if method_violations:
                constraint_violations.extend(method_violations)
                continue
            
            # Calculate price based on method's preferred pricing type
            if method.preferred_pricing_type == 'weight':
                shipping_price = method.get_price_for_weight(total_weight)
                pricing_method_used = 'weight'
            else:
                shipping_price = method.get_price_for_quantity(total_quantity)
                pricing_method_used = 'quantity'
            
            filtered_methods.append({
                'id': method.id,
                'name': method.name,
                'description': method.description,
                'base_price': str(method.price),
                'calculated_price': str(shipping_price),
                'delivery_estimated_time': method.delivery_estimated_time,
                'max_weight': str(method.max_weight) if method.max_weight else None,
                'max_quantity': method.max_quantity,
                'preferred_pricing_type': method.preferred_pricing_type,
                'pricing_method_used': pricing_method_used,
                'tier_applied': shipping_price != method.price,
            })
        
        # Check free shipping eligibility
        free_shipping_eligible = False
        qualifying_free_rule = None
        
        active_rules = FreeShippingRule.objects.filter(
            active=True, 
            threshold_amount__lte=cart_subtotal
        ).prefetch_related('applicable_categories').order_by('-threshold_amount')
        
        for rule in active_rules:
            # Check if rule applies to cart's shipping categories
            if rule.applicable_categories.count() == 0:
                # Rule applies to all categories
                free_shipping_eligible = True
                qualifying_free_rule = {
                    'id': rule.id,
                    'threshold_amount': str(rule.threshold_amount),
                    'applies_to': 'All categories'
                }
                break
            else:
                # Check if any cart shipping category matches rule categories
                rule_category_ids = set(rule.applicable_categories.values_list('id', flat=True))
                if shipping_categories.intersection(rule_category_ids):
                    free_shipping_eligible = True
                    qualifying_free_rule = {
                        'id': rule.id,
                        'threshold_amount': str(rule.threshold_amount),
                        'applies_to': f"{rule.applicable_categories.count()} specific categories"
                    }
                    break
        
        # If free shipping is eligible, add/modify a free method
        if free_shipping_eligible:
            free_method = {
                'id': 'free',
                'name': 'Free Shipping',
                'description': f'Free shipping (order over ৳{float(qualifying_free_rule["threshold_amount"]) * 110:,.0f})',
                'base_price': '0.00',
                'calculated_price': '0.00',
                'delivery_estimated_time': 'Standard delivery time',
                'max_weight': None,
                'max_quantity': None,
                'tier_applied': False,
                'is_free_shipping_rule': True,
            }
            filtered_methods.insert(0, free_method)  # Add free shipping as first option
        
        response_payload = {
            'success': True,
            'cart_analysis': {
                'items': cart_analysis,
                'subtotal': str(cart_subtotal),
                'total_quantity': total_quantity,
                'total_weight': str(total_weight),
                'shipping_categories_count': len(shipping_categories),
                'shipping_category_ids': list(shipping_categories),
            },
            'shipping_analysis': {
                'requires_split_shipping': requires_split_shipping,
                'available_methods_count': len(filtered_methods),
                'available_methods': filtered_methods,
                'free_shipping_eligible': free_shipping_eligible,
                'qualifying_free_rule': qualifying_free_rule,
                'constraint_violations': constraint_violations,
            },
            'recommendations': {
                'can_single_shipment': not requires_split_shipping,
                'optimal_method': filtered_methods[0] if filtered_methods else None,
                'savings_with_free_shipping': str(min([Decimal(m['calculated_price']) for m in filtered_methods if not m.get('is_free_shipping_rule', False)], default=Decimal('0'))) if free_shipping_eligible else None,
            }
        }
        if missing_products:
            # Indicate some products were missing; frontend can purge them
            response_payload['missing_products'] = missing_products
            response_payload['partial'] = True
            response_payload['message'] = 'Some products were not found and were skipped.'

        return Response(response_payload, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in analyze_cart_shipping: {str(e)}", exc_info=True)
        return Response({
            'error': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to view and create orders.
    Only customers can create orders, but they can only view their own orders.
    Admins can view all orders.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'order_number'

    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on the action.
        """
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['list', 'retrieve']:
            return OrderReadSerializer
        return OrderSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'confirm_payment', 'submit_order']:
            # Allow both authenticated and unauthenticated users to create orders and confirm payments
            permission_classes = [permissions.AllowAny]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            # Require authentication for viewing/modifying orders
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Custom queryset logic:
        - If 'user' query param is provided, filter by user id (API usage) - but only allow if admin or own user
        - If 'order_number' query param is provided, filter by order_number (API usage)
        - Otherwise, for authenticated users, show only their own orders
        - For admin users, can see all orders when no specific filter is applied
        """
        # Optimize with select_related and prefetch_related to avoid N+1 queries
        queryset = Order.objects.select_related(
            'user',
            'shipping_address',
            'shipping_method',
            'payment'
        ).prefetch_related(
            'items__product',
            'items__product__additional_images',
            'items__color',
            'items__size',
            'updates'
        )
        user_param = self.request.query_params.get('user')
        order_number_param = self.request.query_params.get('order_number')
        user = self.request.user

        # API: filter by user id if provided
        if user_param:
            # Security check: only allow admin to fetch any user's orders, or users to fetch their own
            is_admin = user.is_authenticated and (
                (hasattr(user, 'user_type') and user.user_type == 'ADMIN') or 
                user.is_superuser or 
                user.is_staff
            )
            
            if is_admin:
                # Admin can filter by any user ID
                queryset = queryset.filter(user__id=user_param)
            elif user.is_authenticated and str(user.id) == str(user_param):
                # Users can fetch their own orders, including guest orders by email
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(user__id=user_param) | Q(customer_email=user.email, user__isnull=True)
                )
            else:
                # Unauthorized access attempt - return empty queryset
                return queryset.none()
        # API: filter by order_number if provided  
        elif order_number_param:
            queryset = queryset.filter(order_number=order_number_param)
            # Additional security: non-admin users can only see their own orders
            is_admin = user.is_authenticated and (
                (hasattr(user, 'user_type') and user.user_type == 'ADMIN') or 
                user.is_superuser or 
                user.is_staff
            )
            if not is_admin:
                queryset = queryset.filter(user=user)

        # If no filter params, apply default logic
        else:
            # Check if user is admin
            is_admin = user.is_authenticated and (
                (hasattr(user, 'user_type') and user.user_type == 'ADMIN') or 
                user.is_superuser or 
                user.is_staff
            )
            
            if is_admin:
                # Admin can see all orders
                return queryset.order_by('-ordered_at')
            
            # If not authenticated, return empty queryset
            if not user.is_authenticated:
                return queryset.none()
            
            # For regular users, show orders where user matches OR email matches (for guest orders)
            # This allows users to see orders they placed before logging in
            from django.db.models import Q
            
            queryset = queryset.filter(
                Q(user=user) | Q(customer_email=user.email, user__isnull=True)
            ).order_by('-ordered_at')

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Custom list method to handle order listing with proper error handling
        """
        try:
            # Add debugging information
            logger.info(f"Orders list request from user: {request.user}")
            logger.info(f"User authenticated: {request.user.is_authenticated}")
            logger.info(f"Query params: {request.query_params}")
            
            queryset = self.get_queryset()
            logger.info(f"Orders queryset count: {queryset.count()}")
            
            serializer = self.get_serializer(queryset, many=True)
            
            # Add context for serializer to build absolute URLs
            serializer.context['request'] = request
            
            orders_data = serializer.data
            logger.info(f"Serialized orders count: {len(orders_data)}")
            
            return Response(orders_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error fetching orders: {str(e)}")
            return Response({
                'error': f'Failed to fetch orders: {str(e)}',
                'detail': 'There was an error retrieving your orders. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, *args, **kwargs):
        """
        Custom retrieve method with proper error handling
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            
            # Add context for serializer to build absolute URLs
            serializer.context['request'] = request
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error fetching order: {str(e)}")
            return Response({
                'error': f'Failed to fetch order: {str(e)}',
                'detail': 'There was an error retrieving the order details. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    def create(self, request, *args, **kwargs):
        """
        Create a new order with payment information.
        Accepts nested order payload and creates Order, OrderItem(s) and OrderPayment in atomic transaction.
        Supports both authenticated users and anonymous guest orders.
        """
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data, context={'request': request})
                
                if not serializer.is_valid():
                    logger.warning(f"Order validation failed: {serializer.errors}")
                    return Response({
                        'success': False,
                        'detail': 'Order validation failed',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create the order with atomic transaction
                order = serializer.save()
                
                logger.info(f"Order created successfully: {order.order_number}")
                
                # Return success response with order details
                return Response({
                    'success': True,
                    'order_id': order.id,
                    'order_number': order.order_number
                }, status=status.HTTP_201_CREATED)
                
        except serializers.ValidationError as e:
            # Handle validation errors
            logger.exception(f"Order validation error: {str(e)}")
            traceback.print_exc()
            return Response({
                'success': False,
                'detail': 'Order validation failed',
                'errors': e.detail if hasattr(e, 'detail') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            # Handle unexpected errors
            import traceback
            error_traceback = traceback.format_exc()
            logger.exception(f"Order creation failed: {str(e)}")
            print(f"❌ Order creation failed: {str(e)}")
            print(f"❌ Full traceback:\n{error_traceback}")
            
            return Response({
                'success': False,
                'detail': f'Order creation failed: {str(e)}',
                'error_type': type(e).__name__,
                'errors': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='submit', permission_classes=[permissions.AllowAny])
    def submit_order(self, request):
        """
        POST /api/orders/submit/
        Frontend থেকে order create করার dedicated endpoint।
        """
        try:
            with transaction.atomic():
                serializer = OrderCreateSerializer(
                    data=request.data,
                    context={'request': request}
                )

                if not serializer.is_valid():
                    logger.warning(f"Order validation failed: {serializer.errors}")
                    return Response({
                        'success': False,
                        'detail': 'Order validation failed',
                        'errors': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)

                order = serializer.save()

                logger.info(f"Order created: {order.order_number}")
                return Response({
                    'success':      True,
                    'order_number': order.order_number,
                    'order_id':     order.id,
                }, status=status.HTTP_201_CREATED)

        except serializers.ValidationError as e:
            return Response({
                'success': False,
                'detail':  'Order validation failed',
                'errors':  e.detail if hasattr(e, 'detail') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f"Order creation failed: {str(e)}")
            return Response({
                'success': False,
                'detail':  f'Order creation failed: {str(e)}',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


            
    @action(detail=False, methods=['post'], url_path='confirm-payment', permission_classes=[permissions.AllowAny])
    def confirm_payment(self, request):
        """
        Confirm payment for an order and update payment status.
        POST /api/orders/confirm-payment/
        Body: {
            "transaction_number": "01234567890",
            "transaction_id": "TXN123456",
            "comment": "Payment completed",
            "total_amount": 150.00,
            "subtotal": 120.00,
            "shipping_cost": 30.00,
            "shipping_method_id": 1,
            "shipping_method_name": "Door to Door",
            "discount_amount": 0,
            "coupon_code": null,
            "items": [...]
        }
        """
        try:
            # Handle payment data from frontend nested structure
            payment_data = request.data.get('payment', {})
            transaction_number = payment_data.get('sender_number') or request.data.get('transaction_number')
            transaction_id = payment_data.get('transaction_id') or request.data.get('transaction_id')
            comment = request.data.get('comment', '')
            
            # Handle total_amount calculation from frontend data
            total_amount = request.data.get('total_amount') or request.data.get('frontend_total')
            subtotal = request.data.get('subtotal') or request.data.get('frontend_subtotal')
            
            shipping_cost = request.data.get('shipping_cost', 0)
            shipping_method_id = request.data.get('shipping_method_id') or request.data.get('shipping_method')
            shipping_method_name = request.data.get('shipping_method_name')
            discount_amount = request.data.get('discount_amount', 0)
            coupon_code = request.data.get('coupon_code')
            items = request.data.get('items', [])

            # Validate required fields
            if not transaction_number or not transaction_id:
                return Response({
                    'success': False,
                    'message': 'Transaction number and transaction ID are required.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not total_amount:
                # If total_amount is not provided, calculate it from subtotal and shipping_cost
                if subtotal:
                    total_amount = float(subtotal) + float(shipping_cost) - float(discount_amount)
                else:
                    return Response({
                        'success': False,
                        'message': 'Total amount or subtotal is required.'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Get or create user address
            shipping_address = None
            shipping_address_data = request.data.get('shipping_address')
            
            if request.user.is_authenticated:
                # For authenticated users, try to get their default address first
                from users.models import Address
                shipping_address = Address.objects.filter(user=request.user, is_default=True).first()
            
            # If no shipping address found and we have shipping address data, create a new address
            if not shipping_address and shipping_address_data:
                from users.models import Address
                # Create a new address record (for both authenticated and guest users)
                address_fields = {
                    'user': request.user if request.user.is_authenticated else None,  # Allow None for guest users
                    'address_line_1': shipping_address_data.get('street_address') or shipping_address_data.get('address_line_1', ''),
                    'city': shipping_address_data.get('city', ''),
                    'state': shipping_address_data.get('state', ''),
                    'postal_code': shipping_address_data.get('zip_code') or shipping_address_data.get('postal_code', ''),
                    'country': shipping_address_data.get('country', 'Bangladesh'),
                    'is_default': False if not request.user.is_authenticated else True  # Don't set as default for guest users
                }
                
                # Validate required address fields
                required_fields = ['address_line_1', 'city', 'state', 'postal_code']
                missing_fields = [field for field in required_fields if not address_fields.get(field)]
                
                if missing_fields:
                    return Response({
                        'success': False,
                        'message': f'Missing required address fields: {", ".join(missing_fields)}',
                        'errors': {field: ['This field is required.'] for field in missing_fields}
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    shipping_address = Address.objects.create(**address_fields)
                    print(f"✅ Created address for {'user' if request.user.is_authenticated else 'guest'}: {shipping_address}")
                except Exception as e:
                    print(f"❌ Failed to create address: {e}")
                    return Response({
                        'success': False,
                        'message': f'Failed to create shipping address: {str(e)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Ensure we have a shipping address
            if not shipping_address:
                return Response({
                    'success': False,
                    'message': 'Shipping address is required. Please provide complete shipping address information.',
                    'errors': {'shipping_address': ['Shipping address data is required.']}
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get shipping method
            shipping_method = None
            if shipping_method_id:
                try:
                    # Handle special case of 'free' shipping
                    if shipping_method_id == 'free':
                        # For free shipping, we'll handle it separately (no specific shipping method needed)
                        shipping_method = None
                        shipping_cost = 0  # Override shipping cost to 0 for free shipping
                    else:
                        # Convert to int for numeric IDs
                        numeric_id = int(shipping_method_id)
                        shipping_method = ShippingMethod.objects.get(id=numeric_id, is_active=True)
                except (ShippingMethod.DoesNotExist, ValueError, TypeError):
                    # ValueError/TypeError for invalid numeric conversion
                    pass
            
            # If no shipping method found and not free shipping, get the first active one as default
            if not shipping_method and shipping_method_id != 'free':
                shipping_method = ShippingMethod.objects.filter(is_active=True).first()
                if not shipping_method:
                    return Response({
                        'success': False,
                        'message': 'No shipping method available. Please contact support.'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Generate tracking number
            import datetime
            import random
            tracking_number = f"TRK-{datetime.datetime.now().strftime('%Y%m%d')}-{random.randint(10000, 99999)}"

            # Create order data
            order_data = {
                'user': request.user if request.user.is_authenticated else None,
                'total_amount': total_amount,
                'cart_subtotal': subtotal,
                'status': Order.OrderStatus.PROCESSING,  # Set to processing after payment confirmation
                'payment_status': Order.PaymentStatus.PAID,  # Mark as paid
                'shipping_address': shipping_address,
                'shipping_method': shipping_method,
                'tracking_number': tracking_number,
                'customer_name': request.data.get('customer_name', ''),
                'customer_email': request.data.get('customer_email', ''),
                'customer_phone': request.data.get('customer_phone', ''),
            }

            # Create the order
            order = Order(**order_data)
            
            # Prepare cart items for order ID generation
            cart_items_for_id = []
            if items:
                for item in items:
                    product_name = ""
                    if 'product_name' in item:
                        product_name = item['product_name']
                    elif 'product' in item or 'product_id' in item:
                        # Try to get product name from database
                        try:
                            product_id = item.get('product') or item.get('product_id')
                            product = Product.objects.get(id=product_id)
                            product_name = product.name
                        except Product.DoesNotExist:
                            pass
                    
                    cart_items_for_id.append({
                        'product_name': product_name,
                        'quantity': item.get('quantity', 1)
                    })
            
            # Set cart items for order ID generation
            order._cart_items = cart_items_for_id
            order.save()

            # Create order items
            for item in items:
                try:
                    # Try to find the product by ID first (frontend sends 'product' field)
                    product = None
                    if 'product' in item:
                        product = Product.objects.get(id=item['product'])
                    elif 'product_id' in item:
                        product = Product.objects.get(id=item['product_id'])
                    elif 'product_name' in item:
                        # Try to find by name (this is a fallback)
                        product = Product.objects.filter(name__icontains=item['product_name']).first()
                    
                    if product:
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=item.get('quantity', 1),
                            unit_price=item.get('unit_price', item.get('price', product.price))
                        )
                except Exception as e:
                    # If product not found, continue with other items
                    continue

            # Create payment record
            payment_method_from_frontend = payment_data.get('payment_method', 'bkash')
            payment_record_data = {
                'order': order,
                'sender_number': transaction_number,
                'transaction_id': transaction_id,
                'payment_method': payment_method_from_frontend,
            }
            
            payment = OrderPayment.objects.create(**payment_record_data)

            # Create order update for payment confirmation
            OrderUpdate.objects.create(
                order=order,
                status=Order.OrderStatus.PROCESSING,
                notes=f"Payment confirmed. Transaction ID: {transaction_id}. {comment if comment else ''}"
            )

            # Prepare response data
            response_data = {
                'success': True,
                'message': 'Payment confirmed successfully',
                'order_id': order.id,
                'order_number': str(order.order_number),
                'tracking_number': order.tracking_number,
                'payment_status': order.payment_status,
                'order_status': order.status,
                'total_amount': str(order.total_amount)
            }

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'message': f'Payment confirmation failed: {str(e)}',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ShippingTierViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for ShippingTiers.
    """
    queryset = ShippingTier.objects.all().select_related('shipping_method').order_by('shipping_method', 'priority', 'min_quantity', 'min_weight')
    permission_classes = [ReadOnlyOrIsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return ShippingTierWriteSerializer
        return ShippingTierSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        method_id = self.request.query_params.get('shipping_method')
        if method_id:
            qs = qs.filter(shipping_method_id=method_id)
        pricing_type = self.request.query_params.get('pricing_type')
        if pricing_type:
            qs = qs.filter(pricing_type=pricing_type)
        return qs


class ShippingMethodViewSet(viewsets.ModelViewSet):
    """
    API endpoint for shipping methods — read-only for public, full CRUD for admin.
    Enhanced with advanced shipping logic for weight, quantity constraints, and tiers.
    """
    queryset = ShippingMethod.objects.all().prefetch_related(
        'shipping_tiers',
        'shipping_categories'
    )
    permission_classes = [ReadOnlyOrIsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        qs = super().get_queryset()
        # Public endpoint only shows active methods
        if not (self.request.user and self.request.user.is_authenticated
                and hasattr(self.request.user, 'user_type')
                and self.request.user.user_type == 'ADMIN'):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return ShippingMethodWriteSerializer
        return ShippingMethodSerializer
    
    @action(detail=True, methods=['get'], url_path='price-for-cart')
    def price_for_cart(self, request, pk=None):
        """
        Get shipping price for cart items (supports both quantity and weight-based pricing)
        GET /api/shipping-methods/{id}/price-for-cart/?quantity=5&weight=2.5&pricing_type=weight
        """
        shipping_method = self.get_object()
        quantity = request.query_params.get('quantity', 1)
        weight = request.query_params.get('weight', 0)
        pricing_type = request.query_params.get('pricing_type', None)  # None means use method preference
        
        try:
            quantity = int(quantity)
            if quantity < 0:
                quantity = 1
        except (ValueError, TypeError):
            quantity = 1
            
        try:
            weight = float(weight)
            if weight < 0:
                weight = 0
        except (ValueError, TypeError):
            weight = 0
        
        # Check constraints
        constraints_met = True
        constraint_errors = []
        
        if shipping_method.max_quantity and quantity > shipping_method.max_quantity:
            constraints_met = False
            constraint_errors.append(f'Quantity {quantity} exceeds maximum {shipping_method.max_quantity}')
            
        if shipping_method.max_weight and weight > float(shipping_method.max_weight):
            constraints_met = False
            constraint_errors.append(f'Weight {weight}kg exceeds maximum {shipping_method.max_weight}kg')
        
        # Calculate price using the new method
        if constraints_met:
            price = shipping_method.get_price_for_cart(
                quantity=quantity, 
                weight=weight, 
                pricing_type=pricing_type
            )
            # Determine which pricing method was actually used
            actual_pricing_type = pricing_type or shipping_method.preferred_pricing_type
        else:
            price = None
            actual_pricing_type = None
        
        # Get tier information based on pricing type
        quantity_tiers = list(shipping_method.shipping_tiers.filter(
            pricing_type='quantity'
        ).values('min_quantity', 'price'))
        
        weight_tiers = list(shipping_method.shipping_tiers.filter(
            pricing_type='weight'
        ).values('min_weight', 'price'))
        
        return Response({
            'shipping_method': shipping_method.name,
            'quantity': quantity,
            'weight': weight,
            'pricing_type_used': actual_pricing_type,
            'preferred_pricing_type': shipping_method.preferred_pricing_type,
            'price': str(price) if price else None,
            'base_price': str(shipping_method.price),
            'constraints_met': constraints_met,
            'constraint_errors': constraint_errors,
            'has_quantity_tiers': len(quantity_tiers) > 0,
            'has_weight_tiers': len(weight_tiers) > 0,
            'max_quantity': shipping_method.max_quantity,
            'max_weight': str(shipping_method.max_weight) if shipping_method.max_weight else None,
            'quantity_tiers': quantity_tiers,
            'weight_tiers': weight_tiers,
        })
    
    @action(detail=False, methods=['get'], url_path='for-cart')
    def methods_for_cart(self, request):
        """
        Get applicable shipping methods for a cart
        GET /api/shipping-methods/for-cart/?quantity=10&weight=5.0&category_ids=1,2
        """
        quantity = request.query_params.get('quantity', 1)
        weight = request.query_params.get('weight', 0)
        category_ids = request.query_params.get('category_ids', '')
        
        try:
            quantity = int(quantity)
        except (ValueError, TypeError):
            quantity = 1
            
        try:
            weight = float(weight)
        except (ValueError, TypeError):
            weight = 0
        
        # Parse category IDs
        if category_ids:
            try:
                category_ids = [int(cid.strip()) for cid in category_ids.split(',') if cid.strip()]
            except (ValueError, TypeError):
                category_ids = []
        else:
            category_ids = []
        
        # Get applicable methods
        if category_ids:
            # Similar resilient intersection logic as in analyze_cart_shipping
            categories = ShippingCategory.objects.prefetch_related('allowed_shipping_methods').filter(id__in=category_ids)
            all_active_ids = set(ShippingMethod.objects.filter(is_active=True).values_list('id', flat=True))
            method_sets = []
            wildcard_present = False
            for category in categories:
                ids = set(category.allowed_shipping_methods.filter(is_active=True).values_list('id', flat=True))
                if not ids:
                    wildcard_present = True
                else:
                    method_sets.append(ids)

            if not method_sets:
                applicable_methods = ShippingMethod.objects.filter(is_active=True).prefetch_related('shipping_tiers')
            else:
                common_ids = set.intersection(*method_sets) if method_sets else set()
                if wildcard_present:
                    candidate_ids = common_ids if common_ids else set.union(*method_sets)
                else:
                    candidate_ids = common_ids

                if candidate_ids:
                    applicable_methods = ShippingMethod.objects.filter(id__in=candidate_ids, is_active=True).prefetch_related('shipping_tiers')
                else:
                    # No overlap -> mark split shipping downstream; provide union or all active as fallback
                    union_ids = set.union(*method_sets) if method_sets else set()
                    if not union_ids:
                        union_ids = all_active_ids
                    applicable_methods = ShippingMethod.objects.filter(id__in=union_ids, is_active=True).prefetch_related('shipping_tiers')
        else:
            applicable_methods = ShippingMethod.objects.filter(is_active=True).prefetch_related('shipping_tiers')
        
        # Filter by constraints and calculate prices
        valid_methods = []
        for method in applicable_methods:
            # Check constraints
            if method.max_quantity and quantity > method.max_quantity:
                continue
            if method.max_weight and weight > float(method.max_weight):
                continue
            
            # Calculate price
            price = method.get_price_for_quantity(quantity)
            
            valid_methods.append({
                'id': method.id,
                'name': method.name,
                'description': method.description,
                'base_price': str(method.price),
                'calculated_price': str(price),
                'delivery_estimated_time': method.delivery_estimated_time,
                'max_weight': str(method.max_weight) if method.max_weight else None,
                'max_quantity': method.max_quantity,
                'tier_applied': price != method.price,
                'tier_pricing': [
                    {'min_quantity': tier.min_quantity, 'price': str(tier.price)}
                    for tier in method.shipping_tiers.all()
                ]
            })
        
        return Response({
            'quantity': quantity,
            'weight': weight,
            'category_ids': category_ids,
            'available_methods': valid_methods,
            'methods_count': len(valid_methods),
            'requires_split_shipping': len(valid_methods) == 0 and len(category_ids) > 1
        }, status=status.HTTP_200_OK)

class OrderPaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows order payments to be created and viewed.
    """
    serializer_class = OrderPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return payment information for orders
        belonging to the currently authenticated user.
        """
        return OrderPayment.objects.filter(order__user=self.request.user)

class ShippingMethodListAPIView(generics.ListAPIView):
    """
    Public API endpoint that returns all available shipping methods.
    No authentication required.
    """
    queryset = ShippingMethod.objects.filter(is_active=True)
    serializer_class = ShippingMethodSerializer
    permission_classes = [permissions.AllowAny]

class CouponViewSet(viewsets.ModelViewSet):
    """
    API endpoint for coupon management.
    Admin can create/edit/delete. Public can only view active coupons.
    """
    serializer_class = CouponSerializer
    permission_classes = [ReadOnlyOrIsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['code', 'type']
    
    def get_queryset(self):
        """Admin sees all coupons, public sees only active ones."""
        if (self.request.user and self.request.user.is_authenticated and
            (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            return Coupon.objects.all().order_by('-created_at')
        return Coupon.objects.filter(active=True)
    
    @action(detail=False, methods=['post'], url_path='validate')
    def validate_coupon(self, request):
        """
        Validate a coupon against cart items
        POST /api/coupons/validate/
        Body: {
            "coupon_code": "SAVE10",
            "cart_items": [
                {"quantity": 2, "product": "Product 1"},
                {"quantity": 1, "product": "Product 2"}
            ],
            "cart_total": 75.50,  // Optional, required for CART_TOTAL_DISCOUNT
            "user_id": 123        // Optional, required for FIRST_TIME_USER and USER_SPECIFIC
        }
        """
        serializer = CouponValidationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        coupon_code = serializer.validated_data['coupon_code']
        cart_items = serializer.validated_data['cart_items']
        cart_total = serializer.validated_data.get('cart_total')
        user_id = serializer.validated_data.get('user_id')
        
        # Get user if user_id is provided
        user = None
        if user_id:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({
                    'valid': False,
                    'message': 'User not found.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coupon = Coupon.objects.get(code=coupon_code, active=True)
        except Coupon.DoesNotExist:
            return Response({
                'valid': False,
                'message': 'Coupon not found or inactive.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate coupon with enhanced parameters
        is_valid, message = coupon.is_valid_for_cart(cart_items, user=user, cart_total=cart_total)
        
        response_data = {
            'valid': is_valid,
            'message': message,
            'coupon': CouponSerializer(coupon).data if is_valid else None
        }
        
        # If valid, calculate discount amounts
        if is_valid and cart_total is not None:
            # Calculate discount with cart total and default shipping cost
            discount_breakdown = coupon.calculate_discount(cart_total, shipping_cost=0)
            total_discount = discount_breakdown['product_discount'] + discount_breakdown['shipping_discount']
            
            response_data.update({
                'discount_amount': total_discount,
                'discount_breakdown': discount_breakdown,
                'discount_type': coupon.get_type_display()
            })
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='calculate-discount')
    def calculate_discount(self, request, pk=None):
        """
        Calculate discount amount for a specific coupon
        POST /api/coupons/{id}/calculate-discount/
        Body: {
            "cart_total": 100.00,
            "shipping_cost": 10.00,
            "cart_items": [...]
        }
        """
        coupon = self.get_object()
        
        cart_total = request.data.get('cart_total', 0)
        shipping_cost = request.data.get('shipping_cost', 0)
        cart_items = request.data.get('cart_items', [])
        
        # Validate the coupon first
        is_valid, message = coupon.is_valid_for_cart(cart_items)
        if not is_valid:
            return Response({
                'valid': False,
                'message': message,
                'discount': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate discount
        discount = coupon.calculate_discount(cart_total, shipping_cost)
        
        return Response({
            'valid': True,
            'message': 'Discount calculated successfully.',
            'discount': discount,
            'coupon': CouponSerializer(coupon).data
        }, status=status.HTTP_200_OK)

# Payment Accounts API View
class PaymentAccountsAPIView(generics.RetrieveAPIView):
    """
    Public API endpoint that returns admin payment accounts for frontend display.
    GET /api/payment/accounts/
    
    Returns payment account information that frontend can show to users
    during checkout (e.g., bKash number, Nagad number).
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        """Return admin payment accounts"""
        
        # Static admin payment accounts (you can move this to settings or database)
        payment_accounts = [
            {
                "method": "bkash",
                "number": "01700000000",
                "label": "Send to bKash"
            },
            {
                "method": "nagad", 
                "number": "01800000000",
                "label": "Send to Nagad"
            },
            {
                "method": "card",
                "number": "CARD_GATEWAY",
                "label": "Credit/Debit Card"
            }
        ]
        
        return Response({
            "accounts": payment_accounts
        }, status=status.HTTP_200_OK)

class ShippingCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for shipping categories — read-only for public, full CRUD for admin.
    """
    queryset = ShippingCategory.objects.all().prefetch_related('allowed_shipping_methods')
    permission_classes = [ReadOnlyOrIsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']

    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return ShippingCategoryWriteSerializer
        return ShippingCategorySerializer

class FreeShippingRuleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for free shipping rules management.
    Admin can create/edit/delete. Public can only view active rules.
    """
    permission_classes = [ReadOnlyOrIsAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.request.method in ('POST', 'PUT', 'PATCH'):
            return FreeShippingRuleWriteSerializer
        return FreeShippingRuleSerializer
    
    def get_queryset(self):
        if (self.request.user and self.request.user.is_authenticated and
            (self.request.user.is_staff or getattr(self.request.user, 'user_type', '') == 'ADMIN')):
            return FreeShippingRule.objects.all().order_by('-threshold_amount')
        return FreeShippingRule.objects.filter(active=True)
    
    @action(detail=False, methods=['get'], url_path='check-eligibility')
    def check_eligibility(self, request):
        """
        Check if an order amount qualifies for free shipping
        GET /api/free-shipping-rules/check-eligibility/?amount=100&category_id=1
        """
        amount = request.query_params.get('amount', 0)
        category_id = request.query_params.get('category_id')
        
        try:
            amount = float(amount)
        except (ValueError, TypeError):
            return Response({
                'error': 'Invalid amount parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get shipping category if provided
        shipping_category = None
        if category_id:
            try:
                shipping_category = ShippingCategory.objects.get(id=category_id)
            except ShippingCategory.DoesNotExist:
                return Response({
                    'error': 'Shipping category not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Find applicable rules
        applicable_rules = FreeShippingRule.objects.filter(
            active=True,
            threshold_amount__lte=amount
        )
        
        # Filter by category if specified
        qualifying_rule = None
        for rule in applicable_rules:
            if shipping_category is None or rule.applies_to_category(shipping_category):
                qualifying_rule = rule
                break
        
        return Response({
            'qualifies_for_free_shipping': qualifying_rule is not None,
            'qualifying_rule': FreeShippingRuleSerializer(qualifying_rule).data if qualifying_rule else None,
            'amount': amount,
            'shipping_category': ShippingCategorySerializer(shipping_category).data if shipping_category else None
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def enhanced_checkout_calculation(request):
    """
    Enhanced checkout calculation with advanced shipping logic
    Calculates total cost, shipping options, free shipping eligibility, and coupon discounts
    
    POST /api/enhanced-checkout-calculation/
    Body: {
        "cart_items": [
            {"product_id": "uuid", "quantity": 2},
            ...
        ],
        "coupon_code": "SAVE20" (optional),
        "selected_shipping_method_id": 1 (optional),
        "user_id": 123 (optional, for user-specific coupons)
    }
    """
    try:
        cart_items = request.data.get('cart_items', [])
        coupon_code = request.data.get('coupon_code')
        selected_shipping_method_id = request.data.get('selected_shipping_method_id')
        user_id = request.data.get('user_id')
        
        if not cart_items:
            return Response({
                'error': 'cart_items is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use the cart shipping analysis we created earlier
        from django.test import RequestFactory
        factory = RequestFactory()
        analysis_request = factory.post('/api/analyze-cart-shipping/', {
            'cart_items': cart_items
        }, content_type='application/json')
        analysis_request.data = {'cart_items': cart_items}
        
        # Get shipping analysis
        analysis_response = analyze_cart_shipping(analysis_request)
        if analysis_response.status_code != 200:
            return analysis_response
        
        analysis_data = analysis_response.data
        cart_analysis = analysis_data['cart_analysis']
        shipping_analysis = analysis_data['shipping_analysis']
        
        cart_subtotal = Decimal(cart_analysis['subtotal'])
        total_quantity = cart_analysis['total_quantity']
        available_methods = shipping_analysis['available_methods']
        
        # Initialize totals
        shipping_cost = Decimal('0')
        discount_amount = Decimal('0')
        final_total = cart_subtotal
        
        # Handle selected shipping method
        selected_shipping = None
        if selected_shipping_method_id:
            if selected_shipping_method_id == 'free':
                selected_shipping = {
                    'id': 'free',
                    'name': 'Free Shipping',
                    'price': '0.00'
                }
                shipping_cost = Decimal('0')
            else:
                for method in available_methods:
                    if method['id'] == selected_shipping_method_id:
                        selected_shipping = method
                        shipping_cost = Decimal(method['calculated_price'])
                        break
        elif available_methods:
            # Auto-select first available method (likely free shipping if eligible)
            selected_shipping = available_methods[0]
            shipping_cost = Decimal(selected_shipping['calculated_price'])
        
        # Handle coupon validation and calculation
        coupon_data = None
        coupon_discount = Decimal('0')
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, active=True)
                
                # Get user if provided
                user = None
                if user_id:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    try:
                        user = User.objects.get(id=user_id)
                    except User.DoesNotExist:
                        pass
                
                # Validate coupon
                is_valid, message = coupon.is_valid_for_cart(cart_items, user, cart_subtotal)
                
                if is_valid:
                    discount_breakdown = coupon.calculate_discount(cart_subtotal, shipping_cost)
                    coupon_discount = Decimal(str(discount_breakdown.get('product_discount', 0)))
                    shipping_discount = Decimal(str(discount_breakdown.get('shipping_discount', 0)))
                    
                    # Apply shipping discount
                    if shipping_discount > 0:
                        shipping_cost = max(Decimal('0'), shipping_cost - shipping_discount)
                    
                    coupon_data = {
                        'code': coupon.code,
                        'type': coupon.get_type_display(),
                        'discount_percent': str(coupon.discount_percent),
                        'product_discount': str(coupon_discount),
                        'shipping_discount': str(shipping_discount),
                        'total_discount': str(coupon_discount + shipping_discount),
                        'message': 'Coupon applied successfully'
                    }
                else:
                    coupon_data = {
                        'code': coupon_code,
                        'error': message,
                        'valid': False
                    }
            except Coupon.DoesNotExist:
                coupon_data = {
                    'code': coupon_code,
                    'error': 'Coupon not found or inactive',
                    'valid': False
                }
        
        # Calculate final totals
        discounted_subtotal = cart_subtotal - coupon_discount
        final_total = discounted_subtotal + shipping_cost
        
        # Prepare response
        response_data = {
            'success': True,
            'calculation_summary': {
                'cart_subtotal': str(cart_subtotal),
                'total_quantity': total_quantity,
                'shipping_cost': str(shipping_cost),
                'discount_amount': str(coupon_discount),
                'final_total': str(final_total),
                'currency': 'BDT',  # You might want to make this configurable
            },
            'cart_details': cart_analysis,
            'shipping_details': {
                'available_methods': available_methods,
                'selected_method': selected_shipping,
                'requires_split_shipping': shipping_analysis['requires_split_shipping'],
                'free_shipping_eligible': shipping_analysis['free_shipping_eligible'],
                'qualifying_free_rule': shipping_analysis['qualifying_free_rule'],
            },
            'coupon_details': coupon_data,
            'recommendations': {
                'optimal_shipping': available_methods[0] if available_methods else None,
                'savings_opportunities': [],
                'warnings': []
            }
        }
        
        # Add recommendations
        if not shipping_analysis['free_shipping_eligible'] and shipping_analysis['qualifying_free_rule'] is None:
            # Check how much more is needed for free shipping
            active_rules = FreeShippingRule.objects.filter(active=True).order_by('threshold_amount')
            for rule in active_rules:
                needed_amount = rule.threshold_amount - cart_subtotal
                if needed_amount > 0:
                    response_data['recommendations']['savings_opportunities'].append({
                        'type': 'free_shipping',
                        'message': f'Add ৳{float(needed_amount) * 110:,.0f} more for free shipping',
                        'amount_needed': str(needed_amount),
                        'threshold': str(rule.threshold_amount)
                    })
                    break
        
        if shipping_analysis['requires_split_shipping']:
            response_data['recommendations']['warnings'].append({
                'type': 'split_shipping',
                'message': 'Items require different shipping methods - split shipment may be needed',
                'severity': 'warning'
            })
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in enhanced_checkout_calculation: {str(e)}", exc_info=True)
        return Response({
            'error': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def debug_orders_api(request):
    """Debug endpoint to check orders and users"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get counts
        total_orders = Order.objects.count()
        total_users = User.objects.count()
        
        # Get current user info
        user_info = {
            'is_authenticated': request.user.is_authenticated,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'username': str(request.user) if request.user.is_authenticated else None,
            'email': request.user.email if request.user.is_authenticated else None,
        }
        
        # Check authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        # Get all orders with user info
        orders_data = []
        for order in Order.objects.all()[:10]:  # Limit to first 10
            orders_data.append({
                'order_number': order.order_number,
                'user_id': order.user_id,
                'customer_email': order.customer_email,
                'status': order.status,
                'total_amount': str(order.total_amount),
                'ordered_at': order.ordered_at.isoformat() if order.ordered_at else None,
            })
        
        # Get all users
        users_data = []
        for user in User.objects.all()[:10]:  # Limit to first 10
            users_data.append({
                'id': user.id,
                'email': user.email,
                'is_active': user.is_active,
            })
        
        # Test the filtering logic for current user
        user_orders = []
        if request.user.is_authenticated:
            user_specific_orders = Order.objects.filter(user=request.user)
            for order in user_specific_orders:
                user_orders.append({
                    'order_number': order.order_number,
                    'total_amount': str(order.total_amount),
                })
        
        # Check if user parameter is provided
        user_param = request.GET.get('user')
        filtered_orders = []
        if user_param:
            try:
                filtered_orders_qs = Order.objects.filter(user__id=user_param)
                for order in filtered_orders_qs:
                    filtered_orders.append({
                        'order_number': order.order_number,
                        'total_amount': str(order.total_amount),
                    })
            except Exception as e:
                logger.exception(f"Error filtering orders by user {user_param}")
        
        return Response({
            'debug_info': {
                'total_orders': total_orders,
                'total_users': total_users,
                'current_user': user_info,
                'user_param': user_param,
                'auth_header_present': bool(auth_header),
                'auth_header_starts_with_bearer': auth_header.startswith('Bearer '),
            },
            'orders': orders_data,
            'users': users_data,
            'user_specific_orders': user_orders,
            'filtered_orders': filtered_orders,
        })
        
    except Exception as e:
        logger.exception("Error in debug orders API")
        return Response({
            'error': str(e),
            'debug_info': {
                'total_orders': 'error',
                'total_users': 'error',
            }
        }, status=500)


# ── Invoice Generation ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_invoice(request, order_number):
    """
    GET /api/orders/invoice/<order_number>/
    Returns an HTML invoice page. Add ?download=1 to get it as a downloadable file.
    """
    try:
        order = Order.objects.select_related(
            'user', 'shipping_address', 'shipping_method'
        ).get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    # Permission check: owner, vendor of items, or admin
    user = request.user
    is_owner = order.user_id == user.id
    is_admin = user.user_type == 'ADMIN'
    is_vendor = False
    if user.user_type == 'VENDOR' and user.shops.exists():
        from products.models import Product
        vendor_product_ids = Product.objects.filter(
            shop__owner=user
        ).values_list('id', flat=True)
        is_vendor = order.items.filter(product_id__in=vendor_product_ids).exists()

    if not (is_owner or is_admin or is_vendor):
        return Response({'error': 'Permission denied'}, status=403)

    items = order.items.select_related('product', 'color', 'size').all()
    items_with_totals = []
    subtotal = Decimal('0.00')
    for item in items:
        line_total = item.quantity * item.unit_price
        subtotal += line_total
        items_with_totals.append(type('obj', (), {
            'product': item.product,
            'color': item.color,
            'size': item.size,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'line_total': line_total,
        }))

    shipping_cost = Decimal('0.00')
    if order.shipping_method:
        shipping_cost = order.total_amount - subtotal
        if shipping_cost < 0:
            shipping_cost = Decimal('0.00')

    discount = subtotal + shipping_cost - order.total_amount
    if discount < 0:
        discount = Decimal('0.00')

    payment = None
    try:
        payment = order.payment
    except OrderPayment.DoesNotExist:
        pass

    from website.models import SiteSettings
    try:
        site = SiteSettings.objects.first()
        site_name = site.site_name if site else 'iCommerce'
        site_email = site.contact_email if site else ''
        site_phone = site.contact_phone if site else ''
        site_tagline = getattr(site, 'tagline', '')
    except Exception:
        site_name, site_email, site_phone, site_tagline = 'iCommerce', '', '', ''

    context = {
        'order': order,
        'items': items_with_totals,
        'subtotal': subtotal,
        'shipping_cost': shipping_cost,
        'discount': discount,
        'payment': payment,
        'site_name': site_name,
        'site_email': site_email,
        'site_phone': site_phone,
        'site_tagline': site_tagline,
    }

    html = render_to_string('invoice/invoice.html', context)

    if request.query_params.get('download'):
        response = HttpResponse(html, content_type='text/html')
        response['Content-Disposition'] = f'attachment; filename="invoice_{order.order_number}.html"'
        return response

    return HttpResponse(html, content_type='text/html')

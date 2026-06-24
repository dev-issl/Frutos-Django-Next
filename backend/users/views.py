# users/views.py
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer, 
    UserRegistrationSerializer, 
    UserSerializer,
    RegisterSerializer,
    WholesalerRegistrationSerializer,
    VendorRegistrationSerializer,
    VendorProfileSerializer,
    VendorProfileUpdateSerializer,
    VendorTicketSerializer,
    VendorTicketAdminSerializer,
    NotificationSerializer,
)
from .permissions import (
    IsOwnerOrAdmin, IsAdmin, IsCustomer, IsSeller, 
    IsCustomerOrSeller, IsSellerOrAdmin, IsVendor, IsVendorOrAdmin
)
from .models import User, VendorProfile, VendorTicket, Notification


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses email instead of username
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    View for user registration
    Creates a new user account, generates JWT tokens, and returns user data with tokens
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Handle user registration with automatic JWT token generation
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Save the user (password will be automatically hashed)
                user = serializer.save()
                
                # Generate JWT tokens for the newly created user
                token_serializer = CustomTokenObtainPairSerializer()
                refresh = token_serializer.get_token(user)
                access_token = refresh.access_token
                
                # Prepare response data with tokens
                response_data = {
                    'success': True,
                    'message': 'User registered successfully',
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'email': user.email,
                        'user_type': user.user_type,
                        'is_active': user.is_active,
                        'date_joined': user.date_joined.isoformat()
                    },
                    'tokens': {
                        'access': str(access_token),
                        'refresh': str(refresh)
                    }
                }
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Registration failed',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # If serializer is not valid, return validation errors
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    """
    Simple registration view using RegisterSerializer
    Accepts: name, email, password, confirm_password
    Returns: user's basic info (id, name, email)
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Handle user registration
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Save the user (password will be automatically hashed)
                user = serializer.save()
                
                # Return user's basic info as specified
                return Response({
                    'success': True,
                    'message': 'User registered successfully',
                    'user': serializer.to_representation(user)  # Returns id, name, email
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Registration failed',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # If serializer is not valid, return validation errors
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class RegisterAPIView(APIView):
    """
    RegisterAPIView using APIView for user registration
    
    POST /api/register/
    - Validates data using RegisterSerializer
    - On success: returns status 201 and user data
    - On failure: returns errors like "Email already exists"
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handle POST request for user registration
        """
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Save the user (password will be automatically hashed)
                user = serializer.save()
                
                # Return user's basic info (id, name, email) with 201 status
                return Response({
                    'success': True,
                    'message': 'User registered successfully',
                    'user': serializer.to_representation(user)
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                # Handle any unexpected errors during user creation
                return Response({
                    'success': False,
                    'message': 'Registration failed',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Return validation errors with detailed messages
        errors = serializer.errors
        
        # Customize error messages for better user experience
        formatted_errors = {}
        for field, error_list in errors.items():
            if field == 'email' and any('already exists' in str(error) for error in error_list):
                formatted_errors[field] = ['Email already exists']
            elif field == 'confirm_password':
                formatted_errors[field] = error_list
            else:
                formatted_errors[field] = error_list
        
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': formatted_errors
        }, status=status.HTTP_400_BAD_REQUEST)


class WholesalerRegistrationAPIView(generics.CreateAPIView):
    """
    API endpoint for wholesaler registration
    
    POST /api/auth/register/wholesaler/
    - Creates User with user_type='WHOLESALER'
    - Creates associated WholesalerProfile with business information
    - Automatically logs in the user and returns JWT tokens
    - Returns user data with profile info and tokens
    """
    queryset = User.objects.all()
    serializer_class = WholesalerRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        Override perform_create to handle post-creation logic
        """
        # Save the user and profile
        user = serializer.save()
        
        # Store user for token generation in create method
        self.created_user = user
        
        return user

    def create(self, request, *args, **kwargs):
        """
        Handle wholesaler registration with automatic login
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Create user and wholesaler profile
                self.perform_create(serializer)
                user = self.created_user
                
                # Generate JWT tokens for automatic login
                token_serializer = CustomTokenObtainPairSerializer()
                refresh = token_serializer.get_token(user)
                access_token = refresh.access_token
                
                # Prepare response data with tokens
                response_data = {
                    'success': True,
                    'message': 'Wholesaler registration successful. Your application is pending admin approval.',
                    'user': serializer.to_representation(user),
                    'tokens': {
                        'access': str(access_token),
                        'refresh': str(refresh)
                    }
                }
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Registration failed',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Return validation errors
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    View for retrieving and updating user profile
    Users can only access their own profile, admins can access any profile
    """
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_object(self):
        # If admin or staff, they can access any user profile via URL parameter
        if (hasattr(self.request.user, 'user_type') and 
            self.request.user.user_type in ['ADMIN', 'STAFF']):
            user_id = self.kwargs.get('pk')
            if user_id:
                return generics.get_object_or_404(User, pk=user_id)
        
        # Regular users can only access their own profile
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Change the authenticated user's password."""
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    if not old_password or not new_password:
        return Response({'error': 'old_password and new_password are required.'}, status=400)
    user = request.user
    if not user.check_password(old_password):
        return Response({'error': 'Current password is incorrect.'}, status=400)
    if len(new_password) < 6:
        return Response({'error': 'New password must be at least 6 characters.'}, status=400)
    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password changed successfully.'}, status=200)

    """
    Custom registration view that returns user data along with JWT tokens
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Create the user
            user = serializer.save()
            
            # Generate JWT tokens using the same method as login
            token_serializer = CustomTokenObtainPairSerializer()
            refresh = token_serializer.get_token(user)
            
            return Response({
                'success': True,
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'user_type': user.user_type,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined.isoformat()
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Registration failed',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'success': False,
        'message': 'Validation failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Custom login view that returns user data along with tokens
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(email=email, password=password)
    
    if user:
        if user.is_active:
            token_serializer = CustomTokenObtainPairSerializer()
            refresh = token_serializer.get_token(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'User account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# Additional permission-based views
@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_dashboard(request):
    """
    Admin-only dashboard with system statistics
    """
    from products.models import Product
    from orders.models import Order
    from django.db.models import Sum, Q

    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='PENDING').count()
    total_revenue = Order.objects.filter(payment_status='PAID').aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    stats = {
        'total_users': User.objects.count(),
        'total_customers': User.objects.filter(user_type='CUSTOMER').count(),
        'total_sellers': User.objects.filter(user_type='SELLER').count(),
        'total_admins': User.objects.filter(user_type='ADMIN').count(),
        'total_vendors': User.objects.filter(user_type='VENDOR').count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'inactive_users': User.objects.filter(is_active=False).count(),
        'total_products': total_products,
        'active_products': active_products,
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'total_revenue': float(total_revenue),
    }
    
    return Response({
        'message': f'Welcome Admin {request.user.name}',
        'user_type': request.user.user_type,
        'statistics': stats,
        'permissions': {
            'can_manage_users': True,
            'can_view_analytics': True,
            'can_modify_system_settings': True
        }
    })


@api_view(['GET'])
@permission_classes([IsSeller])
def seller_dashboard(request):
    """
    Seller-only dashboard
    """
    return Response({
        'message': f'Welcome Seller {request.user.name}',
        'user_type': request.user.user_type,
        'available_actions': [
            'manage_products',
            'view_sales_analytics', 
            'update_inventory',
            'respond_to_customer_queries'
        ],
        'permissions': {
            'can_create_products': True,
            'can_manage_own_products': True,
            'can_view_own_orders': True
        }
    })


@api_view(['GET'])
@permission_classes([IsCustomer])
def customer_dashboard(request):
    """
    Customer-only dashboard
    """
    return Response({
        'message': f'Welcome {request.user.name}',
        'user_type': request.user.user_type,
        'available_actions': [
            'browse_products',
            'place_orders',
            'track_orders',
            'manage_addresses',
            'view_order_history'
        ],
        'permissions': {
            'can_place_orders': True,
            'can_write_reviews': True,
            'can_manage_own_profile': True
        }
    })


@api_view(['GET']) 
@permission_classes([IsSellerOrAdmin])
def seller_or_admin_view(request):
    """
    View accessible by both sellers and admins with different data
    """
    if request.user.user_type == 'SELLER':
        data = {
            'dashboard_type': 'seller',
            'message': 'Seller analytics and management',
            'data': {
                'products_count': 0,  # Would query seller's products
                'orders_count': 0,    # Would query seller's orders
                'revenue': 0.0        # Would calculate seller's revenue
            }
        }
    else:  # Admin
        data = {
            'dashboard_type': 'admin',
            'message': 'Platform-wide analytics and management',
            'data': {
                'total_products': 0,   # Would query all products
                'total_orders': 0,     # Would query all orders  
                'platform_revenue': 0.0,  # Would calculate total revenue
                'user_growth': {}      # Would calculate user growth metrics
            }
        }
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsCustomerOrSeller])
def marketplace_view(request):
    """
    Marketplace view for customers and sellers (different perspectives)
    """
    if request.user.user_type == 'CUSTOMER':
        return Response({
            'view_type': 'customer_marketplace',
            'message': 'Browse and purchase products',
            'featured_products': [],  # Would return featured products
            'categories': [],         # Would return product categories
            'recommendations': []     # Would return personalized recommendations
        })
    else:  # Seller
        return Response({
            'view_type': 'seller_marketplace',
            'message': 'Analyze market and competition',
            'market_trends': [],      # Would return market analysis
            'competitor_analysis': [], # Would return competitor data
            'pricing_suggestions': [] # Would return pricing recommendations
        })


class AdminUserListView(generics.ListCreateAPIView):
    """
    Admin-only view to list and create users
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        return User.objects.all()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'message': 'User list (Admin access)',
            'count': queryset.count(),
            'users': serializer.data
        })

    def create(self, request, *args, **kwargs):
        """Create a new user from admin panel"""
        data = request.data.copy()
        password = data.pop('password', None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return Response({
            'message': 'User created successfully',
            'user': self.get_serializer(user).data
        }, status=status.HTTP_201_CREATED)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin-only view to retrieve, update, or delete a single user
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()


# ============================================================================
# VENDOR VIEWS
# ============================================================================

class VendorRegistrationAPIView(generics.CreateAPIView):
    """
    POST /api/auth/register/vendor/
    Creates User with user_type='VENDOR' and VendorProfile
    Auto-login with JWT tokens returned
    """
    queryset = User.objects.all()
    serializer_class = VendorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                # Generate JWT tokens
                token_serializer = CustomTokenObtainPairSerializer()
                refresh = token_serializer.get_token(user)
                return Response({
                    'success': True,
                    'message': 'Vendor registration successful. Your application is pending admin approval.',
                    'user': serializer.to_representation(user),
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'success': False,
                    'message': 'Registration failed',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class VendorProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/auth/vendor/profile/
    Vendors can view and update their own profile
    Supports multipart/form-data for file uploads
    """
    permission_classes = [permissions.IsAuthenticated]
    # Support both JSON and multipart/form-data (for file uploads)
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        from django.http import Http404
        try:
            return self.request.user.vendor_profile
        except Exception:
            raise Http404("Vendor profile not found.")

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return VendorProfileUpdateSerializer
        return VendorProfileSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Return full profile data after update
        read_serializer = VendorProfileSerializer(instance, context={'request': request})
        return Response(read_serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def vendor_list_public(request):
    """
    GET /api/auth/vendors/
    Public vendor list (only approved vendors)
    """
    vendors = VendorProfile.objects.filter(
        approval_status='APPROVED'
    ).select_related('user')

    category = request.query_params.get('category', '')
    if category:
        from shops.models import Shop
        vendor_user_ids = Shop.objects.filter(
            products__sub_category__category__slug=category,
            products__is_active=True
        ).values_list('owner_id', flat=True).distinct()
        vendors = vendors.filter(user_id__in=vendor_user_ids)

    serializer = VendorProfileSerializer(vendors, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def vendor_detail_public(request, pk):
    """
    GET /api/auth/vendors/<pk>/
    Public vendor detail (approved vendors only, no private docs)
    """
    vendor = generics.get_object_or_404(VendorProfile, pk=pk, approval_status='APPROVED')
    serializer = VendorProfileSerializer(vendor, context={'request': request})
    data = serializer.data

    try:
        from products.serializers import ProductSerializer
        from products.models import Product
        products = Product.objects.filter(
            shop__owner=vendor.user, is_active=True
        ).select_related(
            'shop', 'brand', 'sub_category', 'sub_category__category'
        ).prefetch_related('colors', 'sizes', 'reviews')
        data['products'] = ProductSerializer(products, many=True, context={'request': request}).data
    except Exception:
        data['products'] = []

    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def vendor_dashboard_stats(request):
    """Vendor dashboard stats — aggregates across all vendor shops"""
    user = request.user
    if user.user_type not in ('VENDOR', 'ADMIN'):
        return Response({'error': 'Not a vendor'}, status=status.HTTP_403_FORBIDDEN)

    from orders.models import Order, OrderItem
    from products.models import Product
    from shops.models import Shop
    from django.db.models import Sum, F, Q
    from decimal import Decimal

    shops = Shop.objects.filter(owner=user)
    if not shops.exists():
        return Response({
            'total_products': 0, 'active_products': 0,
            'total_orders': 0, 'pending_orders': 0,
            'processing_orders': 0, 'delivered_orders': 0,
            'total_revenue': '0.00', 'shops_count': 0,
        })

    shop_ids = shops.values_list('id', flat=True)
    products = Product.objects.filter(shop_id__in=shop_ids)
    product_ids = products.values_list('id', flat=True)

    order_items = OrderItem.objects.filter(product_id__in=product_ids)
    order_ids = order_items.values_list('order_id', flat=True).distinct()
    vendor_orders = Order.objects.filter(id__in=order_ids)

    total_revenue = order_items.filter(
        order__payment_status='PAID'
    ).aggregate(
        total=Sum(F('unit_price') * F('quantity'))
    )['total'] or Decimal('0.00')

    return Response({
        'total_products': products.count(),
        'active_products': products.filter(is_active=True).count(),
        'total_orders': vendor_orders.count(),
        'pending_orders': vendor_orders.filter(status='PENDING').count(),
        'processing_orders': vendor_orders.filter(status='PROCESSING').count(),
        'delivered_orders': vendor_orders.filter(status='DELIVERED').count(),
        'total_revenue': str(total_revenue),
        'shops_count': shops.count(),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def vendor_orders_list(request):
    """Returns orders containing this vendor's products, with optional shop filter"""
    from orders.models import Order, OrderItem
    from orders.serializers import OrderSerializer
    from shops.models import Shop

    shops = Shop.objects.filter(owner=request.user)
    if not shops.exists():
        return Response([])

    shop_filter = request.query_params.get('shop', '')
    if shop_filter:
        shops = shops.filter(id=shop_filter)

    product_ids = []
    for shop in shops:
        product_ids.extend(shop.products.values_list('id', flat=True))

    order_ids = OrderItem.objects.filter(
        product_id__in=product_ids
    ).values_list('order_id', flat=True).distinct()
    orders = Order.objects.filter(id__in=order_ids).order_by('-ordered_at')

    status_filter = request.query_params.get('status', '')
    if status_filter:
        orders = orders.filter(status=status_filter)

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def vendor_order_update_status(request, pk):
    """Vendor updates order status"""
    from orders.models import Order
    order = generics.get_object_or_404(Order, pk=pk)
    new_status = request.data.get('status')
    if new_status not in dict(Order.OrderStatus.choices):
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    order.status = new_status
    order.save()
    return Response({'success': True, 'status': order.status})


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def vendor_products_list(request):
    """List vendor's products (across all shops) or create new product"""
    from products.models import Product, SubCategory, Brand
    from products.serializers import ProductSerializer
    from shops.models import Shop
    from django.utils.text import slugify
    import uuid, json

    shops = Shop.objects.filter(owner=request.user)

    if request.method == 'GET':
        # Return empty list if no shops yet — not an error
        if not shops.exists():
            return Response([])

        shop_filter = request.query_params.get('shop', '')
        if shop_filter:
            filtered_shops = shops.filter(id=shop_filter)
        else:
            filtered_shops = shops

        products = Product.objects.filter(
            shop__in=filtered_shops
        ).select_related(
            'shop', 'brand', 'sub_category', 'sub_category__category'
        ).prefetch_related('colors', 'sizes').order_by('-created_at')
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        name = data.get('name')
        price = data.get('price')
        stock = data.get('stock')
        sub_category_id = data.get('sub_category')
        shop_id = data.get('shop')

        if not all([name, price, stock, sub_category_id]):
            return Response(
                {'error': 'Missing required fields: name, price, stock, sub_category'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure vendor has at least one shop before creating a product
        if not shops.exists():
            return Response(
                {'error': 'You need to create a shop first before adding products.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine the shop
        if shop_id:
            try:
                shop = shops.get(id=shop_id)
            except Shop.DoesNotExist:
                return Response(
                    {'error': 'Invalid shop or shop does not belong to you'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            shop = shops.first()

        try:
            sub_category = SubCategory.objects.get(id=sub_category_id)
            brand = None
            if data.get('brand'):
                try:
                    brand = Brand.objects.get(id=data.get('brand'))
                except Brand.DoesNotExist:
                    pass

            base_slug = slugify(name)
            unique_slug = base_slug
            counter = 1
            while Product.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1

            # Parse boolean
            is_active = data.get('is_active', 'true')
            if isinstance(is_active, str):
                is_active = is_active.lower() in ('true', '1', 'yes')

            product = Product.objects.create(
                shop=shop,
                name=name,
                slug=unique_slug,
                description=data.get('description', ''),
                sub_category=sub_category,
                brand=brand,
                price=price,
                discount_price=data.get('discount_price') or None,
                wholesale_price=data.get('wholesale_price') or None,
                minimum_purchase=data.get('minimum_purchase') or None,
                affiliate_commission_rate=data.get('affiliate_commission_rate') or None,
                stock=stock,
                is_active=is_active,
                weight=data.get('weight') or None,
                length=data.get('length') or None,
                width=data.get('width') or None,
                height=data.get('height') or None,
            )

            # Handle thumbnail
            if 'thumbnail' in request.FILES:
                product.thumbnail = request.FILES['thumbnail']
                product.save()

            # Handle colors
            if data.get('colors'):
                try:
                    from products.models import Color
                    color_ids = json.loads(data.get('colors')) if isinstance(data.get('colors'), str) else data.get('colors')
                    product.colors.set(color_ids)
                except Exception:
                    pass

            # Handle sizes
            if data.get('sizes'):
                try:
                    from products.models import Size
                    size_ids = json.loads(data.get('sizes')) if isinstance(data.get('sizes'), str) else data.get('sizes')
                    product.sizes.set(size_ids)
                except Exception:
                    pass

            # Handle additional images
            from products.models import ProductAdditionalImage
            for file_key in request.FILES:
                if file_key.startswith('image_') or file_key.startswith('additional_image_'):
                    ProductAdditionalImage.objects.create(
                        product=product,
                        image=request.FILES[file_key]
                    )

            # Handle specifications
            if data.get('specifications'):
                try:
                    specs = json.loads(data.get('specifications')) if isinstance(data.get('specifications'), str) else data.get('specifications')
                    from products.models import ProductSpecification
                    for spec in specs:
                        spec_name = spec.get('name') or spec.get('key', '')
                        spec_value = spec.get('value', '')
                        if spec_name and spec_value:
                            ProductSpecification.objects.create(
                                product=product,
                                name=spec_name,
                                value=spec_value,
                            )
                except Exception:
                    pass

            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except SubCategory.DoesNotExist:
            return Response(
                {'error': 'Invalid sub_category'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create product: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def vendor_product_detail(request, pk):
    """Get, update or delete vendor's product"""
    from products.models import Product, SubCategory, Brand
    from products.serializers import ProductSerializer
    from shops.models import Shop
    import json

    shop_ids = Shop.objects.filter(owner=request.user).values_list('id', flat=True)
    if not shop_ids:
        return Response({'error': 'No shop associated with user'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=pk, shop_id__in=shop_ids)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        data = request.data

        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = data['price']
        if 'discount_price' in data:
            product.discount_price = data['discount_price'] or None
        if 'wholesale_price' in data:
            product.wholesale_price = data['wholesale_price'] or None
        if 'minimum_purchase' in data:
            product.minimum_purchase = data['minimum_purchase'] or None
        if 'affiliate_commission_rate' in data:
            product.affiliate_commission_rate = data['affiliate_commission_rate'] or None
        if 'stock' in data:
            product.stock = data['stock']
        if 'is_active' in data:
            val = data['is_active']
            if isinstance(val, str):
                product.is_active = val.lower() in ('true', '1', 'yes')
            else:
                product.is_active = bool(val)
        if 'weight' in data:
            product.weight = data['weight'] or None
        if 'length' in data:
            product.length = data['length'] or None
        if 'width' in data:
            product.width = data['width'] or None
        if 'height' in data:
            product.height = data['height'] or None

        if 'sub_category' in data:
            try:
                sub_category = SubCategory.objects.get(id=data['sub_category'])
                product.sub_category = sub_category
            except SubCategory.DoesNotExist:
                pass

        if 'brand' in data:
            try:
                brand = Brand.objects.get(id=data['brand'])
                product.brand = brand
            except Brand.DoesNotExist:
                product.brand = None

        if 'thumbnail' in request.FILES:
            product.thumbnail = request.FILES['thumbnail']

        product.save()

        # Handle colors
        if 'colors' in data:
            try:
                from products.models import Color
                color_ids = json.loads(data['colors']) if isinstance(data['colors'], str) else data['colors']
                product.colors.set(color_ids)
            except Exception:
                pass

        # Handle sizes
        if 'sizes' in data:
            try:
                from products.models import Size
                size_ids = json.loads(data['sizes']) if isinstance(data['sizes'], str) else data['sizes']
                product.sizes.set(size_ids)
            except Exception:
                pass

        # Handle additional images
        from products.models import ProductAdditionalImage
        for file_key in request.FILES:
            if file_key.startswith('image_') or file_key.startswith('additional_image_'):
                ProductAdditionalImage.objects.create(
                    product=product,
                    image=request.FILES[file_key]
                )

        # Handle specifications
        if 'specifications' in data:
            try:
                from products.models import ProductSpecification
                specs = json.loads(data['specifications']) if isinstance(data['specifications'], str) else data['specifications']
                product.specifications.all().delete()
                for spec in specs:
                    spec_name = spec.get('name') or spec.get('key', '')
                    spec_value = spec.get('value', '')
                    if spec_name and spec_value:
                        ProductSpecification.objects.create(
                            product=product, name=spec_name, value=spec_value
                        )
            except Exception:
                pass

        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        product.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def vendor_order_create(request):
    """Vendor creates manual order"""
    from orders.models import Order, OrderItem
    from products.models import Product
    from shops.models import Shop
    from decimal import Decimal

    shops = Shop.objects.filter(owner=request.user)
    if not shops.exists():
        return Response({'error': 'No shop associated with user'}, status=status.HTTP_400_BAD_REQUEST)

    shop_ids = shops.values_list('id', flat=True)
    data = request.data
    
    # Validate required fields
    required_fields = ['customer_name', 'customer_phone', 'customer_email', 'items']
    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'Missing required field: {field}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    if not data['items'] or len(data['items']) == 0:
        return Response({'error': 'At least one item is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Calculate totals from items
        items_data = data.get('items', [])
        subtotal = Decimal('0')
        
        for item_data in items_data:
            quantity = int(item_data.get('quantity', 1))
            unit_price = Decimal(str(item_data.get('unit_price', 0)))
            subtotal += unit_price * quantity
        
        # Get additional fees (default to 0 if not provided)
        shipping_fee = Decimal(str(data.get('shipping_fee', 0)))
        tax_amount = Decimal(str(data.get('tax_amount', 0)))
        discount_amount = Decimal(str(data.get('discount_amount', 0)))
        
        # Calculate total
        total_amount = subtotal + shipping_fee + tax_amount - discount_amount
        
        # Handle shipping address (can be text or Address FK)
        shipping_address_text = data.get('shipping_address', '')
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            status='PENDING',
            payment_status='PENDING',
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            customer_email=data.get('customer_email'),
            total_amount=total_amount,
            cart_subtotal=subtotal,
        )
        
        # Create order items
        for item_data in items_data:
            product_id = item_data.get('product_id')
            try:
                product = Product.objects.get(id=product_id, shop_id__in=shop_ids)
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=int(item_data.get('quantity', 1)),
                    price=Decimal(str(item_data.get('unit_price', 0))),
                )
            except Product.DoesNotExist:
                order.delete()
                return Response(
                    {'error': f'Product {product_id} not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        from orders.serializers import OrderSerializer
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to create order: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class VendorTicketListCreateView(generics.ListCreateAPIView):
    """Vendor tickets - list and create"""
    serializer_class = VendorTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'ADMIN':
            return VendorTicket.objects.all()
        return VendorTicket.objects.filter(vendor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)


class VendorTicketDetailView(generics.RetrieveUpdateAPIView):
    """Vendor ticket detail"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type == 'ADMIN':
            return VendorTicket.objects.all()
        return VendorTicket.objects.filter(vendor=self.request.user)

    def get_serializer_class(self):
        if self.request.user.user_type == 'ADMIN':
            return VendorTicketAdminSerializer
        return VendorTicketSerializer


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_vendor_list(request):
    """Admin list all vendors"""
    vendors = VendorProfile.objects.select_related('user').order_by('-created_at')
    status_filter = request.query_params.get('status', '')
    if status_filter:
        vendors = vendors.filter(approval_status=status_filter)
    serializer = VendorProfileSerializer(vendors, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def admin_vendor_approve(request, pk):
    """Approve/reject/suspend vendor"""
    from django.utils import timezone
    vendor = generics.get_object_or_404(VendorProfile, pk=pk)
    action_type = request.data.get('action')

    if action_type == 'approve':
        vendor.approval_status = 'APPROVED'
        vendor.approved_at = timezone.now()
        vendor.approved_by = request.user
        vendor.rejection_reason = ''
        vendor.save()
        # Auto-create Shop if vendor doesn't have any shops
        from shops.models import Shop
        if not Shop.objects.filter(owner=vendor.user).exists():
            Shop.objects.create(
                owner=vendor.user,
                name=vendor.business_name,
                description=vendor.business_description or '',
                contact_email=vendor.user.email,
                contact_phone=vendor.phone,
                address=f"{vendor.address_line}, {vendor.city}",
                city=vendor.city,
                division=vendor.division,
                postal_code=vendor.postal_code,
                is_active=True, is_verified=True,
            )
        return Response({'success': True, 'status': 'APPROVED'})
    elif action_type == 'reject':
        vendor.approval_status = 'REJECTED'
        vendor.rejection_reason = request.data.get('reason', '')
        vendor.save()
        return Response({'success': True, 'status': 'REJECTED'})
    elif action_type == 'suspend':
        vendor.approval_status = 'SUSPENDED'
        vendor.rejection_reason = request.data.get('reason', '')
        vendor.save()
        return Response({'success': True, 'status': 'SUSPENDED'})

    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# VENDOR SHOP CRUD
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def vendor_shops_list(request):
    """List or create vendor's shops"""
    from shops.models import Shop
    from shops.serializers import ShopSerializer

    if request.user.user_type not in ('VENDOR', 'ADMIN'):
        return Response({'error': 'Not a vendor'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        shops = Shop.objects.filter(owner=request.user)
        serializer = ShopSerializer(shops, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        serializer = ShopSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            shop = serializer.save(owner=request.user)
            # Handle logo/cover_photo from FILES
            if 'logo' in request.FILES:
                shop.logo = request.FILES['logo']
            if 'cover_photo' in request.FILES:
                shop.cover_photo = request.FILES['cover_photo']
            if 'logo' in request.FILES or 'cover_photo' in request.FILES:
                shop.save()
            return Response(ShopSerializer(shop, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def vendor_shop_detail(request, pk):
    """Get, update or delete vendor's shop"""
    from shops.models import Shop
    from shops.serializers import ShopSerializer

    try:
        shop = Shop.objects.get(id=pk, owner=request.user)
    except Shop.DoesNotExist:
        return Response({'error': 'Shop not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ShopSerializer(shop, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        data = request.data.copy()
        for field in ['name', 'description', 'contact_email', 'contact_phone',
                       'address', 'city', 'division', 'postal_code']:
            if field in data:
                setattr(shop, field, data[field])
        if 'is_active' in data:
            val = data['is_active']
            shop.is_active = val if isinstance(val, bool) else str(val).lower() in ('true', '1')
        if 'logo' in request.FILES:
            shop.logo = request.FILES['logo']
        if 'cover_photo' in request.FILES:
            shop.cover_photo = request.FILES['cover_photo']
        shop.save()
        serializer = ShopSerializer(shop, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'DELETE':
        if shop.products.exists():
            return Response(
                {'error': 'Cannot delete shop with existing products. Remove products first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        shop.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)


# ── Notifications (admin-only) ─────────────────────────────────────
from rest_framework.pagination import PageNumberPagination

class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    """List notifications for admin. Supports ?is_read=true|false filter."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAdmin]
    pagination_class = NotificationPagination

    def get_queryset(self):
        qs = Notification.objects.select_related('actor').all()
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ('true', '1'))
        return qs


class NotificationUnreadCountView(APIView):
    """Return the count of unread notifications."""
    permission_classes = [IsAdmin]

    def get(self, request):
        count = Notification.objects.filter(is_read=False).count()
        return Response({'unread_count': count})


class NotificationMarkReadView(APIView):
    """Mark one or all notifications as read."""
    permission_classes = [IsAdmin]

    def post(self, request):
        notification_id = request.data.get('id')
        if notification_id:
            Notification.objects.filter(id=notification_id).update(is_read=True)
        else:
            # Mark all as read
            Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'success': True})

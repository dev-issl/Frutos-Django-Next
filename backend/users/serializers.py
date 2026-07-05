# users/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.db import transaction
from .models import User, WholesalerProfile, AffiliateProfile, VendorProfile, VendorTicket, Notification


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that uses email instead of username
    """
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.CharField()
        self.fields['password'] = serializers.CharField(required=False, allow_blank=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['name'] = user.name
        token['user_type'] = user.user_type
        
        return token

    def validate(self, attrs):
        identifier = attrs.get('email')
        password = attrs.get('password')

        if identifier:
            from django.db.models import Q
            user = None
            
            if not password:
                # Passwordless login using staff_id
                staff_query = User.objects.filter(staff_profile__staff_id=identifier, user_type='STAFF')
                if staff_query.exists():
                    user = staff_query.first()
                else:
                    raise serializers.ValidationError('Invalid Staff ID or password required.')
            else:
                resolved_email = identifier
                user_query = User.objects.filter(Q(email=identifier) | Q(staff_profile__staff_id=identifier))
                if user_query.exists():
                    resolved_email = user_query.first().email
                    
                user = authenticate(request=self.context.get('request'), email=resolved_email, password=password)
            
            if not user:
                raise serializers.ValidationError('No active account found with the given credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
        else:
            raise serializers.ValidationError('Must include "email" (or Staff ID).')

        refresh = self.get_token(user)

        # Get wholesaler status if user is a wholesaler
        wholesaler_status = None
        if user.user_type == 'WHOLESALER':
            try:
                if hasattr(user, 'wholesaler_profile'):
                    wholesaler_status = user.wholesaler_profile.approval_status
                else:
                    wholesaler_status = 'PENDING'
            except:
                wholesaler_status = 'PENDING'

        # Get vendor status if user is a vendor
        vendor_status = None
        if user.user_type == 'VENDOR':
            try:
                if hasattr(user, 'vendor_profile'):
                    vendor_status = user.vendor_profile.approval_status
                else:
                    vendor_status = 'PENDING'
            except:
                vendor_status = 'PENDING'
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'user_type': user.user_type,
                'wholesaler_status': wholesaler_status,
                'vendor_status': vendor_status,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat()
            },
            'message': 'Login successful'
        }


class UserRegistrationSerializer(serializers.Serializer):
    """
    Serializer for user registration that accepts frontend field names
    (firstName, lastName, email, password, confirmPassword)
    """
    firstName = serializers.CharField(max_length=150, required=True)
    lastName = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    confirmPassword = serializers.CharField(write_only=True, min_length=8, required=True)

    def validate_email(self, value):
        """Check that the email is not already in use"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(c.isalpha() for c in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        return value

    def validate(self, attrs):
        """Check that the two password fields match"""
        if attrs.get('password') != attrs.get('confirmPassword'):
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        """Create and return a new user instance"""
        firstName = validated_data.get('firstName')
        lastName = validated_data.get('lastName', '')
        email = validated_data.get('email')
        password = validated_data.get('password')
        
        # Combine firstName and lastName into full name
        name = f"{firstName} {lastName}".strip()
        
        # Create user with default CUSTOMER type
        user = User.objects.create_user(
            email=email,
            password=password,
            name=name,
            user_type='CUSTOMER'
        )
        return user


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with name, email, password, and confirm_password
    """
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        style={'input_type': 'password'},
        help_text="Password must be at least 8 characters long"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Enter the same password as before, for verification"
    )

    class Meta:
        model = User
        fields = ('name', 'email', 'password', 'confirm_password')
        extra_kwargs = {
            'email': {
                'help_text': 'Enter a valid email address',
                'error_messages': {
                    'unique': 'A user with this email already exists.',
                }
            },
            'name': {
                'help_text': 'Enter your full name',
                'max_length': 255
            }
        }

    def validate_email(self, value):
        """
        Check that the email is not already in use
        """
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        """
        Check that the password and confirm_password match
        """
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password and confirm_password and password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': "The password fields didn't match."
            })
        
        return attrs

    def create(self, validated_data):
        """
        Create and return a new user instance with hashed password
        Returns user's basic info (id, name, email)
        """
        # Remove confirm_password from validated_data as it's not needed for user creation
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # Create user with hashed password using the custom manager
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def to_representation(self, instance):
        """
        Return user's basic info (id, name, email) after successful registration
        """
        return {
            'id': instance.id,
            'name': instance.name,
            'email': instance.email
        }


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'user_type', 'is_active', 'date_joined', 'profile_image')
        read_only_fields = ('id', 'date_joined')


class WholesalerRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for wholesaler registration that creates both User and WholesalerProfile
    """
    # User fields
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    # WholesalerProfile fields
    business_name = serializers.CharField(max_length=255)
    business_type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    trade_license = serializers.FileField()
    
    class Meta:
        model = User
        fields = ('email', 'name', 'phone', 'password', 'business_name', 'business_type', 'trade_license')
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value
    
    def validate_trade_license(self, value):
        """Validate trade license file upload"""
        if value:
            # Check file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    'Trade license file size cannot exceed 5MB.'
                )
            
            # Check file type (allow common document formats)
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
            file_extension = value.name.split('.')[-1].lower()
            
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f'Invalid file type. Allowed types: {", ".join(allowed_extensions)}'
                )
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create User and WholesalerProfile in a single transaction"""
        # Extract WholesalerProfile data
        business_name = validated_data.pop('business_name')
        business_type = validated_data.pop('business_type', '')
        trade_license = validated_data.pop('trade_license')
        
        # Create User with WHOLESALER type
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            phone=validated_data.get('phone', ''),
            password=validated_data['password'],
            user_type='WHOLESALER'
        )
        
        # Create WholesalerProfile with initial status 'PENDING'
        wholesaler_profile = WholesalerProfile.objects.create(
            user=user,
            business_name=business_name,
            business_type=business_type,
            trade_license=trade_license,
            approval_status='PENDING'
        )
        
        # Add profile to user instance for response
        user.wholesaler_profile = wholesaler_profile
        
        return user
    
    def to_representation(self, instance):
        """Custom representation including profile data"""
        return {
            'id': instance.id,
            'email': instance.email,
            'name': instance.name,
            'phone': instance.phone,
            'user_type': instance.user_type,
            'date_joined': instance.date_joined.isoformat(),
            'wholesaler_profile': {
                'business_name': instance.wholesaler_profile.business_name,
                'business_type': instance.wholesaler_profile.business_type,
                'approval_status': instance.wholesaler_profile.approval_status,
                'created_at': instance.wholesaler_profile.created_at.isoformat(),
            }
        }


# ============================================================================
# VENDOR SERIALIZERS
# ============================================================================

class VendorRegistrationSerializer(serializers.Serializer):
    """Serializer for vendor registration - creates User + VendorProfile"""
    # Personal
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)
    alt_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # Address
    address_line = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    division = serializers.ChoiceField(choices=VendorProfile.DIVISION_CHOICES)
    postal_code = serializers.CharField(max_length=10, required=False, allow_blank=True)

    # Business
    business_name = serializers.CharField(max_length=255)
    business_type = serializers.ChoiceField(choices=VendorProfile.BUSINESS_TYPE_CHOICES, default='sole_proprietorship')
    business_description = serializers.CharField(required=False, allow_blank=True)
    business_domain = serializers.URLField(required=False, allow_blank=True)
    business_logo = serializers.ImageField(required=True)
    business_banner = serializers.ImageField(required=False)

    # Documents
    trade_license = serializers.FileField()
    trade_license_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tin_certificate = serializers.FileField(required=False)
    tin_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    nid_front = serializers.FileField()
    nid_back = serializers.FileField()
    nid_number = serializers.CharField(max_length=20)
    bin_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    bank_statement = serializers.FileField(required=False)

    # Bank info
    bank_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bank_account_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bank_account_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    bank_branch = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bank_routing_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    mobile_banking_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_trade_license(self, value):
        if value and value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Trade license file size cannot exceed 10MB.')
        return value

    def validate_nid_front(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('NID front image cannot exceed 5MB.')
        return value

    def validate_nid_back(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('NID back image cannot exceed 5MB.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        # Extract user fields
        user_fields = {
            'email': validated_data['email'],
            'name': validated_data['name'],
            'phone': validated_data.get('phone', ''),
            'password': validated_data['password'],
            'user_type': 'VENDOR',
        }
        user = User.objects.create_user(**user_fields)

        # Extract vendor profile fields (everything except user fields)
        profile_fields = {k: v for k, v in validated_data.items()
                          if k not in ('email', 'name', 'password')}
        profile = VendorProfile.objects.create(user=user, **profile_fields)

        # Attach profile for response
        user._vendor_profile = profile
        return user

    def to_representation(self, instance):
        profile = instance._vendor_profile if hasattr(instance, '_vendor_profile') else instance.vendor_profile
        return {
            'id': instance.id,
            'email': instance.email,
            'name': instance.name,
            'phone': instance.phone,
            'user_type': instance.user_type,
            'date_joined': instance.date_joined.isoformat(),
            'vendor_profile': {
                'business_name': profile.business_name,
                'business_type': profile.business_type,
                'approval_status': profile.approval_status,
                'division': profile.division,
                'city': profile.city,
                'created_at': profile.created_at.isoformat(),
            }
        }


class VendorProfileSerializer(serializers.ModelSerializer):
    """Read serializer for vendor profile (public-facing data)"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    shops = serializers.SerializerMethodField()

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'user_name', 'user_email', 'phone', 'alt_phone',
            'address_line', 'city', 'division', 'postal_code',
            'business_name', 'business_type', 'business_description',
            'business_domain', 'logo_url', 'banner_url',
            'approval_status', 'created_at', 'product_count',
            'bank_name', 'bank_account_name', 'bank_account_number',
            'bank_branch', 'bank_routing_number', 'mobile_banking_number',
            'trade_license_number', 'tin_number', 'nid_number', 'bin_number',
            'shops',
        ]

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.business_logo and hasattr(obj.business_logo, 'url'):
            if request:
                return request.build_absolute_uri(obj.business_logo.url)
            return obj.business_logo.url
        return None

    def get_banner_url(self, obj):
        request = self.context.get('request')
        if obj.business_banner and hasattr(obj.business_banner, 'url'):
            if request:
                return request.build_absolute_uri(obj.business_banner.url)
            return obj.business_banner.url
        return None

    def get_product_count(self, obj):
        try:
            return sum(
                shop.products.filter(is_active=True).count()
                for shop in obj.user.shops.all()
            )
        except Exception:
            return 0

    def get_shops(self, obj):
        try:
            from shops.serializers import ShopSerializer
            shops = obj.user.shops.all()
            return ShopSerializer(shops, many=True, context=self.context).data
        except Exception:
            return []


class VendorProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for vendors to update their own profile"""
    name = serializers.CharField(source='user.name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    business_logo = serializers.ImageField(required=False)
    business_banner = serializers.ImageField(required=False)

    class Meta:
        model = VendorProfile
        fields = [
            'name', 'email', 'phone', 'alt_phone',
            'address_line', 'city', 'division', 'postal_code',
            'business_name', 'business_type', 'business_description', 'business_domain',
            'business_logo', 'business_banner',
            'bank_name', 'bank_account_name', 'bank_account_number',
            'bank_branch', 'bank_routing_number', 'mobile_banking_number',
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if 'name' in user_data:
            instance.user.name = user_data['name']
        if 'email' in user_data:
            instance.user.email = user_data['email']
        instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class VendorTicketSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.name', read_only=True, default=None)

    class Meta:
        model = VendorTicket
        fields = [
            'id', 'vendor_name', 'subject', 'description', 'category',
            'priority', 'status', 'admin_response', 'responded_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'admin_response', 'responded_by_name', 'created_at', 'updated_at']


class VendorTicketAdminSerializer(serializers.ModelSerializer):
    """Admin serializer that allows responding to tickets"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    vendor_email = serializers.CharField(source='vendor.email', read_only=True)

    class Meta:
        model = VendorTicket
        fields = [
            'id', 'vendor_name', 'vendor_email', 'subject', 'description',
            'category', 'priority', 'status', 'admin_response', 'responded_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'vendor_name', 'vendor_email', 'subject', 'description', 'category', 'priority', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'actor_name', 'icon', 'is_read', 'created_at']
        read_only_fields = ['id', 'type', 'title', 'message', 'actor_name', 'icon', 'created_at']

    def get_actor_name(self, obj):
        return obj.actor.name if obj.actor else None

    def get_icon(self, obj):
        if obj.type == 'DAY_OFF_REQUEST':
            return 'calendar_month'
        elif obj.type == 'TICKET_CREATED':
            return 'support_agent'
        elif obj.type == 'ORDER_PLACED':
            return 'shopping_cart'
        return 'notifications'

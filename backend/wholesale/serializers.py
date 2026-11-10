# wholesale/serializers.py
import re

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import WholesaleUser, WholesaleNotification


class WholesaleRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    cif = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100
    )
    trade_license_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100
    )
    store = serializers.PrimaryKeyRelatedField(
        queryset=__import__('stores.models', fromlist=['Store']).Store.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    class Meta:
        model = WholesaleUser
        fields = (
            'email', 'password',
            'business_name', 'contact_name',
            'cif', 'trade_license_number',
            'phone', 'postcode',
            'business_type', 'monthly_volume', 'user_type',
            'store',
        )

    def validate_email(self, value):
        if WholesaleUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'A wholesale account with this email already exists.'
            )
        return value.lower()

    def validate(self, attrs):
        cif_val = (attrs.get('cif') or attrs.get('trade_license_number') or '').strip()
        if not cif_val:
            raise serializers.ValidationError({'cif': 'CIF is required.'})
        clean_cif = re.sub(r'[\s\-]', '', cif_val).upper()
        if len(clean_cif) < 4:
            raise serializers.ValidationError({'cif': 'Enter a valid CIF number (e.g. B12345678).'})
        if not re.match(r'^[A-Za-z0-9\-\/\s]+$', cif_val):
            raise serializers.ValidationError({'cif': 'CIF may only contain letters, numbers, spaces, or hyphens.'})
        attrs['cif'] = clean_cif
        attrs['trade_license_number'] = clean_cif
        return attrs

    def validate_phone(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Enter a valid phone number.')
        if not re.match(r'^\+?[0-9\s\-()]{7,25}$', value):
            raise serializers.ValidationError('Enter a valid phone number.')
        return value

    def create(self, validated_data):
        # Force all frontend signups to be External Wholesale
        validated_data['user_type'] = 'RESTAURANT'
        if not validated_data.get('store'):
            from stores.models import Store
            default_store = Store.objects.filter(is_active=True).first()
            if default_store:
                validated_data['store'] = default_store
        password = validated_data.pop('password')
        user = WholesaleUser(**validated_data)
        user.set_password(password)
        user.save()
        
        from accounts.notifications import send_admin_notification
        send_admin_notification(
            notification_type='wholesale_pending',
            title='New Wholesale Application',
            message=f'Business "{user.business_name}" applied for a wholesale account and is pending approval.',
            metadata={'wholesaleUserId': str(user.id), 'email': user.email, 'icon': 'storefront'}
        )
        
        return user


class WholesaleLoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=False, allow_blank=True)
    wholesale_id = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    login_type = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        from django.db.models import Q
        login_val = (attrs.get('wholesale_id') or attrs.get('email') or '').strip()
        password = attrs.get('password')
        login_type = (attrs.get('login_type') or '').strip().lower()

        if not login_val:
            raise serializers.ValidationError('Email or Wholesale ID is required.')

        # If login_type is 'wholesale_id' or wholesale_id field is supplied or no password supplied:
        is_id_only_login = (login_type == 'wholesale_id') or bool(attrs.get('wholesale_id')) or not password

        if is_id_only_login:
            user = WholesaleUser.objects.filter(
                wholesale_id__iexact=login_val
            ).first()

            if not user:
                raise serializers.ValidationError('Wholesale ID not found or not assigned yet. Please contact your administrator.')

            if not user.is_active:
                raise serializers.ValidationError('This account has been deactivated.')

            if user.status != 'approved':
                raise serializers.ValidationError('Your wholesale application is pending review. Please wait for admin approval.')

            attrs['user'] = user
            return attrs

        # Email/ID + password login:
        user = WholesaleUser.objects.filter(
            Q(email__iexact=login_val) | Q(wholesale_id__iexact=login_val)
        ).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError('Invalid email/Wholesale ID or password.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        if user.status != 'approved':
            raise serializers.ValidationError('Your wholesale application is pending review. Please wait for admin approval.')

        attrs['user'] = user
        return attrs


class WholesaleUserPublicSerializer(serializers.ModelSerializer):
    """Safe public fields returned in JWT payload / profile responses."""
    is_approved = serializers.BooleanField(read_only=True)
    display_business_type = serializers.CharField(read_only=True)
    display_volume = serializers.CharField(read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    store_name = serializers.CharField(source='store.name', read_only=True, default=None)
    store_code = serializers.CharField(source='store.store_code', read_only=True, default=None)

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if obj.profile_image:
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url
        return None

    class Meta:
        model = WholesaleUser
        fields = (
            'id', 'email', 'wholesale_id', 'user_type',
            'business_name', 'contact_name',
            'cif', 'trade_license_number',
            'store', 'store_id', 'store_name', 'store_code',
            'phone', 'postcode',
            'business_type', 'display_business_type',
            'monthly_volume', 'display_volume',
            'status', 'is_approved',
            'applied_at', 'approved_at',
            'account_manager_name', 'account_manager_email',
            'total_orders', 'total_spent',
            'profile_image_url',
        )
        read_only_fields = (
            'id', 'wholesale_id', 'user_type', 'status', 'is_approved', 'applied_at', 'approved_at',
            'account_manager_name', 'account_manager_email',
            'total_orders', 'total_spent', 'store_name', 'store_code',
        )


class WholesaleProfileUpdateSerializer(serializers.ModelSerializer):
    store = serializers.PrimaryKeyRelatedField(
        queryset=__import__('stores.models', fromlist=['Store']).Store.objects.filter(is_active=True),
        required=False,
        allow_null=True
    )

    class Meta:
        model = WholesaleUser
        fields = ('contact_name', 'phone', 'postcode', 'monthly_volume', 'cif', 'store')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password]
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class WholesaleNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WholesaleNotification
        fields = ('id', 'type', 'title', 'message', 'is_read', 'metadata', 'created_at')
        read_only_fields = ('id', 'type', 'title', 'message', 'metadata', 'created_at')


from .models import WholesaleDailyReport

class WholesaleDailyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = WholesaleDailyReport
        fields = (
            'id', 'cash', 'bank', 'expenses', 'store', 
            'purchase', 'purchase_note', 'date', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


# wholesale content

from rest_framework import serializers
from .models import WholesalePageContent

class WholesalePageContentSerializer(serializers.ModelSerializer):
    hero_image_url_final = serializers.SerializerMethodField()

    class Meta:
        model = WholesalePageContent
        fields = [
            'id',
            'hero_section',
            'hero_image',
            'hero_image_url_final',
            'stats',
            'benefits',
            'categories',
            'steps',
            'guarantee'
        ]
        read_only_fields = ['id', 'hero_image_url_final']

    def get_hero_image_url_final(self, obj):
        request = self.context.get('request')
        if obj.hero_image:
            url = obj.hero_image.url
            return request.build_absolute_uri(url) if request else url
        return None
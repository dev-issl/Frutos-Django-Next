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


    class Meta:
        model = WholesaleUser
        fields = (
            'email', 'password',
            'business_name', 'contact_name',
            'trade_license_number',
            'phone', 'postcode',
            'business_type', 'monthly_volume',
        )

    def validate_email(self, value):
        if WholesaleUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'A wholesale account with this email already exists.'
            )
        return value.lower()

    def validate_trade_license_number(self, value):
        value = value.strip()
        if len(value) < 4:
            raise serializers.ValidationError('Enter a valid trade license number.')
        if not re.match(r'^[A-Za-z0-9\-\/\s]+$', value):
            raise serializers.ValidationError('Trade license may only contain letters, numbers, spaces, hyphens, or slashes.')
        return value

    def validate_phone(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Enter a valid phone number.')
        if not re.match(r'^\+?[0-9\s\-()]{7,25}$', value):
            raise serializers.ValidationError('Enter a valid phone number.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = WholesaleUser(**validated_data)
        user.set_password(password)
        user.save()
        
        from accounts.notifications import send_admin_notification
        send_admin_notification(
            notification_type='wholesale_pending',
            title='New Wholesale Application 📝',
            message=f'Business "{user.business_name}" applied for a wholesale account and is pending approval.',
            metadata={'wholesaleUserId': user.id, 'email': user.email, 'icon': 'storefront'}
        )
        
        return user


class WholesaleLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs.get('email', '').lower()
        password = attrs.get('password')

        try:
            user = WholesaleUser.objects.get(email=email)
        except WholesaleUser.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        attrs['user'] = user
        return attrs


class WholesaleUserPublicSerializer(serializers.ModelSerializer):
    """Safe public fields returned in JWT payload / profile responses."""
    is_approved = serializers.BooleanField(read_only=True)
    display_business_type = serializers.CharField(read_only=True)
    display_volume = serializers.CharField(read_only=True)
    profile_image_url = serializers.SerializerMethodField()


    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if obj.profile_image:
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url
        return None


    class Meta:
        model = WholesaleUser
        fields = (
            'id', 'email',
            'business_name', 'contact_name',
            'trade_license_number',
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
            'id', 'status', 'is_approved', 'applied_at', 'approved_at',
            'account_manager_name', 'account_manager_email',
            'total_orders', 'total_spent',
        )


class WholesaleProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WholesaleUser
        fields = ('contact_name', 'phone', 'postcode', 'monthly_volume')


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
        fields = ('id', 'type', 'title', 'message', 'is_read', 'created_at')
        read_only_fields = ('id', 'type', 'title', 'message', 'created_at')




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
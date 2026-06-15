from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile, Address, Notification

User = get_user_model()


# ─── JWT — custom claims ──────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Accept {email, password} instead of {username, password}.
    Look up the user by email, then delegate to the parent validator.
    """

    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Swap username field for email
        self.fields['email'] = serializers.EmailField()
        self.fields.pop('username', None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name']      = getattr(user, 'full_name', None) or getattr(user, 'name', None) or user.email
        token['email']     = user.email
        token['username']  = user.email
        token['user_type'] = getattr(user, 'user_type', 'CUSTOMER')
        try:
            token['avatar'] = user.profile.resolved_avatar
        except UserProfile.DoesNotExist:
            token['avatar'] = ''
        return token

    def validate(self, attrs):
        email    = attrs.pop('email', '').strip().lower()
        password = attrs.get('password', '')

        # Look up user by email
        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {'detail': 'No active account found with the given credentials.'}
            )

        # Hand off to parent using the email username field
        attrs[self.username_field] = email
        data = super().validate(attrs)

        # Attach full user object to response body
        data['user'] = UserReadSerializer(self.user, context=self.context).data
        return data


# ─── Register ─────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password        = serializers.CharField(write_only=True, validators=[validate_password])
    confirmPassword = serializers.CharField(write_only=True)
    firstName       = serializers.CharField(source='first_name', required=False, default='')
    lastName        = serializers.CharField(source='last_name',  required=False, default='')

    class Meta:
        model  = User
        fields = ['email', 'firstName', 'lastName', 'password', 'confirmPassword']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirmPassword'):
            raise serializers.ValidationError({'confirmPassword': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        email      = validated_data['email']
        password   = validated_data['password']
        first_name = validated_data.get('first_name', '')
        last_name  = validated_data.get('last_name', '')
        name = ' '.join([first_name, last_name]).strip()
        if not name:
            name = email.split('@')[0]

        user = User.objects.create_user(
            email=email,
            password=password,
            name=name,
        )
        return user


# ─── User — read ──────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    resolvedAvatar    = serializers.SerializerMethodField()

    def get_resolvedAvatar(self, obj):
        request = self.context.get('request')
        url = obj.resolved_avatar
        if url and request and not url.startswith('http'):
            return request.build_absolute_uri(url)
        return url
    notifOrderUpdates = serializers.BooleanField(source='notif_order_updates')
    notifPromotions   = serializers.BooleanField(source='notif_promotions')
    notifPriceChanges = serializers.BooleanField(source='notif_price_changes')
    notifLeftoverPacks= serializers.BooleanField(source='notif_leftover_packs')

    class Meta:
        model  = UserProfile
        fields = [
            'resolvedAvatar', 'phone', 'bio',
            'notifOrderUpdates', 'notifPromotions',
            'notifPriceChanges', 'notifLeftoverPacks',
        ]


class UserReadSerializer(serializers.ModelSerializer):
    profile   = UserProfileSerializer(read_only=True)
    fullName  = serializers.SerializerMethodField()
    firstName = serializers.SerializerMethodField()
    lastName  = serializers.SerializerMethodField()
    username  = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'firstName', 'lastName', 'fullName', 'profile']

    def get_fullName(self, obj):
        return getattr(obj, 'full_name', None) or getattr(obj, 'name', None) or obj.email

    def get_firstName(self, obj):
        name = getattr(obj, 'name', '') or ''
        return name.split(' ', 1)[0] if name else ''

    def get_lastName(self, obj):
        name = getattr(obj, 'name', '') or ''
        return name.split(' ', 1)[1] if ' ' in name else ''

    def get_username(self, obj):
        return obj.email


# ─── Profile update ───────────────────────────────────────────────────────────

class ProfileUpdateSerializer(serializers.Serializer):
    firstName = serializers.CharField(required=False, allow_blank=True)
    lastName  = serializers.CharField(required=False, allow_blank=True)
    phone     = serializers.CharField(required=False, allow_blank=True)
    bio       = serializers.CharField(required=False, allow_blank=True)
    notifOrderUpdates  = serializers.BooleanField(required=False)
    notifPromotions    = serializers.BooleanField(required=False)
    notifPriceChanges  = serializers.BooleanField(required=False)
    notifLeftoverPacks = serializers.BooleanField(required=False)

    def update(self, user, validated_data):
        if 'firstName' in validated_data or 'lastName' in validated_data:
            current_name = getattr(user, 'name', '') or ''
            parts = current_name.split(' ', 1)
            current_first = parts[0] if parts else ''
            current_last = parts[1] if len(parts) > 1 else ''
            
            first_name = validated_data.get('firstName', current_first)
            last_name  = validated_data.get('lastName', current_last)
            
            user.name = f"{first_name} {last_name}".strip()
            user.save(update_fields=['name'])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile_fields = []   # ← শুধু changed fields track করো

        if 'phone' in validated_data:
            profile.phone = validated_data['phone']
            profile_fields.append('phone')
        if 'bio' in validated_data:
            profile.bio = validated_data['bio']
            profile_fields.append('bio')
        if 'notifOrderUpdates' in validated_data:
            profile.notif_order_updates = validated_data['notifOrderUpdates']
            profile_fields.append('notif_order_updates')
        if 'notifPromotions' in validated_data:
            profile.notif_promotions = validated_data['notifPromotions']
            profile_fields.append('notif_promotions')
        if 'notifPriceChanges' in validated_data:
            profile.notif_price_changes = validated_data['notifPriceChanges']
            profile_fields.append('notif_price_changes')
        if 'notifLeftoverPacks' in validated_data:
            profile.notif_leftover_packs = validated_data['notifLeftoverPacks']
            profile_fields.append('notif_leftover_packs')

        if profile_fields:
            profile.save(update_fields=profile_fields)  # ← avatar কখনো touch হবে না

        return user


class AvatarUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['avatar']


# ─── Address ──────────────────────────────────────────────────────────────────

class AddressSerializer(serializers.ModelSerializer):
    isDefault = serializers.BooleanField(source='is_default', required=False, default=False)

    class Meta:
        model  = Address
        fields = ['id', 'label', 'street', 'city', 'postcode', 'country', 'phone', 'isDefault', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    isRead = serializers.BooleanField(source='is_read')
    icon   = serializers.CharField(read_only=True)

    class Meta:
        model  = Notification
        fields = ['id', 'type', 'title', 'message', 'isRead', 'icon', 'metadata', 'created_at']


# ─── Change Password ──────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    oldPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_oldPassword(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['newPassword'])
        user.save()
        return user


# ─── Support Ticket ───────────────────────────────────────────────────────────

from .models import SupportTicket, SupportTicketImage, SupportTicketMessage, SupportTicketMessageAttachment

class SupportTicketImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicketImage
        fields = ['id', 'image', 'created_at']

class SupportTicketMessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicketMessageAttachment
        fields = ['id', 'file', 'created_at']

class SupportTicketMessageSerializer(serializers.ModelSerializer):
    senderName = serializers.CharField(source='sender.name', read_only=True)
    senderEmail = serializers.CharField(source='sender.email', read_only=True)
    isAdmin = serializers.SerializerMethodField()
    attachments = SupportTicketMessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicketMessage
        fields = ['id', 'senderName', 'senderEmail', 'isAdmin', 'message', 'attachments', 'is_edited', 'is_deleted', 'created_at']
        
    def get_isAdmin(self, obj):
        return obj.sender.is_staff or obj.sender.is_superuser

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('is_deleted'):
            ret['message'] = ''
            ret['attachments'] = []
        return ret


from django.utils import timezone

class SupportTicketSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source='user.name', read_only=True)
    userEmail = serializers.CharField(source='user.email', read_only=True)
    images = SupportTicketImageSerializer(many=True, read_only=True)
    messages = SupportTicketMessageSerializer(many=True, read_only=True)
    is_user_typing = serializers.SerializerMethodField()
    is_admin_typing = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'subject', 'description', 'images', 'messages', 'category', 'priority',
            'status', 'admin_response', 'created_at', 'updated_at',
            'userName', 'userEmail', 'is_user_typing', 'is_admin_typing'
        ]
        read_only_fields = ['id', 'status', 'admin_response', 'created_at', 'updated_at']

    def get_is_user_typing(self, obj):
        if not obj.user_typing_at: return False
        return (timezone.now() - obj.user_typing_at).total_seconds() < 3

    def get_is_admin_typing(self, obj):
        if not obj.admin_typing_at: return False
        return (timezone.now() - obj.admin_typing_at).total_seconds() < 3

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        ticket = super().create(validated_data)
        
        # Handle multiple images
        request = self.context.get('request')
        if request and request.FILES:
            images = request.FILES.getlist('images')
            for image in images:
                SupportTicketImage.objects.create(ticket=ticket, image=image)
                
        return ticket


class AdminSupportTicketSerializer(SupportTicketSerializer):
    class Meta(SupportTicketSerializer.Meta):
        read_only_fields = ['id', 'created_at', 'updated_at']
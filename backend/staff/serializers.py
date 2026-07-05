from rest_framework import serializers
from .models import StaffProfile, StaffShift, StaffTask, StaffNotification, Announcement, DayOffRequest
from stores.models import Store
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'user_type', 'is_active', 'phone']

class StaffProfileSerializer(serializers.ModelSerializer):
    user = StaffUserSerializer(read_only=True)
    store_slug = serializers.CharField(source='store.slug', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'staff_id', 'role', 'phone', 'hire_date', 'created_at',
                  'can_create_orders', 'can_update_orders', 'can_delete_orders', 'can_create_products', 'can_update_products', 'can_delete_products', 'secret_key', 'photo', 'store_slug', 'store_name']

class StaffShiftSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_location = serializers.CharField(source='store.address', read_only=True)
    store_map_link = serializers.CharField(source='store.map_link', read_only=True)

    class Meta:
        model = StaffShift
        fields = '__all__'

class StaffTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffTask
        fields = '__all__'

class StaffNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffNotification
        fields = '__all__'

class DayOffRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DayOffRequest
        fields = '__all__'
        read_only_fields = ('staff',)

class CreateStaffSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.CharField(max_length=100)
    staff_id = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_staff_id(self, value):
        if value and StaffProfile.objects.filter(staff_id=value).exists():
            raise serializers.ValidationError("A staff member with this Staff ID already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.get('password', '')
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
            user_type='STAFF',
            is_staff=False
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        
        staff_id = validated_data.get('staff_id')
        
        staff_profile = StaffProfile.objects.create(
            user=user,
            role=validated_data['role'],
            staff_id=staff_id if staff_id else None,
            phone=validated_data.get('phone', ''),
            secret_key=password,
            photo=validated_data.get('photo')
        )
        return staff_profile

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    target_stores_names = serializers.SerializerMethodField()
    target_staff_names = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'message', 'created_by', 'created_by_name', 'target_all_stores', 'target_stores', 'target_staff', 'created_at', 'target_stores_names', 'target_staff_names']

    def get_target_stores_names(self, obj):
        return [s.name for s in obj.target_stores.all()]

    def get_target_staff_names(self, obj):
        return [s.user.name for s in obj.target_staff.all()]

class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['title', 'message', 'target_all_stores', 'target_stores', 'target_staff']

class StoreStaffTreeSerializer(serializers.ModelSerializer):
    staff_list = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'name', 'staff_list']

    def get_staff_list(self, obj):
        staff = obj.staff.all()
        return [{'id': s.id, 'name': s.user.name, 'role': s.role, 'photo': s.photo.url if s.photo else None} for s in staff]

class MyStaffProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.name', required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    class Meta:
        model = StaffProfile
        fields = ['name', 'phone', 'photo', 'password']
        
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        password = validated_data.pop('password', None)
        
        # Update User model if name provided
        if 'name' in user_data:
            instance.user.name = user_data['name']
            instance.user.save()
            
        # Update Password if provided
        if password:
            instance.user.set_password(password)
            instance.user.save()
            instance.secret_key = password # Update plain text view for admin (if required based on previous code)
            
        return super().update(instance, validated_data)

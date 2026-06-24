from rest_framework import serializers
from .models import StaffProfile, StaffShift, StaffTask, StaffNotification
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
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), source='store', write_only=True, required=False, allow_null=True
    )
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_address = serializers.CharField(source='store.address', read_only=True)
    store_map_link = serializers.CharField(source='store.map_link', read_only=True)
    
    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'role', 'store_id', 'store_name', 'store_address', 'store_map_link', 'phone', 'hire_date', 'created_at',
                  'can_create_orders', 'can_update_orders', 'can_delete_orders', 'can_create_products', 'can_update_products', 'can_delete_products', 'secret_key', 'photo']

class StaffShiftSerializer(serializers.ModelSerializer):
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

class CreateStaffSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.CharField(max_length=100)
    store_id = serializers.IntegerField(required=False, allow_null=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data['password']
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=password,
            user_type='STAFF',
            is_staff=False
        )
        
        store_id = validated_data.get('store_id')
        store = Store.objects.filter(id=store_id).first() if store_id else None
        
        staff_profile = StaffProfile.objects.create(
            user=user,
            role=validated_data['role'],
            store=store,
            phone=validated_data.get('phone', ''),
            secret_key=password,
            photo=validated_data.get('photo')
        )
        return staff_profile

from rest_framework import serializers
from .models import StaffProfile, StaffShift, StaffTask, StaffNotification
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class StaffUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'user_type', 'is_active', 'phone']

class StaffProfileSerializer(serializers.ModelSerializer):
    user = StaffUserSerializer(read_only=True)
    
    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'role', 'branch_location', 'phone', 'hire_date', 'created_at']

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
    branch_location = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            user_type='STAFF',
            is_staff=False
        )
        
        staff_profile = StaffProfile.objects.create(
            user=user,
            role=validated_data['role'],
            branch_location=validated_data.get('branch_location', ''),
            phone=validated_data.get('phone', '')
        )
        return staff_profile

# backend/employee_api/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser # UPDATED

class UserRegistrationSerializer(serializers.ModelSerializer): # Renamed
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, default='patient') # Ensure role is handled
    
    class Meta:
        model = CustomUser # UPDATED
        fields = ['username', 'email', 'password', 'password_confirm', 
                'first_name', 'last_name', 'role'] # REMOVED department
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user( # UPDATED
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            # department=validated_data.get('department', ''), # REMOVED
            role=validated_data.get('role', 'patient') # Ensure role is set
        )
        return user

class UserSerializer(serializers.ModelSerializer): # Renamed
    class Meta:
        model = CustomUser # UPDATED
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active'] # REMOVED department

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, required=True) # UPDATED choices (already dynamic)

    def validate(self, attrs):
        return super().validate(attrs)
# backend/employee_api/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, PatientProfile, DoctorProfile, Appointment

# --- NEW SERIALIZERS ---

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['age', 'medical_history', 'current_symptoms', 'health_issue_category']

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['specialization', 'years_of_experience', 'educational_background', 'credentials']

# --- UPDATED/EXISTING SERIALIZERS ---

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, default='patient')

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password_confirm',
                'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    # Nest profile serializers to include profile data with user data
    patient_profile = PatientProfileSerializer(read_only=True)
    doctor_profile = DoctorProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                'is_staff', 'is_active', 'patient_profile', 'doctor_profile']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, required=True)

    def validate(self, attrs):
        return super().validate(attrs)

# --- NEW SERIALIZERS for Appointments and Doctor Listing ---

class DoctorListSerializer(serializers.ModelSerializer):
    """Serializer specifically for listing doctors for patients."""
    doctor_profile = DoctorProfileSerializer(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'doctor_profile']

class AppointmentSerializer(serializers.ModelSerializer):
    # Use UserSerializer to show details about the patient and doctor
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'doctor_id', 'created_at', 'status']
    
    def create(self, validated_data):
        patient_user = self.context['request'].user
        doctor_id = validated_data.pop('doctor_id')
        try:
            doctor_user = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Doctor not found.")
        
        appointment = Appointment.objects.create(patient=patient_user, doctor=doctor_user, **validated_data)
        return appointment
# backend/employee_api/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, PatientProfile, DoctorProfile, Appointment, MedicalRecord
import json

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['age', 'medical_history', 'current_symptoms', 'health_issue_category']

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['specialization', 'years_of_experience', 'educational_background', 'credentials']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, default='patient')

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    patient_profile = PatientProfileSerializer(read_only=True)
    doctor_profile = DoctorProfileSerializer(read_only=True)
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active', 'patient_profile', 'doctor_profile']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, required=True)

class DoctorListSerializer(serializers.ModelSerializer):
    doctor_profile = DoctorProfileSerializer(read_only=True)
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'doctor_profile']

# --- NEW MedicalRecordSerializer ---
class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['tablets', 'syrups', 'injections', 'ointments', 'report_file', 'created_at']

# --- UPDATED AppointmentSerializer ---
class AppointmentSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)
    medical_record = MedicalRecordSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor', 'doctor_id', 'appointment_date', 'time_slot', 
            'created_at', 'status', 'initial_report', 'suggestion_message', 
            'suggestion_date', 'medical_record'
        ]
        read_only_fields = ['status'] # Status is managed by dedicated views
        validators = [] # Manual validation in the view

    def create(self, validated_data):
        patient_user = self.context['request'].user
        doctor_id = validated_data.pop('doctor_id')
        try:
            doctor_user = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Doctor not found.")
        
        # Manually handle unique_together validation
        if Appointment.objects.filter(
            patient=patient_user,
            doctor=doctor_user,
            appointment_date=validated_data['appointment_date'],
            time_slot=validated_data['time_slot']
        ).exists():
            raise serializers.ValidationError("You have already booked or requested this exact time slot.")

        appointment = Appointment.objects.create(patient=patient_user, doctor=doctor_user, **validated_data)
        return appointment

# --- NEW Serializer for Doctor's Treatment Form ---
class TreatmentFormSerializer(serializers.ModelSerializer):
    # These fields expect JSON strings from FormData
    tablets = serializers.CharField(required=False, allow_blank=True)
    syrups = serializers.CharField(required=False, allow_blank=True)
    injections = serializers.CharField(required=False, allow_blank=True)
    ointments = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = MedicalRecord
        fields = ['tablets', 'syrups', 'injections', 'ointments', 'report_file']

    def validate_json_string(self, value):
        try:
            # Frontend sends an array of objects, we convert to a dictionary of name:quantity
            items_list = json.loads(value)
            if not isinstance(items_list, list):
                raise serializers.ValidationError("Expected a list of items.")
            
            # Convert [{name: 'A', quantity: '1'}, ...] to {'A': 1, ...}
            items_dict = {item['name']: int(item['quantity']) for item in items_list if item.get('name') and item.get('quantity')}
            return items_dict
        except (json.JSONDecodeError, ValueError, TypeError, KeyError):
            raise serializers.ValidationError("Invalid format for prescribed items.")

    def validate_tablets(self, value):
        return self.validate_json_string(value) if value else {}

    def validate_syrups(self, value):
        return self.validate_json_string(value) if value else {}

    def validate_injections(self, value):
        return self.validate_json_string(value) if value else {}
    
    def validate_ointments(self, value):
        return self.validate_json_string(value) if value else {}
# --- UPDATED FILE: backend/employee_api/serializers.py ---

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    CustomUser, PatientProfile, DoctorProfile, Appointment, 
    MedicalRecord, DiagnosticTest, MedicationBill
)
import json

# ... (PatientProfileSerializer, DoctorProfileSerializer, UserRegistrationSerializer, UserSerializer, LoginSerializer, DoctorListSerializer remain unchanged) ...
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

# --- UPDATED MedicalRecordSerializer ---
class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['medication_details', 'prescribed_tests', 'created_at']

# --- NEW DiagnosticTestSerializer ---
class DiagnosticTestSerializer(serializers.ModelSerializer):
    appointment_details = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticTest
        fields = ['id', 'appointment', 'patient', 'doctor', 'test_name', 'cost', 'result', 'is_sent_to_patient', 'is_paid', 'created_at', 'appointment_details']
        read_only_fields = ['patient', 'doctor', 'appointment']

    def get_appointment_details(self, obj):
        # Provide context for the frontend
        return {
            'id': obj.appointment.id,
            'date': obj.appointment.appointment_date,
            'patient_name': obj.patient.get_full_name() or obj.patient.username
        }
        
# --- NEW MedicationBillSerializer ---
class MedicationBillSerializer(serializers.ModelSerializer):
    appointment_details = serializers.SerializerMethodField()
    medication_details = serializers.SerializerMethodField()

    class Meta:
        model = MedicationBill
        fields = ['id', 'appointment', 'patient', 'doctor', 'total_cost', 'is_sent_to_patient', 'is_paid', 'created_at', 'appointment_details', 'medication_details']
        read_only_fields = ['patient', 'doctor', 'appointment', 'medication_details']

    def get_appointment_details(self, obj):
        return {
            'id': obj.appointment.id,
            'date': obj.appointment.appointment_date,
            'patient_name': obj.patient.get_full_name() or obj.patient.username
        }
        
    def get_medication_details(self, obj):
        # Get medication details from the related medical record
        return obj.appointment.medical_record.medication_details if hasattr(obj.appointment, 'medical_record') else {}

class AppointmentSerializer(serializers.ModelSerializer):
    patient = UserSerializer(read_only=True)
    doctor = UserSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)
    medical_record = MedicalRecordSerializer(read_only=True)
    # --- NEW ---
    diagnostic_tests = DiagnosticTestSerializer(many=True, read_only=True)
    medication_bill = MedicationBillSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor', 'doctor_id', 'appointment_date', 'time_slot', 
            'created_at', 'status', 'initial_report', 'suggestion_message', 
            'suggestion_date', 'medical_record', 'diagnostic_tests', 'medication_bill' # Added new fields
        ]
        read_only_fields = ['status']
        validators = []

    def create(self, validated_data):
        # ... (create method logic remains the same)
        patient_user = self.context['request'].user
        doctor_id = validated_data.pop('doctor_id')
        try:
            doctor_user = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Doctor not found.")
        
        if Appointment.objects.filter(patient=patient_user, doctor=doctor_user, appointment_date=validated_data['appointment_date'], time_slot=validated_data['time_slot']).exists():
            raise serializers.ValidationError("You have already booked or requested this exact time slot.")
        appointment = Appointment.objects.create(patient=patient_user, doctor=doctor_user, **validated_data)
        return appointment

# --- HEAVILY UPDATED Serializer for Doctor's Treatment Form ---
class TreatmentFormSerializer(serializers.Serializer):
    # Expects JSON strings from FormData
    medication_details = serializers.CharField(required=False, allow_blank=True)
    prescribed_tests = serializers.CharField(required=False, allow_blank=True)

    def validate_medication_details(self, value):
        if not value:
            return {}
        try:
            data = json.loads(value)
            if not isinstance(data, dict):
                raise serializers.ValidationError("Medication details should be an object.")
            # Further validation can be added here (e.g., check structure)
            return data
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for medication details.")

    def validate_prescribed_tests(self, value):
        if not value:
            return []
        try:
            data = json.loads(value)
            if not isinstance(data, list) or not all(isinstance(i, str) for i in data):
                raise serializers.ValidationError("Prescribed tests should be a list of strings.")
            return data
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON format for prescribed tests.")
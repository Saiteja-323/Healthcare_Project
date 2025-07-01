# --- UPDATED FILE: backend/employee_api/admin.py ---

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    CustomUser, PatientProfile, DoctorProfile, Appointment, 
    MedicalRecord, DiagnosticTest, MedicationBill # <-- Import new models
)

# ... (CustomUserAdmin, PatientProfileAdmin, DoctorProfileAdmin, AppointmentAdmin are unchanged) ...
@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = BaseUserAdmin.list_display + ('role',)
    list_filter = BaseUserAdmin.list_filter + ('role',)
    fieldsets = ((None, {'fields': ('username', 'password')}), (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'role')}), (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),}), (_('Important dates'), {'fields': ('last_login', 'date_joined')}),)
    add_fieldsets = ((None, {'classes': ('wide',), 'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2'),}),)

@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'health_issue_category')
    search_fields = ('user__username',)

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'years_of_experience')
    search_fields = ('user__username',)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'appointment_date', 'status')
    list_filter = ('status', 'appointment_date', 'doctor__doctor_profile__specialization')
    search_fields = ('patient__username', 'doctor__username')

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'appointment', 'patient', 'doctor', 'created_at')
    search_fields = ('patient__username', 'doctor__username')

# --- NEW ADMIN REGISTRATIONS ---
@admin.register(DiagnosticTest)
class DiagnosticTestAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'patient', 'doctor', 'cost', 'result', 'is_paid', 'is_sent_to_patient')
    list_filter = ('is_paid', 'is_sent_to_patient', 'result')
    search_fields = ('test_name', 'patient__username', 'doctor__username')

@admin.register(MedicationBill)
class MedicationBillAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'patient', 'doctor', 'total_cost', 'is_paid', 'is_sent_to_patient')
    list_filter = ('is_paid', 'is_sent_to_patient')
    search_fields = ('patient__username', 'doctor__username')
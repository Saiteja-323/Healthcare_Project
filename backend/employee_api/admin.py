# backend/employee_api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, PatientProfile, DoctorProfile, Appointment, MedicalRecord

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    # ... (same as before) ...
    list_display = BaseUserAdmin.list_display + ('role',)
    list_filter = BaseUserAdmin.list_filter + ('role',)
    fieldsets = ((None, {'fields': ('username', 'password')}), (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'role')}), (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),}), (_('Important dates'), {'fields': ('last_login', 'date_joined')}),)
    add_fieldsets = ((None, {'classes': ('wide',), 'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2'),}),)

@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    # ... (same as before) ...
    list_display = ('user', 'age', 'health_issue_category')
    search_fields = ('user__username',)

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    # ... (same as before) ...
    list_display = ('user', 'specialization', 'years_of_experience')
    search_fields = ('user__username',)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    # ... (updated) ...
    list_display = ('id', 'patient', 'doctor', 'appointment_date', 'status')
    list_filter = ('status', 'appointment_date', 'doctor__doctor_profile__specialization')
    search_fields = ('patient__username', 'doctor__username')

# --- NEW ---
@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'appointment', 'patient', 'doctor', 'created_at')
    search_fields = ('patient__username', 'doctor__username')
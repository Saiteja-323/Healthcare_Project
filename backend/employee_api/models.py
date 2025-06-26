# backend/employee_api/models.py

from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# ... (CustomUser, HEALTH_CATEGORY_CHOICES, PatientProfile, DoctorProfile models remain unchanged) ...
class CustomUser(AbstractUser):
    ROLE_CHOICES = [('doctor', 'Doctor'), ('patient', 'Patient')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    groups = models.ManyToManyField('auth.Group', blank=True, related_name="customuser_set")
    user_permissions = models.ManyToManyField('auth.Permission', blank=True, related_name="customuser_set")
    class Meta: verbose_name, verbose_name_plural = 'User', 'Users'
    def __str__(self): return f"{self.username} ({self.get_role_display()})"

HEALTH_CATEGORY_CHOICES = [('heart', 'Heart-related issues'), ('skin', 'Skin-related issues'), ('bone', 'Bone and muscle-related issues'), ('respiratory', 'Respiratory-related issues')]

class PatientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    age = models.PositiveIntegerField()
    medical_history = models.TextField(blank=True, null=True)
    current_symptoms = models.TextField()
    health_issue_category = models.CharField(max_length=50, choices=HEALTH_CATEGORY_CHOICES)
    def __str__(self): return f"Profile of Patient: {self.user.username}"

class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=50, choices=HEALTH_CATEGORY_CHOICES)
    years_of_experience = models.PositiveIntegerField()
    educational_background = models.TextField()
    credentials = models.TextField(blank=True, null=True)
    def __str__(self): return f"Profile of Doctor: {self.user.username}"

# --- UPDATED Appointment Model ---
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    TIME_SLOT_CHOICES = [
        ('09:30-10:30', '9:30 AM to 10:30 AM'),
        ('11:00-12:30', '11:00 AM to 12:30 PM'),
        ('14:00-15:30', '2:00 PM to 3:30 PM'),
        ('16:00-18:00', '4:00 PM to 6:00 PM'),
    ]

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments')
    
    appointment_date = models.DateField(default=timezone.now)
    time_slot = models.CharField(max_length=20, choices=TIME_SLOT_CHOICES)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # For patient's upload during booking
    initial_report = models.FileField(upload_to='patient_reports/', blank=True, null=True)

    # For doctor's cancellation reason
    suggestion_message = models.TextField(blank=True, null=True)
    suggestion_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"Appointment for {self.patient.username} with Dr. {self.doctor.last_name} on {self.appointment_date} [{self.status}]"

    class Meta:
        ordering = ['-appointment_date', '-time_slot']
        unique_together = ('patient', 'doctor', 'appointment_date', 'time_slot')

# --- NEW MedicalRecord Model ---
class MedicalRecord(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='medical_record')
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions')

    # Store prescribed items as JSON. e.g., {"Paracetamol 500mg": 10, "Aspirin 75mg": 30}
    tablets = models.JSONField(default=dict, blank=True)
    syrups = models.JSONField(default=dict, blank=True)
    injections = models.JSONField(default=dict, blank=True)
    ointments = models.JSONField(default=dict, blank=True)

    # Doctor's uploaded report file
    report_file = models.FileField(upload_to='doctor_reports/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Medical Record for Appointment ID: {self.appointment.id}"
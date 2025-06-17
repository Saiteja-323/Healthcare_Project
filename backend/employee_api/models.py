# backend/employee_api/models.py

from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_set",
        related_query_name="user",
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

HEALTH_CATEGORY_CHOICES = [
    ('heart', 'Heart-related issues'),
    ('skin', 'Skin-related issues'),
    ('bone', 'Bone and muscle-related issues'),
    ('respiratory', 'Respiratory-related issues'),
]

class PatientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    age = models.PositiveIntegerField()
    medical_history = models.TextField(blank=True, null=True)
    current_symptoms = models.TextField()
    health_issue_category = models.CharField(max_length=50, choices=HEALTH_CATEGORY_CHOICES)

    def __str__(self):
        return f"Profile of Patient: {self.user.username}"

class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=50, choices=HEALTH_CATEGORY_CHOICES)
    years_of_experience = models.PositiveIntegerField()
    educational_background = models.TextField()
    credentials = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Profile of Doctor: {self.user.username}"

# --- CORRECTED Appointment Model ---
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('booked', 'Booked'),
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
    time_slot = models.CharField(max_length=20, choices=TIME_SLOT_CHOICES, default='09:30-10:30') # Default value added here
    
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')

    def __str__(self):
        return f"Appointment for {self.patient.username} with Dr. {self.doctor.last_name} on {self.appointment_date} at {self.get_time_slot_display()}"

    class Meta:
        ordering = ['appointment_date', 'time_slot']
        # Prevent a patient from booking the same doctor for the same date and time slot
        unique_together = ('patient', 'doctor', 'appointment_date', 'time_slot')
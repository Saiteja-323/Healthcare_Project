# backend/employee_api/models.py
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

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

# --- NEW MODELS ---

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

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('booked', 'Booked'),
        ('completed', 'Completed'),
    ]
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')

    def __str__(self):
        return f"Appointment for {self.patient.username} with Dr. {self.doctor.last_name}"

    class Meta:
        ordering = ['-created_at']
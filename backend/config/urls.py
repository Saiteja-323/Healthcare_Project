# backend/config/urls.py
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from employee_api.views import (
    RegisterView, LoginView, ProfileView,
    PatientProfileView, DoctorProfileView,
    DoctorListView, AppointmentView, 
    AppointmentAvailabilityView,
    # --- NEW IMPORTS ---
    ManageAppointmentView,
    CompleteAppointmentView,
    MedicalHistoryView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profiles
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/profile/patient/', PatientProfileView.as_view(), name='patient-profile'),
    path('api/profile/doctor/', DoctorProfileView.as_view(), name='doctor-profile'),
    
    # Core Functionality
    path('api/doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('api/appointments/', AppointmentView.as_view(), name='appointment-list-create'),
    path('api/appointments/availability/', AppointmentAvailabilityView.as_view(), name='appointment-availability'),

    # --- NEW URLS FOR UPDATED WORKFLOW ---
    path('api/appointments/<int:pk>/manage/', ManageAppointmentView.as_view(), name='appointment-manage'),
    path('api/appointments/<int:pk>/complete/', CompleteAppointmentView.as_view(), name='appointment-complete'),
    path('api/medical-history/', MedicalHistoryView.as_view(), name='medical-history'),
]

# --- Add this for serving media files during development ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
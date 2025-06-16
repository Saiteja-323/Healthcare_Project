# backend/config/urls.py
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from employee_api.views import (
    RegisterView, LoginView, ProfileView,
    PatientProfileView, DoctorProfileView,
    DoctorListView, AppointmentView, AppointmentDetailView
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
    path('api/appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail-update'),
]
# backend/config/urls.py
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from employee_api.views import (
    RegisterView, LoginView, 
    DoctorDashboardView, # UPDATED
    PatientDashboardView, # UPDATED
    ProfileView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/doctor/dashboard/', DoctorDashboardView.as_view(), name='doctor_dashboard'), # UPDATED path and name
    path('api/patient/dashboard/', PatientDashboardView.as_view(), name='patient_dashboard'), # UPDATED path and name
    path('api/profile/', ProfileView.as_view(), name='profile'),
]
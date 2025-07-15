# --- UPDATED FILE: backend/config/urls.py ---

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
    ManageAppointmentView,
    CompleteAppointmentView,
    MedicalHistoryView,
    DoctorAppointmentHistoryView,
    DoctorDiagnosticCenterView, DoctorManageDiagnosticTestView,
    DoctorMedicalPaymentsView, DoctorManageMedicalBillView,
    PatientDiagnosticCenterView, PatientPayForTestView,
    PatientMedicalPaymentsView, PatientPayForBillView,
    
    # --- NEW IMPORTS ---
    BulkCancelAppointmentsView,
    DoctorUnavailabilityView,
    DoctorUnavailabilityDeleteView,
    AppointmentHistoryDetailView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Auth & Profile
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/profile/patient/', PatientProfileView.as_view(), name='patient-profile'),
    path('api/profile/doctor/', DoctorProfileView.as_view(), name='doctor-profile'),

    # Appointments & General
    path('api/doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('api/appointments/', AppointmentView.as_view(), name='appointment-list-create'),
    path('api/appointments/availability/', AppointmentAvailabilityView.as_view(), name='appointment-availability'),
    path('api/appointments/<int:pk>/manage/', ManageAppointmentView.as_view(), name='appointment-manage'),
    path('api/appointments/<int:pk>/complete/', CompleteAppointmentView.as_view(), name='appointment-complete'),
    
    # History
    path('api/medical-history/', MedicalHistoryView.as_view(), name='patient-medical-history'), # Patient history list
    path('api/appointments/history/', DoctorAppointmentHistoryView.as_view(), name='doctor-appointment-history'), # Doctor history list
    
    # --- NEW/UPDATED DOCTOR URLS ---
    path('api/appointments/history/<int:pk>/', AppointmentHistoryDetailView.as_view(), name='doctor-appointment-detail'),
    path('api/appointments/bulk-cancel/', BulkCancelAppointmentsView.as_view(), name='appointment-bulk-cancel'),
    path('api/doctor/unavailability/', DoctorUnavailabilityView.as_view(), name='doctor-unavailability-list-create'),
    path('api/doctor/unavailability/<int:pk>/', DoctorUnavailabilityDeleteView.as_view(), name='doctor-unavailability-delete'),
    path('api/doctor/diagnostic-center/', DoctorDiagnosticCenterView.as_view(), name='doctor-diagnostic-center'),
    path('api/doctor/diagnostic-center/<int:pk>/manage/', DoctorManageDiagnosticTestView.as_view(), name='doctor-manage-test'),
    path('api/doctor/medical-payments/', DoctorMedicalPaymentsView.as_view(), name='doctor-medical-payments'),
    path('api/doctor/medical-payments/<int:pk>/manage/', DoctorManageMedicalBillView.as_view(), name='doctor-manage-bill'),

    # --- PATIENT URLS ---
    path('api/patient/diagnostic-center/', PatientDiagnosticCenterView.as_view(), name='patient-diagnostic-center'),
    path('api/patient/diagnostic-center/pay/<int:appointment_id>/', PatientPayForTestView.as_view(), name='patient-pay-for-test'),
    path('api/patient/medical-payments/', PatientMedicalPaymentsView.as_view(), name='patient-medical-payments'),
    path('api/patient/medical-payments/<int:pk>/pay/', PatientPayForBillView.as_view(), name='patient-pay-for-bill'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
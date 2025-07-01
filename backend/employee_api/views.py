# --- UPDATED FILE: backend/employee_api/views.py ---

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from django.db import transaction

from .models import (
    CustomUser, PatientProfile, DoctorProfile, Appointment, 
    MedicalRecord, DiagnosticTest, MedicationBill
)
from .serializers import (
    UserRegistrationSerializer, UserSerializer, LoginSerializer,
    PatientProfileSerializer, DoctorProfileSerializer, DoctorListSerializer,
    AppointmentSerializer, TreatmentFormSerializer,
    DiagnosticTestSerializer, MedicationBillSerializer, # NEW IMPORTS
)
from .permissions import IsDoctor, IsPatient

# ... (RegisterView, LoginView, ProfileView, PatientProfileView, DoctorProfileView, DoctorListView, AppointmentView, AppointmentAvailabilityView, ManageAppointmentView remain the same) ...
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({'message': 'User registered successfully', 'user': UserSerializer(user, context=self.get_serializer_context()).data, 'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username, password, role_from_request = serializer.validated_data['username'], serializer.validated_data['password'], serializer.validated_data['role']
            user = authenticate(request, username=username, password=password)
            if user is not None and user.role == role_from_request:
                refresh = RefreshToken.for_user(user)
                return Response({'message': 'Login successful', 'user': UserSerializer(user).data, 'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}}, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid credentials or role mismatch.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)

class PatientProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    def post(self, request):
        serializer = PatientProfileSerializer(data=request.data)
        if serializer.is_valid():
            PatientProfile.objects.update_or_create(user=request.user, defaults=serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    def post(self, request):
        serializer = DoctorProfileSerializer(data=request.data)
        if serializer.is_valid():
            DoctorProfile.objects.update_or_create(user=request.user, defaults=serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DoctorListSerializer
    def get_queryset(self):
        category = self.request.query_params.get('category')
        if not category: return CustomUser.objects.none()
        return CustomUser.objects.filter(role='doctor', doctor_profile__specialization=category)

class AppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        if user.role == 'patient':
            appointments = Appointment.objects.filter(patient=user).select_related('doctor', 'medical_record')
        elif user.role == 'doctor':
            appointments = Appointment.objects.filter(
                doctor=user, 
                status__in=['pending', 'accepted']
            ).select_related('patient__patient_profile')
        else:
            return Response([], status=status.HTTP_200_OK)
        
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can book appointments.'}, status=status.HTTP_403_FORBIDDEN)

        doctor_id = request.data.get('doctor_id')
        appointment_date = request.data.get('appointment_date')
        time_slot = request.data.get('time_slot')

        if not all([doctor_id, appointment_date, time_slot]):
            return Response({'error': 'Doctor, date, and time slot are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        booked_count = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            time_slot=time_slot,
            status='accepted'
        ).count()

        if booked_count >= 5:
            return Response({'error': 'This time slot is full. Please select another.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AppointmentSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'An unexpected server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AppointmentAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')

        if not doctor_id or not date:
            return Response({'error': 'Doctor ID and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        availability = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=date,
            status='accepted'
        ).values('time_slot').annotate(count=Count('id'))
        
        slot_counts = {slot['time_slot']: slot['count'] for slot in availability}
        return Response(slot_counts, status=status.HTTP_200_OK)


class ManageAppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        action = request.data.get('action')

        if user.role == 'doctor':
            if appointment.doctor != user:
                return Response({'error': 'You do not have permission to manage this appointment.'}, status=status.HTTP_403_FORBIDDEN)
            
            if action == 'accept':
                if appointment.status != 'pending':
                    return Response({'error': 'Can only accept a pending appointment.'}, status=status.HTTP_400_BAD_REQUEST)
                appointment.status = 'accepted'
                appointment.save()
            elif action == 'cancel':
                if appointment.status not in ['pending', 'accepted']:
                    return Response({'error': 'Cannot cancel this appointment.'}, status=status.HTTP_400_BAD_REQUEST)
                appointment.status = 'cancelled'
                appointment.suggestion_message = request.data.get('suggestion_message', '')
                appointment.suggestion_date = request.data.get('suggestion_date', None)
                appointment.save()
            else:
                return Response({'error': 'Invalid action for a doctor.'}, status=status.HTTP_400_BAD_REQUEST)

        elif user.role == 'patient':
            if appointment.patient != user:
                return Response({'error': 'You do not have permission to manage this appointment.'}, status=status.HTTP_403_FORBIDDEN)

            if action == 'cancel':
                if appointment.status not in ['pending', 'accepted']:
                    return Response({'error': 'Cannot cancel this appointment. It might be completed or already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
                appointment.status = 'cancelled'
                appointment.save()
            else:
                return Response({'error': 'Invalid action for a patient.'}, status=status.HTTP_400_BAD_REQUEST)
        
        else:
             return Response({'error': 'Invalid user role.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        user = request.user

        if not (user.role == 'patient' and appointment.patient == user):
            return Response({'error': 'You do not have permission to delete this appointment.'}, status=status.HTTP_403_FORBIDDEN)

        if appointment.status != 'pending':
            return Response({'error': 'Only pending appointment requests can be deleted.'}, status=status.HTTP_400_BAD_REQUEST)
            
        appointment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- HEAVILY UPDATED CompleteAppointmentView ---
class CompleteAppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.select_related('patient', 'doctor').get(pk=pk, doctor=request.user, status='accepted')
        except Appointment.DoesNotExist:
            return Response({'error': 'Accepted appointment not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TreatmentFormSerializer(data=request.data)
        if serializer.is_valid():
            med_details = serializer.validated_data.get('medication_details', {})
            test_list = serializer.validated_data.get('prescribed_tests', [])

            try:
                with transaction.atomic():
                    # 1. Create the Medical Record
                    MedicalRecord.objects.create(
                        appointment=appointment,
                        patient=appointment.patient,
                        doctor=appointment.doctor,
                        medication_details=med_details,
                        prescribed_tests=test_list
                    )

                    # 2. Create DiagnosticTest entries for the diagnostic center
                    for test_name in test_list:
                        DiagnosticTest.objects.create(
                            appointment=appointment,
                            patient=appointment.patient,
                            doctor=appointment.doctor,
                            test_name=test_name
                        )
                    
                    # 3. Create a MedicationBill entry for the pharmacy/payment
                    if med_details: # Only create a bill if meds are prescribed
                        MedicationBill.objects.create(
                            appointment=appointment,
                            patient=appointment.patient,
                            doctor=appointment.doctor
                        )

                    # 4. Mark appointment as completed
                    appointment.status = 'completed'
                    appointment.save()

            except Exception as e:
                # Log the error e
                return Response({'error': 'An internal error occurred while saving records.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({'message': 'Appointment completed and records created successfully.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- UPDATED MedicalHistoryView ---
class MedicalHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        # Prefetch related data for efficiency
        return Appointment.objects.filter(
            patient=self.request.user, 
            status='completed'
        ).select_related(
            'doctor', 
            'medical_record', 
            'medication_bill'
        ).prefetch_related(
            'diagnostic_tests'
        ).order_by('-appointment_date')
        
# --- UPDATED DoctorAppointmentHistoryView ---
class DoctorAppointmentHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return Appointment.objects.filter(
            doctor=self.request.user,
            status='completed'
        ).select_related('patient', 'patient__patient_profile').order_by('-appointment_date')

# --- NEW VIEWS FOR DOCTOR ---

class DoctorDiagnosticCenterView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = DiagnosticTestSerializer

    def get_queryset(self):
        return DiagnosticTest.objects.filter(doctor=self.request.user).order_by('-created_at')

class DoctorManageDiagnosticTestView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = DiagnosticTestSerializer
    queryset = DiagnosticTest.objects.all()
    
    def get_queryset(self):
        return self.queryset.filter(doctor=self.request.user)

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.cost = request.data.get('cost', instance.cost)
        instance.result = request.data.get('result', instance.result)
        if request.data.get('send_to_patient'):
            instance.is_sent_to_patient = True
        instance.save()
        return Response(self.get_serializer(instance).data)

class DoctorMedicalPaymentsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = MedicationBillSerializer

    def get_queryset(self):
        return MedicationBill.objects.filter(doctor=self.request.user).order_by('-created_at')

class DoctorManageMedicalBillView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = MedicationBillSerializer
    queryset = MedicationBill.objects.all()

    def get_queryset(self):
        return self.queryset.filter(doctor=self.request.user)
    
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.total_cost = request.data.get('total_cost', instance.total_cost)
        if request.data.get('send_to_patient'):
            instance.is_sent_to_patient = True
        instance.save()
        return Response(self.get_serializer(instance).data)


# --- NEW VIEWS FOR PATIENT ---

class PatientDiagnosticCenterView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = DiagnosticTestSerializer

    def get_queryset(self):
        # Show tests that are sent and group them by appointment
        return DiagnosticTest.objects.filter(patient=self.request.user, is_sent_to_patient=True).order_by('-appointment__appointment_date', 'test_name')

class PatientPayForTestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def post(self, request, appointment_id):
        # Patient pays for all tests of a specific appointment at once
        tests = DiagnosticTest.objects.filter(patient=request.user, appointment_id=appointment_id, is_paid=False)
        if not tests.exists():
            return Response({'error': 'No unpaid tests found for this appointment.'}, status=status.HTTP_404_NOT_FOUND)
        
        tests.update(is_paid=True)
        return Response({'message': 'Payment successful. You can now view your results.'}, status=status.HTTP_200_OK)

class PatientMedicalPaymentsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = MedicationBillSerializer

    def get_queryset(self):
        return MedicationBill.objects.filter(patient=self.request.user, is_sent_to_patient=True).order_by('-created_at')

class PatientPayForBillView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = MedicationBillSerializer
    queryset = MedicationBill.objects.all()

    def get_queryset(self):
        return self.queryset.filter(patient=self.request.user, is_paid=False)
        
    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_paid = True
        instance.save()
        # In a real app, you would integrate a payment gateway here
        return Response({'message': 'Payment successful. Your prescription is saved to your medical history.'}, status=status.HTTP_200_OK)
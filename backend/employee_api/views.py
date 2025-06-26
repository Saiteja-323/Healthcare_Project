# backend/employee_api/views.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from .models import CustomUser, PatientProfile, DoctorProfile, Appointment, MedicalRecord
from .serializers import (
    UserRegistrationSerializer, UserSerializer, LoginSerializer,
    PatientProfileSerializer, DoctorProfileSerializer, DoctorListSerializer,
    AppointmentSerializer, TreatmentFormSerializer
)
from .permissions import IsDoctor, IsPatient # We will create this file

# ... (RegisterView, LoginView, ProfileView, Patient/DoctorProfileView, DoctorListView are unchanged) ...
# Please scroll down to see the heavily modified and new views.
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        # ... same as before ...
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({'message': 'User registered successfully', 'user': UserSerializer(user, context=self.get_serializer_context()).data, 'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    def post(self, request):
        # ... same as before ...
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

# --- MODIFIED AppointmentView ---
class AppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        if user.role == 'patient':
            appointments = Appointment.objects.filter(patient=user).select_related('doctor', 'medical_record')
        elif user.role == 'doctor':
            # Doctors see pending and accepted appointments
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

        # Pre-validation checks for full slots remain the same
        doctor_id = request.data.get('doctor_id')
        appointment_date = request.data.get('appointment_date')
        time_slot = request.data.get('time_slot')

        if not all([doctor_id, appointment_date, time_slot]):
            return Response({'error': 'Doctor, date, and time slot are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for slots that are already accepted (not just booked)
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
    # ... (code is correct, but let's refine the filter) ...
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')

        if not doctor_id or not date:
            return Response({'error': 'Doctor ID and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # We only care about appointments that are confirmed/accepted
        availability = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=date,
            status='accepted'
        ).values('time_slot').annotate(count=Count('id'))
        
        slot_counts = {slot['time_slot']: slot['count'] for slot in availability}
        return Response(slot_counts, status=status.HTTP_200_OK)

# --- NEW: View for Doctor to Accept/Cancel Appointments ---
class ManageAppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk, doctor=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')

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
            return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

# --- NEW: View for Doctor to Submit Treatment and Complete Appointment ---
class CompleteAppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk, doctor=request.user, status='accepted')
        except Appointment.DoesNotExist:
            return Response({'error': 'Accepted appointment not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TreatmentFormSerializer(data=request.data)
        if serializer.is_valid():
            # Create the medical record
            MedicalRecord.objects.create(
                appointment=appointment,
                patient=appointment.patient,
                doctor=appointment.doctor,
                **serializer.validated_data
            )
            # Update appointment status
            appointment.status = 'completed'
            appointment.save()
            return Response({'message': 'Appointment completed successfully.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- NEW: View for Patient to see their entire history ---
class MedicalHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        # Return all completed appointments for the patient, with related records
        return Appointment.objects.filter(
            patient=self.request.user, 
            status='completed'
        ).select_related('doctor', 'medical_record').order_by('-appointment_date')
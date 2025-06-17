# backend/employee_api/views.py

from rest_framework import generics, permissions, status
# We need to import 'serializers' to catch its ValidationError
from rest_framework import serializers 
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Count
from django.db import IntegrityError
from .models import CustomUser, PatientProfile, DoctorProfile, Appointment
from .serializers import (
    UserRegistrationSerializer, UserSerializer, LoginSerializer,
    PatientProfileSerializer, DoctorProfileSerializer, DoctorListSerializer,
    AppointmentSerializer
)

# ... (All other views like RegisterView, LoginView, etc., remain unchanged) ...
# Please scroll down to the AppointmentView post method

class RegisterView(generics.CreateAPIView):
    # ... (code is correct, no changes needed)
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            role_from_request = serializer.validated_data['role']
            user = authenticate(request, username=username, password=password)
            if user is not None and user.role == role_from_request:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Login successful',
                    'user': UserSerializer(user).data,
                    'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}
                }, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid credentials or role mismatch.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)

class PatientProfileView(APIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can create a patient profile.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PatientProfileSerializer(data=request.data)
        if serializer.is_valid():
            PatientProfile.objects.update_or_create(user=request.user, defaults=serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorProfileView(APIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can create a doctor profile.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DoctorProfileSerializer(data=request.data)
        if serializer.is_valid():
            DoctorProfile.objects.update_or_create(user=request.user, defaults=serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorListView(generics.ListAPIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DoctorListSerializer
    
    def get_queryset(self):
        category = self.request.query_params.get('category')
        if not category:
            return CustomUser.objects.none()
        return CustomUser.objects.filter(role='doctor', doctor_profile__specialization=category)

class AppointmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # ... (get method is correct, no changes needed)
        user = request.user
        if user.role == 'patient':
            appointments = Appointment.objects.filter(patient=user)
        elif user.role == 'doctor':
            appointments = Appointment.objects.filter(doctor=user, status='booked')
        else:
            return Response([], status=status.HTTP_200_OK)
        
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
    
    # --- THIS IS THE FINAL, CORRECTED POST METHOD ---
    def post(self, request):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can book appointments.'}, status=status.HTTP_403_FORBIDDEN)

        # Pre-validation checks
        doctor_id = request.data.get('doctor_id')
        appointment_date = request.data.get('appointment_date')
        time_slot = request.data.get('time_slot')

        if not all([doctor_id, appointment_date, time_slot]):
            return Response({'error': 'Doctor, date, and time slot are required.'}, status=status.HTTP_400_BAD_REQUEST)

        booked_count = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            time_slot=time_slot,
            status='booked'
        ).count()

        if booked_count >= 5:
            return Response({'error': 'This time slot is full. Please select another.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AppointmentSerializer(data=request.data, context={'request': request})
        
        try:
            # Manually trigger validation. Do NOT use raise_exception=True here.
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                # If validation fails, check if it's the specific unique_together error
                if 'non_field_errors' in serializer.errors:
                    return Response(
                        {"error": "You have already booked this exact time slot. Please check your appointments."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # For any other validation errors, return them as is
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # A fallback for any other unexpected errors
            return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AppointmentAvailabilityView(APIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date = request.query_params.get('date')

        if not doctor_id or not date:
            return Response({'error': 'Doctor ID and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        availability = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=date,
            status='booked'
        ).values('time_slot').annotate(count=Count('id'))
        
        slot_counts = {slot['time_slot']: slot['count'] for slot in availability}
        
        return Response(slot_counts, status=status.HTTP_200_OK)


class AppointmentDetailView(APIView):
    # ... (code is correct, no changes needed)
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can update appointments.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            appointment = Appointment.objects.get(pk=pk, doctor=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)
        
        if request.data.get('status') == 'completed':
            appointment.status = 'completed'
            appointment.save()
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid status update.'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'patient':
            return Response({'error': 'Only patients can remove appointments.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            appointment = Appointment.objects.get(pk=pk, patient=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status != 'booked':
            return Response({'error': 'Cannot remove an appointment that is already completed.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
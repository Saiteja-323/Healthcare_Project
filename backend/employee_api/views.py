# backend/employee_api/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser # UPDATED
from .serializers import UserRegistrationSerializer, UserSerializer, LoginSerializer # UPDATED

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all() # UPDATED
    serializer_class = UserRegistrationSerializer # UPDATED
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user, context=self.get_serializer_context()).data, # UPDATED
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            role_from_request = serializer.validated_data['role']
            
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                if user.role == role_from_request:
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'Login successful',
                        'user': UserSerializer(user).data, # UPDATED
                        'tokens': {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                        }
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Role mismatch for the provided credentials.'
                    }, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({
                    'error': 'Invalid credentials.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorDashboardView(APIView): # Renamed from AdminDashboardView
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'doctor': # UPDATED role check
            return Response({'error': 'Doctor access required.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Doctors can see all users (patients and other doctors)
        all_users = CustomUser.objects.all() # UPDATED
        return Response({
            'message': 'Doctor Dashboard Data',
            'total_users': all_users.count(),
            'users': UserSerializer(all_users, many=True).data # UPDATED
        }, status=status.HTTP_200_OK)

class PatientDashboardView(APIView): # Renamed from EmployeeDashboardView
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # A patient should only see their own data.
        # A doctor accessing this specific patient dashboard view might also be permissible
        # if there was a use case, but for now, let's keep it simple: only for the patient themselves.
        if request.user.role != 'patient':
             # If a doctor wants to see a patient's profile, they'd likely use the ProfileView with a user ID,
             # or the DoctorDashboardView lists users.
            return Response({'error': 'Patient access required for this specific dashboard view.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'message': 'Patient Dashboard Data',
            'user': UserSerializer(request.user).data # UPDATED
        }, status=status.HTTP_200_OK)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data # UPDATED
        }, status=status.HTTP_200_OK)
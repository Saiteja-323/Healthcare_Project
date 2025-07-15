// --- UPDATED FILE: src/App.jsx ---

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import ProtectedRoute from './ProtectedRoute';
import PatientProfileForm from './PatientProfileForm';
import DoctorProfileForm from './DoctorProfileForm';
import MedicalHistory from './MedicalHistory'; 

import DiagnosticCenter from './pages/doctor/DiagnosticCenter';
import MedicalPayments from './pages/doctor/MedicalPayments';
import PatientDiagnosticCenter from './pages/patient/PatientDiagnosticCenter';
import PatientMedicalPayments from './pages/patient/PatientMedicalPayments';

// --- NEW PAGE IMPORT ---
import AppointmentHistoryDetail from './pages/doctor/AppointmentHistoryDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          
          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/complete-profile" element={<ProtectedRoute requiredRole="patient"><PatientProfileForm /></ProtectedRoute>} />
          <Route path="/patient/history" element={<ProtectedRoute requiredRole="patient"><MedicalHistory /></ProtectedRoute>} />
          <Route path="/patient/diagnostic-reports" element={<ProtectedRoute requiredRole="patient"><PatientDiagnosticCenter /></ProtectedRoute>} />
          <Route path="/patient/medication-bills" element={<ProtectedRoute requiredRole="patient"><PatientMedicalPayments /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/complete-profile" element={<ProtectedRoute requiredRole="doctor"><DoctorProfileForm /></ProtectedRoute>} />
          {/* --- NEW/UPDATED DOCTOR ROUTES --- */}
          <Route path="/doctor/history/:appointmentId" element={<ProtectedRoute requiredRole="doctor"><AppointmentHistoryDetail /></ProtectedRoute>} />
          <Route path="/doctor/diagnostic-center" element={<ProtectedRoute requiredRole="doctor"><DiagnosticCenter /></ProtectedRoute>} />
          <Route path="/doctor/medical-payments" element={<ProtectedRoute requiredRole="doctor"><MedicalPayments /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
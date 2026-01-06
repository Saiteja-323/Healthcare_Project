import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";

import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";

import PatientProfileForm from "./PatientProfileForm";
import DoctorProfileForm from "./DoctorProfileForm";

import MedicalHistory from "./MedicalHistory";
import ProtectedRoute from "./ProtectedRoute";

import DiagnosticCenter from "./pages/doctor/DiagnosticCenter";
import MedicalPayments from "./pages/doctor/MedicalPayments";
import AppointmentHistoryDetail from "./pages/doctor/AppointmentHistoryDetail";

import PatientDiagnosticCenter from "./pages/patient/PatientDiagnosticCenter";
import PatientMedicalPayments from "./pages/patient/PatientMedicalPayments";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* PATIENT ROUTES */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute role="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute role="patient">
                <PatientProfileForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/complete-profile"
            element={
              <ProtectedRoute role="patient">
                <PatientProfileForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/history"
            element={
              <ProtectedRoute role="patient">
                <MedicalHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/tests"
            element={
              <ProtectedRoute role="patient">
                <PatientDiagnosticCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/medication-bills"
            element={
              <ProtectedRoute role="patient">
                <PatientMedicalPayments />
              </ProtectedRoute>
            }
          />

          {/* DOCTOR ROUTES */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute role="doctor">
                <DoctorProfileForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/complete-profile"
            element={
              <ProtectedRoute role="doctor">
                <DoctorProfileForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/history/:id"
            element={
              <ProtectedRoute role="doctor">
                <AppointmentHistoryDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/diagnostic-center"
            element={
              <ProtectedRoute role="doctor">
                <DiagnosticCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/medical-payments"
            element={
              <ProtectedRoute role="doctor">
                <MedicalPayments />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
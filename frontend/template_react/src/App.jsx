// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import ProtectedRoute from './ProtectedRoute';
import PatientProfileForm from './PatientProfileForm'; // NEW
import DoctorProfileForm from './DoctorProfileForm';   // NEW

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          
          {/* Patient Routes */}
          <Route 
            path="/patient/dashboard"
            element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/patient/complete-profile" 
            element={<ProtectedRoute requiredRole="patient"><PatientProfileForm /></ProtectedRoute>}
          />

          {/* Doctor Routes */}
          <Route 
            path="/doctor/dashboard"
            element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/doctor/complete-profile"
            element={<ProtectedRoute requiredRole="doctor"><DoctorProfileForm /></ProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import DoctorDashboard from './DoctorDashboard'; // UPDATED import
import PatientDashboard from './PatientDashboard'; // UPDATED import
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route 
            path="/doctor/dashboard" // UPDATED path
            element={
              <ProtectedRoute requiredRole="doctor"> {/* UPDATED role */}
                <DoctorDashboard /> {/* UPDATED component */}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/patient/dashboard" // UPDATED path
            element={
              <ProtectedRoute requiredRole="patient"> {/* UPDATED role */}
                <PatientDashboard /> {/* UPDATED component */}
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
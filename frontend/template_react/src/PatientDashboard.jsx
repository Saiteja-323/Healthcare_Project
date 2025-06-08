// src/PatientDashboard.jsx
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'; // Added useState for potential future data
import axios from 'axios'; // Added axios for potential API call

function PatientDashboard() { // Renamed component
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    // const [patientData, setPatientData] = useState(null); // Example for future data
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState('');

    useEffect(() => {
        // Example: If you need to fetch specific patient data beyond what's in `user`
        // if (user && user.role === 'patient') {
        //     fetchPatientDetails();
        // }
    }, [user]);

    // const fetchPatientDetails = async () => {
    //     setLoading(true);
    //     try {
    //         // const response = await axios.get(`http://localhost:8000/api/patient/dashboard/`); // Or specific patient data endpoint
    //         // setPatientData(response.data.details); 
    //         setLoading(false);
    //     } catch (err) {
    //         setError('Could not fetch patient details.');
    //         setLoading(false);
    //     }
    // };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return <div>Loading user data...</div>;
    }

    // This check should ideally be fully handled by ProtectedRoute
    if (user.role !== 'patient') {
         // return <div>Access Denied. Patient role required.</div>; 
         // Or redirect, but ProtectedRoute should prevent reaching here.
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Patient Dashboard</h1> {/* UPDATED Title */}
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, {user.first_name || user.username}!</span>
                    <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', color: '#007bff' }}>Home</Link>
                    <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>
            
            <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                <h2>Your Profile Information</h2>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Full Name:</strong> {user.first_name || 'N/A'} {user.last_name || ''}</p>
                {/* REMOVED Department Display */}
                <p><strong>Role:</strong> {user.role}</p>
            </div>

            {/* {loading && <p>Loading details...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
            {patientData && (
                <div style={{marginTop: '20px'}}>
                    <h3>Your Medical Records (Example)</h3>
                     Render patientData here 
                </div>
            )} */}

            <div style={{ marginTop: '30px' }}>
                <h3>Quick Actions</h3>
                <p><em>(Example: View appointments, medical history, etc.)</em></p>
            </div>
        </div>
    );
}

export default PatientDashboard; // Renamed export
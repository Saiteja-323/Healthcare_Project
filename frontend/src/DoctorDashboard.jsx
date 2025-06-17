// src/DoctorDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns'; // Import date-fns

function DoctorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            if (!user.doctor_profile) {
                navigate('/doctor/complete-profile');
                return;
            }
            fetchAppointments();
        }
    }, [user, navigate]);

    const fetchAppointments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/appointments/');
            setAppointments(response.data);
        } catch (err) {
            setError('Failed to fetch patient appointments.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsCompleted = async (appointmentId) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}/`, { status: 'completed' });
            fetchAppointments();
        } catch (err) {
            alert('Failed to update appointment.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading || !user || !user.doctor_profile) {
        return <div>Loading Doctor Dashboard...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Patient Dashboard</h1>
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, Dr. {user.last_name || user.username}!</span>
                    <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
                </div>
            </header>

            <h2>Your Active Appointments</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {/* --- UPDATED TABLE --- */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Patient Name</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Symptoms/Issue</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Appointment Date</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Time Slot</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Medical History</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {appointments.length > 0 ? appointments.map(apt => (
                        <tr key={apt.id}>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>{apt.patient.first_name} {apt.patient.last_name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>{apt.patient.patient_profile.current_symptoms}</td>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                {format(new Date(apt.appointment_date), 'EEE, MMM dd, yyyy')}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                                {apt.time_slot.replace('-', ' to ')}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>{apt.patient.patient_profile.medical_history || 'N/A'}</td>
                            <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                                <button onClick={() => handleMarkAsCompleted(apt.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px' }}>
                                    Completed
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>You have no active appointments.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DoctorDashboard;
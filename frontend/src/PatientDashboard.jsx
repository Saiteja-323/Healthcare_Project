// src/PatientDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const healthCategories = {
    heart: 'Cardiology (Heart)',
    skin: 'Dermatology (Skin)',
    bone: 'Orthopedics (Bone & Muscle)',
    respiratory: 'Pulmonology (Respiratory)',
};

function PatientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            if (!user.patient_profile) {
                navigate('/patient/complete-profile');
                return;
            }
            fetchData();
        }
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const doctorsRes = await axios.get(`/api/doctors/?category=${user.patient_profile.health_issue_category}`);
            setDoctors(doctorsRes.data);

            const appointmentsRes = await axios.get('/api/appointments/');
            setAppointments(appointmentsRes.data);
        } catch (err) {
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const handleMakeAppointment = async (doctorId) => {
        try {
            await axios.post('/api/appointments/', { doctor_id: doctorId });
            alert('Appointment successfully booked!');
            fetchData();
        } catch (err) {
            alert('Failed to book appointment. You may already have an open appointment.');
        }
    };

    // --- NEW FUNCTION TO HANDLE APPOINTMENT REMOVAL ---
    const handleRemoveAppointment = async (appointmentId) => {
        if (window.confirm('Are you sure you want to remove this appointment?')) {
            try {
                await axios.delete(`/api/appointments/${appointmentId}/`);
                alert('Appointment removed successfully.');
                fetchData(); // Refresh the list
            } catch (err) {
                const errorMessage = err.response?.data?.error || 'Failed to remove appointment.';
                alert(errorMessage);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading || !user || !user.patient_profile) {
        return <div>Loading Patient Dashboard...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Patient Home</h1>
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, {user.first_name || user.username}!</span>
                    <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
                </div>
            </header>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '20px' }}>
                <section>
                    {/* Doctor Dashboard Section - No changes here */}
                    <h2>Doctor's Dashboard</h2>
                    <p>Showing doctors for: <strong>{healthCategories[user.patient_profile.health_issue_category]}</strong></p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        {/* Table head and body for doctors remains the same */}
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Name</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Experience</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Education</th>
                                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.length > 0 ? doctors.map(doc => (
                                <tr key={doc.id}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Dr. {doc.first_name} {doc.last_name}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doc.doctor_profile.years_of_experience} years</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doc.doctor_profile.educational_background}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                        <button onClick={() => handleMakeAppointment(doc.id)} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                            Make Appointment
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No doctors found for your category.</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>

                <aside style={{ borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
                    {/* Appointments Section - UPDATED */}
                    <h2>My Appointments</h2>
                    {appointments.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {appointments.map(apt => (
                                <li key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px', backgroundColor: apt.status === 'completed' ? '#e9f5e9' : '#fff' }}>
                                    <div>
                                        <strong>Dr. {apt.doctor.first_name} {apt.doctor.last_name}</strong>
                                        <br />
                                        <small>Booked: {new Date(apt.created_at).toLocaleDateString()}</small>
                                        <p style={{ margin: '5px 0 0', fontWeight: 'bold', color: apt.status === 'completed' ? 'green' : 'orange' }}>
                                            Status: {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                        </p>
                                    </div>
                                    {/* --- ADDED REMOVE BUTTON CONDITIONALLY --- */}
                                    {apt.status === 'booked' && (
                                        <button onClick={() => handleRemoveAppointment(apt.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', height: 'fit-content' }}>
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>You have no appointments.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default PatientDashboard;
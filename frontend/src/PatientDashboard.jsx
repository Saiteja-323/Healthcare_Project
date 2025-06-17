// src/PatientDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal'; // <-- IMPORT THE MODAL

const healthCategories = {
    heart: 'Cardiology (Heart)',
    skin: 'Dermatology (Skin)',
    bone: 'Orthopedics (Bone & Muscle)',
    respiratory: 'Pulmonology (Respiratory)',
};

// Convert object to array for dropdown mapping
const categoryOptions = Object.entries(healthCategories).map(([value, label]) => ({ value, label }));

function PatientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // --- NEW STATE MANAGEMENT ---
    const [selectedCategory, setSelectedCategory] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        if (user) {
            if (!user.patient_profile) {
                navigate('/patient/complete-profile');
                return;
            }
            // Initialize selected category from user's profile
            setSelectedCategory(user.patient_profile.health_issue_category);
            fetchAppointments(); // Fetch appointments on initial load
        }
    }, [user, navigate]);

    // --- EFFECT TO FETCH DOCTORS WHEN CATEGORY CHANGES ---
    useEffect(() => {
        if (selectedCategory) {
            fetchDoctors();
        }
    }, [selectedCategory]);

    const fetchDoctors = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/doctors/?category=${selectedCategory}`);
            setDoctors(res.data);
        } catch (err) {
            setError('Failed to load doctors for the selected category.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('/api/appointments/');
            setAppointments(res.data);
        } catch (err) {
            setError(prev => `${prev} Failed to load appointments.`);
        }
    };
    
    // --- COMBINED REFRESH FUNCTION ---
    const refreshDashboard = () => {
        fetchDoctors();
        fetchAppointments();
    };

    const handleOpenAppointmentModal = (doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleRemoveAppointment = async (appointmentId) => {
        if (window.confirm('Are you sure you want to remove this appointment?')) {
            try {
                await axios.delete(`/api/appointments/${appointmentId}/`);
                alert('Appointment removed successfully.');
                fetchAppointments(); // Refresh just the appointments list
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

    if (loading && !doctors.length) {
        return <div>Loading Patient Dashboard...</div>;
    }
    
    if (!user || !user.patient_profile) {
        return <div>Redirecting...</div>
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
             {/* --- MODAL RENDER --- */}
            {isModalOpen && (
                <AppointmentModal
                    doctor={selectedDoctor}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshDashboard}
                />
            )}

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
                    <h2>Doctor's Dashboard</h2>
                    {/* --- DYNAMIC DROPDOWN --- */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="category-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>Showing doctors for:</label>
                        <select
                            id="category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{ padding: '8px', fontSize: '16px' }}
                        >
                            {categoryOptions.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                        <button onClick={() => handleOpenAppointmentModal(doc)} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                            Make Appointment
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>{loading ? 'Loading...' : 'No doctors found for this category.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>

                <aside style={{ borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
                    <h2>My Appointments</h2>
                    {appointments.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {appointments.map(apt => (
                                <li key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px', backgroundColor: apt.status === 'completed' ? '#e9f5e9' : '#fff' }}>
                                    <div>
                                        <strong>Dr. {apt.doctor.first_name} {apt.doctor.last_name}</strong>
                                        <br />
                                        {/* --- DISPLAY DATE AND TIME --- */}
                                        <small>Date: {format(new Date(apt.appointment_date), 'EEE, MMM dd, yyyy')}</small>
                                        <br/>
                                        <small>Time: {apt.time_slot.replace('-', ' to ')}</small>
                                        <p style={{ margin: '5px 0 0', fontWeight: 'bold', color: apt.status === 'completed' ? 'green' : 'orange' }}>
                                            Status: {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                        </p>
                                    </div>
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
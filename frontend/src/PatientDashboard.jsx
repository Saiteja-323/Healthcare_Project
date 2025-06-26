// src/PatientDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal';

const healthCategories = {
    heart: 'Cardiology (Heart)',
    skin: 'Dermatology (Skin)',
    bone: 'Orthopedics (Bone & Muscle)',
    respiratory: 'Pulmonology (Respiratory)',
};

const categoryOptions = Object.entries(healthCategories).map(([value, label]) => ({ value, label }));

function PatientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [restrictedDates, setRestrictedDates] = useState({});

    useEffect(() => {
        if (user) {
            if (!user.patient_profile) {
                navigate('/patient/complete-profile');
                return;
            }
            setSelectedCategory(user.patient_profile.health_issue_category);
            fetchAppointments(); 
        }
    }, [user, navigate]);

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
        } catch {
            setError('Failed to load doctors for the selected category.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('/api/appointments/');
            const apts = res.data;
            setAppointments(apts);

            // Process cancelled appointments to set booking restrictions
            const restrictions = {};
            apts.filter(apt => apt.status === 'cancelled' && apt.suggestion_date)
                .forEach(apt => {
                    restrictions[apt.doctor.id] = apt.suggestion_date;
                });
            setRestrictedDates(restrictions);

        } catch {
            setError(prev => `${prev} Failed to load appointments.`);
        }
    };
    
    const refreshDashboard = () => {
        if(selectedCategory) fetchDoctors();
        fetchAppointments();
    };

    const handleOpenAppointmentModal = (doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading && !doctors.length) return <div>Loading Patient Dashboard...</div>;
    if (!user || !user.patient_profile) return <div>Redirecting...</div>;
    
    const getStatusStyle = (status) => {
        switch(status) {
            case 'completed': return { color: 'green', fontWeight: 'bold' };
            case 'accepted': return { color: 'blue', fontWeight: 'bold' };
            case 'pending': return { color: 'orange', fontWeight: 'bold' };
            case 'cancelled': return { color: 'red', fontWeight: 'bold' };
            default: return {};
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {isModalOpen && (
                <AppointmentModal
                    doctor={selectedDoctor}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshDashboard}
                    restrictedUntilDate={restrictedDates[selectedDoctor.id]}
                />
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Patient Home</h1>
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, {user.first_name || user.username}!</span>
                    <Link to="/patient/history" style={{marginRight: '15px', padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px'}}>
                        View Medical History
                    </Link>
                    <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
                </div>
            </header>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '20px' }}>
                <section>
                    <h2>Find a Doctor</h2>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="category-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>Showing doctors for:</label>
                        <select id="category-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '8px', fontSize: '16px' }}>
                            {categoryOptions.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
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
                                            Book Appointment
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
                                <li key={apt.id} style={{ border: '1px solid #ddd', padding: '12px', marginBottom: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
                                    <div>
                                        <strong>Dr. {apt.doctor.first_name} {apt.doctor.last_name}</strong>
                                        <br />
                                        <small>Date: {format(new Date(apt.appointment_date), 'EEE, MMM dd, yyyy')}</small>
                                        <br/>
                                        <small>Time: {apt.time_slot.replace('-', ' to ')}</small>
                                        <p style={{ margin: '8px 0 0' }}>
                                            Status: <span style={getStatusStyle(apt.status)}>{apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span>
                                        </p>
                                        {apt.status === 'cancelled' && apt.suggestion_message && (
                                            <div style={{marginTop: '5px', padding: '8px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px'}}>
                                                <strong style={{color: '#856404'}}>Suggestion:</strong>
                                                <p style={{margin: '4px 0 0', fontSize: '0.9em'}}>{apt.suggestion_message}</p>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>You have no appointments scheduled.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default PatientDashboard;
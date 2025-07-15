// --- UPDATED FILE: src/PatientDashboard.jsx ---

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import AppointmentModal from './AppointmentModal';
import PaymentModal from './PaymentModal'; // <-- NEW IMPORT

const healthCategories = {
    heart: 'Cardiology (Heart)',
    skin: 'Dermatology (Skin)',
    bone: 'Orthopedics (Bone & Muscle)',
    respiratory: 'Pulmonology (Respiratory)',
};
const categoryOptions = Object.entries(healthCategories).map(([value, label]) => ({ value, label }));
const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
};

function PatientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [restrictedDates, setRestrictedDates] = useState({});

    // --- NEW STATE FOR MODALS ---
    const [isEmergencyBooking, setIsEmergencyBooking] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, amount: 0 });

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
        if (selectedCategory) fetchDoctors();
    }, [selectedCategory]);

    const fetchDoctors = async () => {
        setLoading(true); setError('');
        try {
            const res = await axios.get(`/api/doctors/?category=${selectedCategory}`);
            setDoctors(res.data);
        } catch { setError('Failed to load doctors.'); } finally { setLoading(false); }
    };

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('/api/appointments/');
            setAppointments(res.data);
            const restrictions = {};
            res.data.filter(apt => apt.status === 'cancelled' && apt.suggestion_date)
                .forEach(apt => { restrictions[apt.doctor.id] = apt.suggestion_date; });
            setRestrictedDates(restrictions);
        } catch { setError(prev => `${prev} Failed to load appointments.`); }
    };
    
    const refreshDashboard = () => {
        if(selectedCategory) fetchDoctors();
        fetchAppointments();
    };

    // --- UPDATED BOOKING FLOW ---
    const handleOpenPaymentModal = (doctor, isEmergency) => {
        setSelectedDoctor(doctor);
        setIsEmergencyBooking(isEmergency);
        setPaymentModal({
            isOpen: true,
            amount: isEmergency ? 2000 : 1000,
        });
    };

    const handlePaymentConfirm = () => {
        setPaymentModal({ isOpen: false, amount: 0 });
        setIsAppointmentModalOpen(true); // Open appointment modal after payment
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const handlePatientCancel = async (appointmentId) => {
        if (window.confirm('Are you sure you want to cancel this booked appointment? The doctor will be notified.')) {
            try {
                await axios.patch(`/api/appointments/${appointmentId}/manage/`, { action: 'cancel' });
                alert('Appointment cancelled successfully.');
                fetchAppointments(); 
            } catch (err) { alert(err.response?.data?.error || 'Failed to cancel appointment.'); }
        }
    };

    const handleDeleteRequest = async (appointmentId) => {
        if (window.confirm('Are you sure you want to withdraw this appointment request?')) {
            try {
                await axios.delete(`/api/appointments/${appointmentId}/manage/`);
                // --- UPDATED MESSAGE ---
                alert('The money has been refunded.');
                setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
            } catch (err) { alert(err.response?.data?.error || 'Failed to withdraw the request.'); }
        }
    };

    if (loading && !doctors.length && !appointments.length) return <div>Loading Patient Dashboard...</div>;
    if (!user || !user.patient_profile) return <div>Redirecting...</div>;
    
    const getStatusStyle = (status) => ({ color: { completed: 'green', accepted: 'blue', pending: 'orange', cancelled: 'red' }[status] || 'black', fontWeight: 'bold' });
    const getDisplayStatus = (status) => status === 'accepted' ? 'Booked' : status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {paymentModal.isOpen && <PaymentModal 
                amount={paymentModal.amount}
                isEmergency={isEmergencyBooking}
                onClose={() => setPaymentModal({ isOpen: false, amount: 0 })}
                onConfirm={handlePaymentConfirm}
            />}
            {isAppointmentModalOpen && <AppointmentModal 
                doctor={selectedDoctor} 
                isEmergency={isEmergencyBooking}
                onClose={() => setIsAppointmentModalOpen(false)} 
                onSuccess={refreshDashboard} 
                restrictedUntilDate={restrictedDates[selectedDoctor.id]}
            />}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Patient Home</h1>
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, {user.first_name || user.username}!</span>
                    <Link to="/patient/diagnostic-reports" style={styles.navLink}>Test Reports</Link>
                    <Link to="/patient/medication-bills" style={styles.navLink}>Medication Bills</Link>
                    <Link to="/patient/history" style={styles.navLink}>Medical History</Link>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
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
                                <th style={{ border: '1px solid #ddd', padding: '10px', minWidth: '280px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.length > 0 ? doctors.map(doc => (
                                <tr key={doc.id}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Dr. {doc.first_name} {doc.last_name}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doc.doctor_profile.years_of_experience} years</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doc.doctor_profile.educational_background}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                        {/* --- UPDATED BUTTONS --- */}
                                        <button onClick={() => handleOpenPaymentModal(doc, false)} style={styles.button}>
                                            Book Appointment
                                        </button>
                                        <button onClick={() => handleOpenPaymentModal(doc, true)} style={{...styles.button, ...styles.emergencyButton}}>
                                            🆘 Emergency Book
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>{loading ? 'Loading...' : 'No doctors found.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>
                
                <aside style={{ borderLeft: '1px solid #eee', paddingLeft: '30px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                    <h2>My Appointments</h2>
                    {appointments.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {appointments.map(apt => (
                                <li key={apt.id} style={{ border: '1px solid #ddd', padding: '12px', marginBottom: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
                                    <div>
                                        <strong>Dr. {apt.doctor.first_name} {apt.doctor.last_name}</strong><br />
                                        <small>Date: {format(parseDateAsLocal(apt.appointment_date), 'EEE, MMM dd, yyyy')}</small><br/>
                                        <small>Time: {apt.time_slot.replace('-', ' to ')}</small>
                                        <p style={{ margin: '8px 0 0' }}>Status: <span style={getStatusStyle(apt.status)}>{getDisplayStatus(apt.status)}</span>
                                            {apt.is_emergency && apt.status === 'accepted' && <span style={{color: 'red', marginLeft: '10px'}}> (Emergency)</span>}
                                        </p>
                                        
                                        {apt.status === 'pending' && (
                                            <button onClick={() => handleDeleteRequest(apt.id)} style={styles.actionButton}>
                                                Withdraw Request
                                            </button>
                                        )}
                                        {apt.status === 'accepted' && (
                                            <button onClick={() => handlePatientCancel(apt.id)} style={{...styles.actionButton, backgroundColor: '#6c757d'}}>
                                                Cancel Appointment
                                            </button>
                                        )}
                                        {apt.status === 'cancelled' && apt.suggestion_message && (
                                            <div style={styles.suggestionBox}>
                                                <strong style={{color: '#856404'}}>Suggestion:</strong>
                                                <p style={{margin: '4px 0 0', fontSize: '0.9em'}}>{apt.suggestion_message}</p>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p>You have no appointments scheduled.</p>}
                </aside>
            </div>
        </div>
    );
}

const styles = {
    navLink: { marginRight: '15px', padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px' },
    logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' },
    button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
    emergencyButton: { backgroundColor: '#c82333' },
    actionButton: { marginTop: '8px', padding: '4px 8px', fontSize: '0.8em', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'},
    suggestionBox: { marginTop: '5px', padding: '8px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px' },
};

export default PatientDashboard;
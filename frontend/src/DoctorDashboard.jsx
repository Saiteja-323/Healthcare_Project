// src/DoctorDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import TreatmentFormModal from './TreatmentFormModal'; // <-- NEW
import CancelAppointmentModal from './CancelAppointmentModal'; // <-- NEW

function DoctorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // Separate state for pending and accepted appointments
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [acceptedAppointments, setAcceptedAppointments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for modals
    const [treatmentModal, setTreatmentModal] = useState({ isOpen: false, appointment: null });
    const [cancelModal, setCancelModal] = useState({ isOpen: false, appointment: null });

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
            // Filter appointments into two lists
            setPendingAppointments(response.data.filter(apt => apt.status === 'pending'));
            setAcceptedAppointments(response.data.filter(apt => apt.status === 'accepted'));
        } catch {
            setError('Failed to fetch patient appointments.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleAccept = async (appointmentId) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}/manage/`, { action: 'accept' });
            fetchAppointments(); // Refresh lists
        } catch {
            alert('Failed to accept appointment.');
        }
    };

    const handleOpenCancelModal = (appointment) => {
        setCancelModal({ isOpen: true, appointment });
    };

    const handleOpenTreatmentModal = (appointment) => {
        setTreatmentModal({ isOpen: true, appointment });
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
            {/* --- MODALS --- */}
            {cancelModal.isOpen && (
                <CancelAppointmentModal
                    appointment={cancelModal.appointment}
                    onClose={() => setCancelModal({ isOpen: false, appointment: null })}
                    onSuccess={fetchAppointments}
                />
            )}
            {treatmentModal.isOpen && (
                <TreatmentFormModal
                    appointment={treatmentModal.appointment}
                    onClose={() => setTreatmentModal({ isOpen: false, appointment: null })}
                    onSuccess={fetchAppointments}
                />
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Doctor's Dashboard</h1>
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, Dr. {user.last_name || user.username}!</span>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                </div>
            </header>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {/* --- PENDING APPOINTMENTS SECTION --- */}
            <section>
                <h2>Pending Appointment Requests ({pendingAppointments.length})</h2>
                {pendingAppointments.length > 0 ? (
                    <table style={styles.table}>
                        <thead style={styles.thead}><tr style={styles.tr}><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Attached Report</th><th style={styles.th}>Actions</th></tr></thead>
                        <tbody>
                            {pendingAppointments.map(apt => (
                                <tr key={apt.id} style={styles.tr}>
                                    <td style={styles.td}>{apt.patient.first_name} {apt.patient.last_name}</td>
                                    <td style={styles.td}>{apt.patient.patient_profile?.current_symptoms || 'N/A'}</td>
                                    <td style={styles.td}>{format(new Date(apt.appointment_date), 'EEE, MMM dd, yyyy')} at {apt.time_slot}</td>
                                    <td style={styles.td}>{apt.initial_report ? <a href={apt.initial_report} target="_blank" rel="noopener noreferrer">View Report</a> : 'None'}</td>
                                    <td style={{...styles.td, textAlign: 'center'}}>
                                        <button onClick={() => handleAccept(apt.id)} style={{...styles.button, ...styles.acceptButton}}>Accept</button>
                                        <button onClick={() => handleOpenCancelModal(apt)} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p>No new appointment requests.</p>}
            </section>

            {/* --- UPCOMING APPOINTMENTS SECTION --- */}
            <section style={{marginTop: '40px'}}>
                <h2>Upcoming Confirmed Appointments ({acceptedAppointments.length})</h2>
                {acceptedAppointments.length > 0 ? (
                    <table style={styles.table}>
                        <thead style={styles.thead}><tr style={styles.tr}><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Medical History</th><th style={styles.th}>Action</th></tr></thead>
                        <tbody>
                            {acceptedAppointments.map(apt => (
                                <tr key={apt.id} style={styles.tr}>
                                    <td style={styles.td}>{apt.patient.first_name} {apt.patient.last_name}</td>
                                    <td style={styles.td}>{apt.patient.patient_profile?.current_symptoms || 'N/A'}</td>
                                    <td style={styles.td}>{format(new Date(apt.appointment_date), 'EEE, MMM dd, yyyy')} at {apt.time_slot}</td>
                                    <td style={styles.td}>{apt.patient.patient_profile?.medical_history || 'N/A'}</td>
                                    <td style={{...styles.td, textAlign: 'center'}}>
                                        <button onClick={() => handleOpenTreatmentModal(apt)} style={{...styles.button, ...styles.completeButton}}>Finalize & Prescribe</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p>No upcoming appointments.</p>}
            </section>
        </div>
    );
}

// Basic styles for reusability
const styles = {
    logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    thead: { backgroundColor: '#f8f9fa' },
    tr: {},
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '10px' },
    button: { border: 'none', padding: '6px 12px', borderRadius: '4px', color: 'white', cursor: 'pointer', marginRight: '5px'},
    acceptButton: { backgroundColor: '#28a745' },
    cancelButton: { backgroundColor: '#ffc107', color: 'black' },
    completeButton: { backgroundColor: '#007bff' }
};

export default DoctorDashboard;
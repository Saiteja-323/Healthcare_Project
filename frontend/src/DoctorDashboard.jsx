// --- CORRECTED FILE: frontend/src/DoctorDashboard.jsx ---

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import TreatmentFormModal from './TreatmentFormModal';
import CancelAppointmentModal from './CancelAppointmentModal';

const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
};

function DoctorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [acceptedAppointments, setAcceptedAppointments] = useState([]);
    const [completedAppointments, setCompletedAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [treatmentModal, setTreatmentModal] = useState({ isOpen: false, appointment: null });
    const [cancelModal, setCancelModal] = useState({ isOpen: false, appointment: null });

    useEffect(() => {
        if (user) {
            if (!user.doctor_profile) {
                navigate('/doctor/complete-profile');
                return; 
            }
            fetchAllAppointments();
        }
    }, [user, navigate]);

    const fetchAllAppointments = () => {
        setLoading(true);
        setError('');
        Promise.all([
            axios.get('/api/appointments/'),      // Fetches pending and accepted
            axios.get('/api/appointments/history/') // Fetches completed
        ]).then(([activeRes, completedRes]) => {
            // FIX: Ensure data is an array before filtering
            const activeData = Array.isArray(activeRes.data) ? activeRes.data : [];
            const completedData = Array.isArray(completedRes.data) ? completedRes.data : [];

            setPendingAppointments(activeData.filter(apt => apt.status === 'pending'));
            // --- BUG FIX: Was `active.data`, corrected to `activeRes.data` (via activeData) ---
            setAcceptedAppointments(activeData.filter(apt => apt.status === 'accepted'));
            setCompletedAppointments(completedData);
        }).catch(() => {
            setError('Failed to fetch appointments.');
        }).finally(() => {
            setLoading(false);
        });
    };
    
    const handleAccept = async (appointmentId) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}/manage/`, { action: 'accept' });
            fetchAllAppointments(); // Refresh all lists
        } catch {
            alert('Failed to accept appointment.');
        }
    };

    const handleOpenCancelModal = (appointment) => setCancelModal({ isOpen: true, appointment });
    const handleOpenTreatmentModal = (appointment) => setTreatmentModal({ isOpen: true, appointment });
    const handleLogout = () => { logout(); navigate('/login'); };

    if (loading) {
        return <div>Loading Doctor Dashboard...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {cancelModal.isOpen && <CancelAppointmentModal appointment={cancelModal.appointment} onClose={() => setCancelModal({ isOpen: false, appointment: null })} onSuccess={fetchAllAppointments} />}
            {treatmentModal.isOpen && <TreatmentFormModal appointment={treatmentModal.appointment} onClose={() => setTreatmentModal({ isOpen: false, appointment: null })} onSuccess={fetchAllAppointments} />}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Doctor's Dashboard</h1>
                <div>
                    <Link to="/doctor/diagnostic-center" style={styles.navLink}>Manage Tests</Link>
                    <Link to="/doctor/medical-payments" style={styles.navLink}>Manage Payments</Link>
                    <span style={{ marginRight: '15px', marginLeft: '15px' }}>Hi, Dr. {user?.last_name || user?.username}!</span>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                </div>
            </header>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <section>
                <h2>Pending Appointment Requests ({pendingAppointments.length})</h2>
                {pendingAppointments.length > 0 ? (
                    <table style={styles.table}>
                        <thead style={styles.thead}><tr><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Attached Report</th><th style={styles.th}>Actions</th></tr></thead>
                        <tbody>
                            {pendingAppointments.map(apt => (
                                <tr key={apt.id}>
                                    <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}</td>
                                    <td style={styles.td}>{apt.patient?.patient_profile?.current_symptoms || 'N/A'}</td>
                                    <td style={styles.td}>{format(parseDateAsLocal(apt.appointment_date), 'EEE, MMM dd, yyyy')} at {apt.time_slot}</td>
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

            <section style={{marginTop: '40px'}}>
                <h2>Upcoming Confirmed Appointments ({acceptedAppointments.length})</h2>
                {acceptedAppointments.length > 0 ? (
                    <table style={styles.table}>
                        <thead style={styles.thead}><tr><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Date & Time</th><th style={styles.th}>Medical History</th><th style={styles.th}>Action</th></tr></thead>
                        <tbody>
                            {acceptedAppointments.map(apt => (
                                <tr key={apt.id}>
                                    <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}</td>
                                    <td style={styles.td}>{apt.patient?.patient_profile?.current_symptoms || 'N/A'}</td>
                                    <td style={styles.td}>{format(parseDateAsLocal(apt.appointment_date), 'EEE, MMM dd, yyyy')} at {apt.time_slot}</td>
                                    <td style={styles.td}>{apt.patient?.patient_profile?.medical_history || 'N/A'}</td>
                                    <td style={{...styles.td, textAlign: 'center'}}>
                                        <button onClick={() => handleOpenTreatmentModal(apt)} style={{...styles.button, ...styles.completeButton}}>Finalize & Prescribe</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p>No upcoming appointments.</p>}
            </section>

            <section style={{marginTop: '40px'}}>
                <h2>Completed Appointments History ({completedAppointments.length})</h2>
                {completedAppointments.length > 0 ? (
                     <table style={styles.table}>
                        <thead style={styles.thead}><tr><th style={styles.th}>Patient</th><th style={styles.th}>Date</th><th style={styles.th}>View Prescription</th></tr></thead>
                        <tbody>
                            {completedAppointments.map(apt => (
                                <tr key={apt.id}>
                                    <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}</td>
                                    <td style={styles.td}>{format(parseDateAsLocal(apt.appointment_date), 'EEE, MMM dd, yyyy')}</td>
                                    <td style={styles.td}>
                                        <Link to="/patient/history">View in History</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p>No completed appointments in your history yet.</p>}
            </section>
        </div>
    );
}

const styles = {
    navLink: { padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '10px' },
    logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    thead: { backgroundColor: '#f8f9fa' },
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '10px' },
    button: { border: 'none', padding: '6px 12px', borderRadius: '4px', color: 'white', cursor: 'pointer', marginRight: '5px'},
    acceptButton: { backgroundColor: '#28a745' },
    cancelButton: { backgroundColor: '#ffc107', color: 'black' },
    completeButton: { backgroundColor: '#007bff' }
};

export default DoctorDashboard;
// --- CORRECTED FILE: frontend/src/DoctorDashboard.jsx ---

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { format, isEqual, startOfDay } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import TreatmentFormModal from './TreatmentFormModal';
import CancelAppointmentModal from './CancelAppointmentModal';

const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
};

// This function groups appointments by status, and then by slot for active ones
const groupAppointments = (appointments) => {
    const grouped = {
        pending: {},
        accepted: {},
    };

    appointments.forEach(apt => {
        const slotKey = `${format(parseDateAsLocal(apt.appointment_date), 'yyyy-MM-dd')}@${apt.time_slot}`;
        if (apt.status === 'pending') {
            if (!grouped.pending[slotKey]) grouped.pending[slotKey] = [];
            grouped.pending[slotKey].push(apt);
        } else if (apt.status === 'accepted') {
            if (!grouped.accepted[slotKey]) grouped.accepted[slotKey] = [];
            grouped.accepted[slotKey].push(apt);
        }
    });

    return grouped;
};

function DoctorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [appointments, setAppointments] = useState([]);
    const [completedAppointments, setCompletedAppointments] = useState([]);
    
    // --- FIX: State now stores the full unavailability object {id, date} ---
    const [unavailability, setUnavailability] = useState([]);
    
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
            fetchAllData();
        }
    }, [user, navigate]);
    
    const fetchAllData = () => {
        setLoading(true);
        setError('');
        Promise.all([
            axios.get('/api/appointments/'),
            axios.get('/api/appointments/history/'),
            axios.get('/api/doctor/unavailability/')
        ]).then(([activeRes, completedRes, unavailRes]) => {
            setAppointments(Array.isArray(activeRes.data) ? activeRes.data : []);
            setCompletedAppointments(Array.isArray(completedRes.data) ? completedRes.data : []);
            // --- FIX: Store the full object, not just the date ---
            setUnavailability(Array.isArray(unavailRes.data) ? unavailRes.data : []);
        }).catch(() => {
            setError('Failed to fetch dashboard data.');
        }).finally(() => {
            setLoading(false);
        });
    };
    
    const groupedAppointments = useMemo(() => groupAppointments(appointments), [appointments]);

    const handleAccept = async (appointmentId) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}/manage/`, { action: 'accept' });
            fetchAllData(); 
        } catch { alert('Failed to accept appointment.'); }
    };
    
    const handleBulkCancel = async (slotKey) => {
        const [date, slot] = slotKey.split('@');
        if (window.confirm(`Are you sure you want to cancel ALL appointments for ${slot} on ${date}? This will notify all patients in the slot.`)) {
            try {
                await axios.post('/api/appointments/bulk-cancel/', { 
                    appointment_date: date, 
                    time_slot: slot,
                    suggestion_message: `The doctor's slot at ${slot} on ${date} has been cancelled.`
                });
                alert('Slot cancelled successfully.');
                fetchAllData();
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to cancel the slot.');
            }
        }
    };
    
    // --- FIX: Corrected unavailability logic ---
    const handleUnavailabilityChange = async (clickedDate) => {
        const dateStr = format(startOfDay(clickedDate), 'yyyy-MM-dd');
        const existingRecord = unavailability.find(d => d.date === dateStr);

        try {
            if (existingRecord) {
                // If the date exists, delete it
                await axios.delete(`/api/doctor/unavailability/${existingRecord.id}/`);
            } else {
                // If the date does not exist, add it
                await axios.post('/api/doctor/unavailability/', { date: dateStr });
            }
            // Refresh all data from the server to ensure UI consistency
            fetchAllData();
        } catch (err) {
            console.error("Unavailability update error:", err);
            alert('Failed to update unavailability status.');
        }
    };

    // Helper to pass an array of Date objects to the calendar for highlighting
    const unavailableDateObjects = useMemo(() => {
        return unavailability.map(d => parseDateAsLocal(d.date));
    }, [unavailability]);

    // Function to style the calendar tiles
    const tileClassName = ({ date, view }) => {
        if (view === 'month' && unavailableDateObjects.some(d => isEqual(startOfDay(d), startOfDay(date)))) {
            return 'unavailable-tile';
        }
        return null;
    };
    
    const handleOpenTreatmentModal = (appointment) => setTreatmentModal({ isOpen: true, appointment });
    const handleLogout = () => { logout(); navigate('/login'); };

    if (loading) return <div>Loading Doctor Dashboard...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <style>{`.unavailable-tile { background-color: #ffcdd2 !important; border-radius: 50%; }`}</style>
            
            {treatmentModal.isOpen && <TreatmentFormModal appointment={treatmentModal.appointment} onClose={() => setTreatmentModal({ isOpen: false, appointment: null })} onSuccess={fetchAllData} />}
            {cancelModal.isOpen && <CancelAppointmentModal appointment={cancelModal.appointment} onClose={() => setCancelModal({ isOpen: false, appointment: null })} onSuccess={fetchAllData} />}

            <header style={styles.header}>
                <h1>{user?.first_name} {user?.last_name} Hospital</h1>
                <div>
                    <Link to="/doctor/diagnostic-center" style={styles.navLink}>Manage Tests</Link>
                    <Link to="/doctor/medical-payments" style={styles.navLink}>Manage Payments</Link>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                </div>
            </header>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div style={styles.mainGrid}>
                {/* APPOINTMENTS SECTION */}
                <div style={styles.appointmentsColumn}>
                    <section>
                        <h2>Pending Appointment Requests</h2>
                        {Object.keys(groupedAppointments.pending).length > 0 ? Object.entries(groupedAppointments.pending).map(([slotKey, apts]) => (
                            <div key={slotKey} style={styles.slotGroup}>
                                <div style={styles.slotHeader}>
                                    <h4>{format(parseDateAsLocal(apts[0].appointment_date), 'EEE, MMM dd, yyyy')} at {apts[0].time_slot}</h4>
                                </div>
                                <table style={styles.table}>
                                    <tbody>
                                        {apts.map(apt => (
                                            <tr key={apt.id}>
                                                <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}</td>
                                                <td style={styles.td}>{apt.patient?.patient_profile?.current_symptoms || 'N/A'}</td>
                                                <td style={{...styles.td, textAlign: 'center'}}>
                                                    <button onClick={() => handleAccept(apt.id)} style={{...styles.button, ...styles.acceptButton}}>Accept</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )) : <p>No new appointment requests.</p>}
                    </section>

                    <section style={{marginTop: '40px'}}>
                        <h2>Upcoming Confirmed Appointments</h2>
                        {Object.keys(groupedAppointments.accepted).length > 0 ? Object.entries(groupedAppointments.accepted).map(([slotKey, apts]) => (
                            <div key={slotKey} style={styles.slotGroup}>
                                <div style={styles.slotHeader}>
                                    <h4>{format(parseDateAsLocal(apts[0].appointment_date), 'EEE, MMM dd, yyyy')} at {apts[0].time_slot}</h4>
                                    <button onClick={() => handleBulkCancel(slotKey)} style={{...styles.button, ...styles.cancelButton}}>Cancel Slot</button>
                                </div>
                                <table style={styles.table}>
                                    <thead><tr><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Action</th></tr></thead>
                                    <tbody>
                                        {apts.map(apt => (
                                            <tr key={apt.id} style={apt.is_emergency ? {backgroundColor: '#fff0f1'} : {}}>
                                                <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}
                                                    {apt.is_emergency && <span style={{color: 'red', fontWeight: 'bold'}}> 🔴 Emergency!!!</span>}
                                                </td>
                                                <td style={styles.td}>{apt.patient?.patient_profile?.current_symptoms || 'N/A'}</td>
                                                <td style={{...styles.td, textAlign: 'center'}}>
                                                    <button onClick={() => handleOpenTreatmentModal(apt)} style={{...styles.button, ...styles.completeButton}}>Finalize & Prescribe</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )) : <p>No upcoming appointments.</p>}
                    </section>
                </div>

                {/* SIDEBAR SECTION */}
                <div style={styles.sidebarColumn}>
                    <section>
                        <h2>Unavailability Dates</h2>
                        <Calendar
                            onClickDay={handleUnavailabilityChange}
                            value={unavailableDateObjects}
                            minDate={new Date()}
                            tileClassName={tileClassName}
                        />
                        <p style={{fontSize: '0.8em', color: '#666', marginTop: '10px'}}>Click a date to mark it as unavailable. Click an unavailable date again to remove it.</p>
                    </section>
                    
                    <section style={{marginTop: '40px'}}>
                        <h2>Completed Appointments History</h2>
                        {completedAppointments.length > 0 ? (
                            <table style={styles.table}>
                                <thead style={styles.thead}><tr><th style={styles.th}>Patient</th><th style={styles.th}>Date</th><th style={styles.th}>View</th></tr></thead>
                                <tbody>
                                    {completedAppointments.map(apt => (
                                        <tr key={apt.id}>
                                            <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}</td>
                                            <td style={styles.td}>{format(parseDateAsLocal(apt.appointment_date), 'MMM dd, yyyy')}</td>
                                            <td style={styles.td}>
                                                <Link to={`/doctor/history/${apt.id}`}>View Details</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p>No completed appointments yet.</p>}
                    </section>
                </div>
            </div>
        </div>
    );
}

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' },
    mainGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' },
    appointmentsColumn: {},
    sidebarColumn: { borderLeft: '1px solid #eee', paddingLeft: '30px' },
    navLink: { padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px', marginRight: '10px' },
    logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { backgroundColor: '#f8f9fa' },
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '10px', verticalAlign: 'middle' },
    button: { border: 'none', padding: '6px 12px', borderRadius: '4px', color: 'white', cursor: 'pointer', marginRight: '5px'},
    acceptButton: { backgroundColor: '#28a745' },
    cancelButton: { backgroundColor: '#ffc107', color: 'black' },
    completeButton: { backgroundColor: '#007bff' },
    slotGroup: { border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' },
    slotHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #e0e0e0' },
};

export default DoctorDashboard;
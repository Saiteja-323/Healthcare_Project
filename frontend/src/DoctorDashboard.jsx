// --- UPDATED FILE: frontend/src/DoctorDashboard.jsx ---

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from './api/axios';
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
    const [unavailability, setUnavailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [treatmentModal, setTreatmentModal] = useState({ isOpen: false, appointment: null });
    // --- UPDATED: State to handle both individual and bulk cancellation modals ---
    const [cancelModal, setCancelModal] = useState({ isOpen: false, appointment: null, slotInfo: null });

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
            api.get('/api/appointments/'),
            api.get('/api/appointments/history/'),
            api.get('/api/doctor/unavailability/')
        ]).then(([activeRes, completedRes, unavailRes]) => {
            setAppointments(Array.isArray(activeRes.data) ? activeRes.data : []);
            setCompletedAppointments(Array.isArray(completedRes.data) ? completedRes.data : []);
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
            await api.patch(`/api/appointments/${appointmentId}/manage/`, { action: 'accept' });
            fetchAllData(); 
        } catch { alert('Failed to accept appointment.'); }
    };
    
    // --- NEW: Functions to open the versatile cancel modal ---
    const handleOpenSlotCancelModal = (slotKey) => {
        const [date, timeSlot] = slotKey.split('@');
        setCancelModal({ isOpen: true, slotInfo: { date, timeSlot } });
    };
    
    const handleOpenIndividualCancelModal = (appointment) => {
        setCancelModal({ isOpen: true, appointment: appointment });
    };

    const handleUnavailabilityChange = async (clickedDate) => {
        const dateStr = format(startOfDay(clickedDate), 'yyyy-MM-dd');
        const existingRecord = unavailability.find(d => d.date === dateStr);

        try {
            if (existingRecord) {
                await api.delete(`/api/doctor/unavailability/${existingRecord.id}/`);
            } else {
                await api.post('/api/doctor/unavailability/', { date: dateStr });
            }
            fetchAllData();
        } catch (err) {
            console.error("Unavailability update error:", err);
            alert('Failed to update unavailability status.');
        }
    };

    const unavailableDateObjects = useMemo(() => {
        return unavailability.map(d => parseDateAsLocal(d.date));
    }, [unavailability]);

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
            {/* --- UPDATED: Render modal with the correct props --- */}
            {cancelModal.isOpen && <CancelAppointmentModal 
                appointment={cancelModal.appointment} 
                slotInfo={cancelModal.slotInfo}
                onClose={() => setCancelModal({ isOpen: false, appointment: null, slotInfo: null })} 
                onSuccess={fetchAllData} 
            />}

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
                <div style={styles.appointmentsColumn}>
                    <section>
                        <h2>Pending Appointment Requests</h2>
                        {Object.keys(groupedAppointments.pending).length > 0 ? Object.entries(groupedAppointments.pending).map(([slotKey, apts]) => (
                            <div key={slotKey} style={styles.slotGroup}>
                                <div style={styles.slotHeader}>
                                    <h4>{format(parseDateAsLocal(apts[0].appointment_date), 'EEE, MMM dd, yyyy')} at {apts[0].time_slot}</h4>
                                    {/* --- MOVED: Cancel Slot button is now here --- */}
                                    <button onClick={() => handleOpenSlotCancelModal(slotKey)} style={{...styles.button, ...styles.cancelButton}}>Cancel Slot</button>
                                </div>
                                <table style={styles.table}>
                                    <thead><tr><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Action</th></tr></thead>
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
                                    {/* This button was moved to the pending section per requirements */}
                                </div>
                                <table style={styles.table}>
                                    <thead><tr><th style={styles.th}>Patient</th><th style={styles.th}>Symptoms</th><th style={styles.th}>Actions</th></tr></thead>
                                    <tbody>
                                        {apts.map(apt => (
                                            <tr key={apt.id} style={apt.is_emergency ? {backgroundColor: '#fff0f1'} : {}}>
                                                <td style={styles.td}>{apt.patient?.first_name} {apt.patient?.last_name}
                                                    {apt.is_emergency && <span style={{color: 'red', fontWeight: 'bold'}}> 🔴 Emergency!!!</span>}
                                                </td>
                                                <td style={styles.td}>{apt.patient?.patient_profile?.current_symptoms || 'N/A'}</td>
                                                <td style={{...styles.td, textAlign: 'center'}}>
                                                    <button onClick={() => handleOpenTreatmentModal(apt)} style={{...styles.button, ...styles.completeButton}}>Finalize</button>
                                                    {/* --- NEW: Individual cancel button for confirmed appointments --- */}
                                                    <button onClick={() => handleOpenIndividualCancelModal(apt)} style={{...styles.button, ...styles.cancelButton, backgroundColor: '#6c757d'}}>Cancel</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )) : <p>No upcoming appointments.</p>}
                    </section>
                </div>

                <div style={styles.sidebarColumn}>
                    <section>
                        <h2>Unavailability Dates</h2>
                        <Calendar
                            onClickDay={handleUnavailabilityChange}
                            value={unavailableDateObjects}
                            minDate={new Date()}
                            tileClassName={tileClassName}
                        />
                        <p style={{fontSize: '0.8em', color: '#666', marginTop: '10px'}}>Click a date to mark it as unavailable. Click again to remove the flag.</p>
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
    button: { border: 'none', padding: '6px 12px', borderRadius: '4px', color: 'white', cursor: 'pointer', marginRight: '5px', marginTop: '5px'},
    acceptButton: { backgroundColor: '#28a745' },
    cancelButton: { backgroundColor: '#ffc107', color: 'black' },
    completeButton: { backgroundColor: '#007bff' },
    slotGroup: { border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' },
    slotHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #e0e0e0' },
};

export default DoctorDashboard;
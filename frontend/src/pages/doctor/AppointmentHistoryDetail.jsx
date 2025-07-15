// --- NEW FILE: frontend/src/pages/doctor/AppointmentHistoryDetail.jsx ---

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const timingLabels = {
    mbe: 'Morning (Before Eat)', maf: 'Morning (After Eat)',
    abe: 'Afternoon (Before Eat)', aaf: 'Afternoon (After Eat)',
    nbe: 'Night (Before Eat)', naf: 'Night (After Eat)',
};

const parseDateAsLocal = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
};

function AppointmentHistoryDetail() {
    const { appointmentId } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAppointmentDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/appointments/history/${appointmentId}/`);
                setAppointment(response.data);
            } catch (err) {
                setError('Failed to fetch appointment details. You may not have permission to view this record.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (appointmentId) {
            fetchAppointmentDetails();
        }
    }, [appointmentId]);

    const renderMedicines = (medicationDetails) => {
        if (!medicationDetails || typeof medicationDetails !== 'object' || Object.keys(medicationDetails).length === 0) {
            return <p>No medicines were prescribed.</p>;
        }
        
        const allMeds = [];
        for (const category in medicationDetails) {
            if (Object.keys(medicationDetails[category]).length > 0) {
                 allMeds.push(<h4 key={category} style={{textTransform: 'capitalize', marginTop: '15px'}}>{category}</h4>)
                 const medList = (
                    <ul key={`${category}-list`}>
                        {Object.entries(medicationDetails[category]).map(([name, details]) => (
                            <li key={name}>
                                <strong>{name}</strong> (Quantity: {details.quantity})<br/>
                                <small>Timings: {details.timings?.map(t => timingLabels[t] || t).join(', ') || 'Not specified'}</small>
                            </li>
                        ))}
                    </ul>
                );
                allMeds.push(medList);
            }
        }
        return allMeds.length > 0 ? <div>{allMeds}</div> : <p>No medicines were prescribed.</p>;
    };

    const renderTests = (tests) => {
        if (!Array.isArray(tests) || tests.length === 0) {
            return <p>No tests were prescribed.</p>;
        }
        return (
            <ul>
                {tests.map(test => (
                    <li key={test.id}>
                        <strong>{test.test_name}:</strong>
                        <span style={{textTransform: 'capitalize', marginLeft: '5px'}}>
                            Result: {test.result || 'Pending'}
                        </span>
                        <span style={{marginLeft: '10px'}}>
                            (Cost: ₹{test.cost || 'N/A'}, Status: {test.is_paid ? 'Paid' : 'Unpaid'})
                        </span>
                    </li>
                ))}
            </ul>
        );
    };

    if (loading) return <div>Loading Appointment Details...</div>;
    if (error) return <div style={{padding: '20px'}}><p style={{color: 'red'}}>{error}</p><Link to="/doctor/dashboard">Back to Dashboard</Link></div>;
    if (!appointment) return <div>No appointment found.</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Appointment Record</h1>
                <Link to="/doctor/dashboard" style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                    Back to Dashboard
                </Link>
            </header>
            
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
                <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Consultation on {format(parseDateAsLocal(appointment.appointment_date), 'MMMM dd, yyyy')}
                </h2>
                <p><strong>Patient:</strong> {appointment.patient?.first_name} {appointment.patient?.last_name}</p>
                <p><strong>Symptoms Reported:</strong> {appointment.patient?.patient_profile?.current_symptoms || 'N/A'}</p>
                <p><strong>Time Slot:</strong> {appointment.time_slot}</p>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px'}}>
                    <div>
                        <h3>Prescription Details</h3>
                        {renderMedicines(appointment.medical_record?.medication_details)}
                    </div>
                    <div>
                        <h3>Diagnostic Tests Prescribed</h3>
                        {renderTests(appointment.diagnostic_tests)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppointmentHistoryDetail;
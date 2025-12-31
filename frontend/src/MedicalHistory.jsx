// --- CORRECTED FILE: frontend/src/MedicalHistory.jsx ---

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from './api/axios';

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

function MedicalHistory() {
    useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/medical-history/');
            setHistory(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Failed to fetch medical history.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const renderMedicines = (medicationDetails, isBillPaid) => {
        if (!isBillPaid) {
            return <p>Prescription details will be available after the bill is paid. <Link to="/patient/medication-bills">Go to Payments</Link>.</p>;
        }
        
        const allMeds = [];
        // FIX: Check if medicationDetails is a valid object
        if (typeof medicationDetails !== 'object' || medicationDetails === null) {
            return <p>No medicines were prescribed.</p>;
        }

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
        return allMeds.length > 0 ? <div>{allMeds}</div> : <p>No medicines were prescribed for this appointment.</p>;
    };

    const renderTests = (tests) => {
        if (!Array.isArray(tests) || tests.length === 0) {
            return <p>No tests were prescribed for this appointment.</p>;
        }

        // --- BUG FIX: Display results on a per-test basis ---
        return (
            <ul>
                {tests.map(test => (
                    <li key={test.id}>
                        <strong>{test.test_name}:</strong>
                        {test.is_paid ? 
                            <span style={{textTransform: 'capitalize', marginLeft: '5px'}}>
                                {test.result || 'Result pending'}
                            </span>
                            : 
                            <em style={{marginLeft: '5px', color: '#888'}}>
                                (Result available after payment. <Link to="/patient/diagnostic-reports">Pay Now</Link>)
                            </em>
                        }
                    </li>
                ))}
            </ul>
        );
    };

    if (loading) return <div>Loading Medical History...</div>;
    
    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Your Medical History</h1>
                <Link to="/patient/dashboard" style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                    Back to Dashboard
                </Link>
            </header>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {history.length > 0 ? (
                history.map(apt => (
                    <div key={apt.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Consultation on {format(parseDateAsLocal(apt.appointment_date), 'MMMM dd, yyyy')}
                        </h2>
                        <p><strong>Doctor:</strong> Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</p>
                        
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px'}}>
                            <div>
                                <h3>Prescription Details</h3>
                                {/* FIX: Use optional chaining for safety */}
                                {renderMedicines(apt.medical_record?.medication_details, apt.medication_bill?.is_paid)}
                            </div>
                            <div>
                                <h3>Diagnostic Test Results</h3>
                                {renderTests(apt.diagnostic_tests)}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p>You have no completed appointments with medical records yet.</p>
            )}
        </div>
    );
}

export default MedicalHistory;
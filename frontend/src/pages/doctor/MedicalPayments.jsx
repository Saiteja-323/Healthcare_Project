// --- CORRECTED FILE: src/pages/doctor/MedicalPayments.jsx ---

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function MedicalPayments() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchBills = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/doctor/medical-payments/');
            const data = Array.isArray(res.data) ? res.data : [];
            const billsWithEditState = data.map(b => ({...b, editCost: b.total_cost || ''}));
            setBills(billsWithEditState);
        } catch (err) {
            console.error("Fetch Error:", err); // Log the error
            setError('Failed to fetch medical bills.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchBills();
    }, []);

    const handleUpdate = (id, value) => {
        setBills(bills.map(b => b.id === id ? { ...b, editCost: value } : b));
    };

    const handleSend = async (bill) => {
        if (!bill.editCost || bill.editCost <= 0) {
            alert('Please set a valid total cost before sending.');
            return;
        }
        try {
            await axios.patch(`/api/doctor/medical-payments/${bill.id}/manage/`, {
                total_cost: bill.editCost,
                send_to_patient: true,
            });
            alert('Bill sent to patient successfully!');
            fetchBills();
        } catch (err) {
            console.error("Send Error:", err); // Log the error
            alert('Failed to send bill.');
        }
    };
    
    const renderMedications = (details) => {
        if (typeof details !== 'object' || details === null) return 'N/A';
        const meds = [];
        for (const cat in details) {
            if (typeof details[cat] === 'object' && details[cat] !== null) {
                meds.push(...Object.keys(details[cat]));
            }
        }
        return meds.length > 0 ? meds.join(', ') : 'No items';
    }

    if (loading && bills.length === 0) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Medical Payments - Manage Bills</h1>
                <div>
                    {/* --- FEATURE: ADDED REFRESH BUTTON --- */}
                    <button onClick={fetchBills} disabled={loading} style={{marginRight: '15px'}}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <Link to="/doctor/dashboard">Back to Dashboard</Link>
                </div>
            </header>
            {error && <p style={{color: 'red'}}>{error}</p>}
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={styles.th}>Appt. Date</th>
                        <th style={styles.th}>Patient</th>
                        <th style={styles.th}>Prescribed Items</th>
                        <th style={styles.th}>Total Cost (INR)</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {bills.length > 0 ? bills.map(bill => (
                        <tr key={bill.id}>
                            <td style={styles.td}>{bill.appointment_details?.date ? format(new Date(bill.appointment_details.date), 'dd MMM yyyy') : 'N/A'}</td>
                            <td style={styles.td}>{bill.appointment_details?.patient_name || 'N/A'}</td>
                            <td style={styles.td}>{renderMedications(bill.medication_details)}</td>
                            <td style={styles.td}>
                                <input type="number" value={bill.editCost} onChange={e => handleUpdate(bill.id, e.target.value)} disabled={bill.is_sent_to_patient} style={{width: '100px'}}/>
                            </td>
                            <td style={styles.td}>{bill.is_sent_to_patient ? 'Sent' : 'Pending'}</td>
                            <td style={styles.td}>
                                <button onClick={() => handleSend(bill)} disabled={bill.is_sent_to_patient}>
                                    {bill.is_sent_to_patient ? 'Sent' : 'Save & Send'}
                                </button>
                            </td>
                        </tr>
                    )) : <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No pending medication bills found. New bills will appear here after a prescription is submitted.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '10px' },
};

export default MedicalPayments;
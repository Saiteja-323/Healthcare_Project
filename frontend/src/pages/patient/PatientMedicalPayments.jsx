// --- CORRECTED FILE: src/pages/patient/PatientMedicalPayments.jsx ---

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function PatientMedicalPayments() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/patient/medical-payments/');
            setBills(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            // FIX: Use the 'err' variable.
            console.error("Failed to fetch bills:", err);
            setError('Failed to fetch your medication bills.');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (billId) => {
        if (!window.confirm('Proceed to payment? This is a simulation.')) return;
        try {
            await axios.patch(`/api/patient/medical-payments/${billId}/pay/`);
            alert('Payment Successful! Your prescription is now available in Medical History.');
            fetchBills();
        } catch (err) {
            // FIX: Use the 'err' variable.
            console.error("Payment failed:", err);
            alert('Payment failed. Please try again.');
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

    if (loading) return <div>Loading Bills...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Medication Bills</h1>
                <Link to="/patient/dashboard">Back to Dashboard</Link>
            </header>
            {error && <p style={{color: 'red'}}>{error}</p>}
            
            {bills.length > 0 ? (
                bills.map(bill => (
                    <div key={bill.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                        <h3>Bill for Appointment on {bill.appointment_details?.date ? format(new Date(bill.appointment_details.date), 'dd MMM yyyy') : 'N/A'}</h3>
                        <p><strong>Items:</strong> {renderMedications(bill.medication_details) || 'N/A'}</p>
                        <div style={{textAlign: 'right', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                            {bill.is_paid ? 
                                <p style={{color: 'green', fontWeight: 'bold'}}>PAID</p>
                                : <>
                                    <p><strong>Total Amount: ₹{bill.total_cost || '0.00'}</strong></p>
                                    <button onClick={() => handlePay(bill.id)}>Pay Bill</button>
                                </>
                            }
                        </div>
                    </div>
                ))
            ) : <p>You have no pending medication bills.</p>}
        </div>
    );
}

export default PatientMedicalPayments;
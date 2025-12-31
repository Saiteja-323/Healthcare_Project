// --- CORRECTED FILE: src/pages/patient/PatientDiagnosticCenter.jsx ---

import { useState, useEffect } from 'react';
import api from "../../api/axios";
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function PatientDiagnosticCenter() {
    const [testGroups, setTestGroups] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTests = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/api/patient/diagnostic-center/');
            const data = Array.isArray(res.data) ? res.data : [];

            const grouped = data.reduce((acc, test) => {
                const apptId = test.appointment;
                if (!acc[apptId]) {
                    acc[apptId] = {
                        details: test.appointment_details,
                        tests: [],
                    };
                }
                acc[apptId].tests.push(test);
                return acc;
            }, {});
            setTestGroups(grouped);
        } catch (err) {
            console.error("Fetch Error:", err); // Log the error
            setError('Failed to fetch your test reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);
    
    const handlePay = async (appointmentId) => {
        if (!window.confirm('Proceed to payment? This is a simulation.')) return;
        try {
            await api.post(`/api/patient/diagnostic-center/pay/${appointmentId}/`);
            alert('Payment Successful!');
            fetchTests();
        } catch (err) {
            console.error("Payment Error:", err); // Log the error
            alert('Payment failed. Please try again.');
        }
    };

    if (loading) return <div>Loading Test Reports...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Diagnostic Center Reports</h1>
                <Link to="/patient/dashboard">Back to Dashboard</Link>
            </header>
            {error && <p style={{color: 'red'}}>{error}</p>}
            
            {Object.keys(testGroups).length > 0 ? (
                Object.values(testGroups).map(group => {
                    const isGroupPaid = group.tests.every(t => t.is_paid);
                    const totalCost = group.tests.reduce((sum, t) => sum + (t.is_paid ? 0 : parseFloat(t.cost || 0)), 0);

                    return (
                        <div key={group.details.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                            <h3>Tests for Appointment on {group.details?.date ? format(new Date(group.details.date), 'dd MMM yyyy') : 'N/A'}</h3>
                            <table style={{width: '100%', marginTop: '10px', borderCollapse: 'collapse'}}>
                                <tbody>
                                    {group.tests.map(test => (
                                        <tr key={test.id} style={{borderBottom: '1px solid #eee'}}>
                                            <td style={{padding: '8px'}}>{test.test_name}</td>
                                            <td style={{padding: '8px'}}><strong>Cost:</strong> ₹{test.cost || '0.00'}</td>
                                            <td style={{padding: '8px'}}>
                                                {test.is_paid ? 
                                                    <span><strong>Result:</strong> <span style={{textTransform: 'capitalize'}}>{test.result || 'Pending'}</span></span> 
                                                    : <em>Result available after payment</em>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{textAlign: 'right', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                                {isGroupPaid ? 
                                    <p style={{color: 'green', fontWeight: 'bold'}}>ALL TESTS PAID</p>
                                    : <>
                                        <p><strong>Total Due: ₹{totalCost.toFixed(2)}</strong></p>
                                        <button onClick={() => handlePay(group.details.id)}>Pay Now</button>
                                    </>
                                }
                            </div>
                        </div>
                    );
                })
            ) : <p>You have no test reports from the diagnostic center yet.</p>}
        </div>
    );
}
export default PatientDiagnosticCenter;
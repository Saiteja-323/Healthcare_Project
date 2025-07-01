// --- CORRECTED FILE: src/pages/doctor/DiagnosticCenter.jsx ---

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

function DiagnosticCenter() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/doctor/diagnostic-center/');
            const data = Array.isArray(res.data) ? res.data : [];
            const testsWithEditState = data.map(t => ({...t, editCost: t.cost || '', editResult: t.result || ''}));
            setTests(testsWithEditState);
        } catch (err) {
            // FIX: Use the 'err' variable to satisfy the linter and aid debugging.
            console.error("Failed to fetch tests:", err);
            setError('Failed to fetch diagnostic tests.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (id, field, value) => {
        setTests(tests.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleSend = async (test) => {
        if (!test.editCost || !test.editResult) {
            alert('Please set a cost and result before sending.');
            return;
        }
        try {
            await axios.patch(`/api/doctor/diagnostic-center/${test.id}/manage/`, {
                cost: test.editCost,
                result: test.editResult,
                send_to_patient: true,
            });
            alert('Report sent to patient successfully!');
            fetchTests(); // Refresh data
        } catch (err) {
            // FIX: Use the 'err' variable.
            console.error("Failed to send report:", err);
            alert('Failed to send report.');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Diagnostic Center - Manage Test Reports</h1>
                <Link to="/doctor/dashboard">Back to Dashboard</Link>
            </header>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Patient</th>
                        <th style={styles.th}>Test Name</th>
                        <th style={styles.th}>Cost (INR)</th>
                        <th style={styles.th}>Result</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tests.length > 0 ? tests.map(test => (
                        <tr key={test.id}>
                            <td style={styles.td}>{test.appointment_details?.date ? format(new Date(test.appointment_details.date), 'dd MMM yyyy') : 'N/A'}</td>
                            <td style={styles.td}>{test.appointment_details?.patient_name || 'N/A'}</td>
                            <td style={styles.td}>{test.test_name}</td>
                            <td style={styles.td}>
                                <input type="number" value={test.editCost} onChange={e => handleUpdate(test.id, 'editCost', e.target.value)} disabled={test.is_sent_to_patient} style={{width: '80px'}}/>
                            </td>
                            <td style={styles.td}>
                                <select value={test.editResult} onChange={e => handleUpdate(test.id, 'editResult', e.target.value)} disabled={test.is_sent_to_patient}>
                                    <option value="">Select</option>
                                    <option value="good">Good</option>
                                    <option value="average">Average</option>
                                    <option value="bad">Bad</option>
                                </select>
                            </td>
                            <td style={styles.td}>{test.is_sent_to_patient ? 'Sent' : 'Pending'}</td>
                            <td style={styles.td}>
                                <button onClick={() => handleSend(test)} disabled={test.is_sent_to_patient}>
                                    {test.is_sent_to_patient ? 'Sent' : 'Save & Send'}
                                </button>
                            </td>
                        </tr>
                    )) : <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No prescribed tests found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '10px' },
};

export default DiagnosticCenter;
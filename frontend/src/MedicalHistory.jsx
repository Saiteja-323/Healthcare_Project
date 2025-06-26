// src/MedicalHistory.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
            const response = await axios.get('/api/medical-history/');
            setHistory(response.data);
        } catch (err) {
            setError('Failed to fetch medical history.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const renderMedicines = (record) => {
        const categories = ['tablets', 'syrups', 'injections', 'ointments'];
        const allMeds = [];

        categories.forEach(cat => {
            if (record[cat] && Object.keys(record[cat]).length > 0) {
                for (const [name, quantity] of Object.entries(record[cat])) {
                    allMeds.push(
                        <li key={`${cat}-${name}`}>
                            {name} ({quantity}) - <em style={{color: '#666'}}>{cat.slice(0, -1)}</em>
                        </li>
                    );
                }
            }
        });
        
        return allMeds.length > 0 ? <ul>{allMeds}</ul> : <p>No medicines were prescribed.</p>;
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
                            Consultation on {format(new Date(apt.appointment_date), 'MMMM dd, yyyy')}
                        </h2>
                        <p><strong>Doctor:</strong> Dr. {apt.doctor.first_name} {apt.doctor.last_name}</p>
                        
                        {apt.medical_record ? (
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                                <div>
                                    <h3>Prescribed Items</h3>
                                    {renderMedicines(apt.medical_record)}
                                </div>
                                <div>
                                    <h3>Doctor's Reports/Notes</h3>
                                    {apt.medical_record.report_file ? (
                                        <a href={apt.medical_record.report_file} target="_blank" rel="noopener noreferrer" style={{color: '#007bff'}}>
                                            Download Report
                                        </a>
                                    ) : <p>No report was uploaded.</p>}
                                </div>
                            </div>
                        ) : (
                            <p>No medical record found for this appointment.</p>
                        )}
                    </div>
                ))
            ) : (
                <p>You have no completed appointments with medical records yet.</p>
            )}
        </div>
    );
}

export default MedicalHistory;
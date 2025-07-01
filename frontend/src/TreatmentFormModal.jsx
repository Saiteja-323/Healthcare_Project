// --- UPDATED FILE: src/TreatmentFormModal.jsx ---

import { useState } from 'react';
import axios from 'axios';

const timingOptions = [
    { key: 'mbe', label: 'Morning (Before Eat)' },
    { key: 'maf', label: 'Morning (After Eat)' },
    { key: 'abe', label: 'Afternoon (Before Eat)' },
    { key: 'aaf', label: 'Afternoon (After Eat)' },
    { key: 'nbe', label: 'Night (Before Eat)' },
    { key: 'naf', label: 'Night (After Eat)' },
];

function MedicineInput({ category, items, setItems }) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [timings, setTimings] = useState([]);

    const handleTimingChange = (e) => {
        const { value, checked } = e.target;
        setTimings(prev => checked ? [...prev, value] : prev.filter(t => t !== value));
    };

    const handleAdd = () => {
        if (!name || quantity < 1 || timings.length === 0) {
            alert('Please enter name, quantity, and select at least one timing.');
            return;
        }
        setItems(prev => ({...prev, [name]: { quantity, timings }}));
        setName('');
        setQuantity(1);
        setTimings([]);
    };

    const handleRemove = (itemName) => {
        const newItems = { ...items };
        delete newItems[itemName];
        setItems(newItems);
    };

    return (
        <div style={styles.section}>
            <h4>{category}</h4>
            <div style={styles.inputGroup}>
                <input type="text" placeholder="Medicine Name" value={name} onChange={e => setName(e.target.value)} style={{flex: 2, marginRight: '5px'}}/>
                <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" style={{flex: 1, marginRight: '5px'}}/>
            </div>
            <div style={styles.timingsGrid}>
                {timingOptions.map(opt => (
                    <label key={opt.key} style={{fontSize: '0.8em'}}>
                        <input type="checkbox" value={opt.key} checked={timings.includes(opt.key)} onChange={handleTimingChange} />
                        {opt.label}
                    </label>
                ))}
            </div>
            <button type="button" onClick={handleAdd} style={{...styles.addButton, width: '100%', marginTop: '10px'}}>Add {category.slice(0, -1)}</button>
            <ul style={styles.list}>
                {Object.entries(items).map(([itemName, details]) => (
                    <li key={itemName} style={styles.listItem}>
                        <span>{itemName} (x{details.quantity}) - <small>{details.timings.join(', ')}</small></span>
                        <button onClick={() => handleRemove(itemName)} style={styles.removeButton}>×</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TestInput({ tests, setTests }) {
    const [testName, setTestName] = useState('');
    const handleAdd = () => {
        if (!testName.trim()) return;
        setTests(prev => [...prev, testName.trim()]);
        setTestName('');
    };
    const handleRemove = (index) => {
        setTests(prev => prev.filter((_, i) => i !== index));
    };
    return (
        <div style={styles.section}>
            <h4>Prescribe Diagnostic Tests</h4>
            <div style={styles.inputGroup}>
                <input type="text" placeholder="e.g., CBC, Lipid Profile" value={testName} onChange={e => setTestName(e.target.value)} style={{flex: 3, marginRight: '5px'}}/>
                <button type="button" onClick={handleAdd} style={styles.addButton}>Add Test</button>
            </div>
             <ul style={styles.list}>
                {tests.map((test, index) => (
                    <li key={index} style={styles.listItem}>
                        <span>{test}</span>
                        <button onClick={() => handleRemove(index)} style={styles.removeButton}>×</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}


function TreatmentFormModal({ appointment, onClose, onSuccess }) {
    const [medications, setMedications] = useState({
        tablets: {}, syrups: {}, injections: {}, ointments: {}, instruments: {}
    });
    const [prescribedTests, setPrescribedTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const formData = new FormData();
        // Clean up empty medication categories before sending
        const finalMedications = Object.entries(medications).reduce((acc, [key, value]) => {
            if(Object.keys(value).length > 0) {
                acc[key] = value;
            }
            return acc;
        }, {});

        if (Object.keys(finalMedications).length > 0) {
            formData.append('medication_details', JSON.stringify(finalMedications));
        }
        if (prescribedTests.length > 0) {
            formData.append('prescribed_tests', JSON.stringify(prescribedTests));
        }
        
        try {
            await axios.post(`/api/appointments/${appointment.id}/complete/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // Still needed if you might add files later
            });
            alert('Treatment submitted successfully! Records sent for processing.');
            onSuccess();
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to submit treatment.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <form onSubmit={handleSubmit} style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={onClose} style={styles.closeButton}>×</button>
                <h3>Finalize Treatment for {appointment.patient.first_name}</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <div style={styles.grid}>
                    <MedicineInput category="Tablets" items={medications.tablets} setItems={items => setMedications(p => ({...p, tablets: items}))}/>
                    <MedicineInput category="Syrups" items={medications.syrups} setItems={items => setMedications(p => ({...p, syrups: items}))}/>
                    <MedicineInput category="Injections" items={medications.injections} setItems={items => setMedications(p => ({...p, injections: items}))}/>
                    <MedicineInput category="Ointments" items={medications.ointments} setItems={items => setMedications(p => ({...p, ointments: items}))}/>
                    <MedicineInput category="Instruments" items={medications.instruments} setItems={items => setMedications(p => ({...p, instruments: items}))}/>
                    <TestInput tests={prescribedTests} setTests={setPrescribedTests} />
                </div>
                
                <button type="submit" disabled={loading} style={styles.submitButton}>
                    {loading ? 'Submitting...' : 'Submit & Complete Appointment'}
                </button>
            </form>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '1200px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '20px' },
    section: { border: '1px solid #eee', padding: '15px', borderRadius: '5px' },
    inputGroup: { display: 'flex', marginBottom: '10px' },
    timingsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' },
    addButton: { padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' },
    list: { listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto', marginTop: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', borderBottom: '1px solid #f0f0f0' },
    removeButton: { background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' },
    submitButton: { width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px' }
};

export default TreatmentFormModal;
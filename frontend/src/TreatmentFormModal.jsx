// src/TreatmentFormModal.jsx
import { useState } from 'react';
import axios from 'axios';

function TreatmentItemManager({ title, items, setItems }) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);

    const handleAdd = () => {
        if (!name || quantity < 1) {
            alert('Please enter a valid name and quantity.');
            return;
        }
        setItems([...items, { name, quantity }]);
        setName('');
        setQuantity(1);
    };

    const handleRemove = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div style={styles.section}>
            <h4>{title}</h4>
            <div style={styles.inputGroup}>
                <input type="text" placeholder="Medicine Name" value={name} onChange={e => setName(e.target.value)} style={{flex: 3, marginRight: '5px'}}/>
                <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" style={{flex: 1, marginRight: '5px'}}/>
                <button type="button" onClick={handleAdd} style={styles.addButton}>Add</button>
            </div>
            <ul style={styles.list}>
                {items.map((item, index) => (
                    <li key={index}>
                        {item.name} (x{item.quantity})
                        <button onClick={() => handleRemove(index)} style={styles.removeButton}>×</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TreatmentFormModal({ appointment, onClose, onSuccess }) {
    const [tablets, setTablets] = useState([]);
    const [syrups, setSyrups] = useState([]);
    const [injections, setInjections] = useState([]);
    const [ointments, setOintments] = useState([]);
    const [reportFile, setReportFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const formData = new FormData();
        if (tablets.length > 0) formData.append('tablets', JSON.stringify(tablets));
        if (syrups.length > 0) formData.append('syrups', JSON.stringify(syrups));
        if (injections.length > 0) formData.append('injections', JSON.stringify(injections));
        if (ointments.length > 0) formData.append('ointments', JSON.stringify(ointments));
        if (reportFile) formData.append('report_file', reportFile);
        
        try {
            await axios.post(`/api/appointments/${appointment.id}/complete/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Treatment submitted successfully!');
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
        <div style={styles.overlay}>
            <form onSubmit={handleSubmit} style={styles.modal}>
                <button type="button" onClick={onClose} style={styles.closeButton}>×</button>
                <h3>Finalize Treatment for {appointment.patient.first_name}</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <div style={styles.grid}>
                    <TreatmentItemManager title="Tablets / Capsules" items={tablets} setItems={setTablets} />
                    <TreatmentItemManager title="Syrups / Liquids" items={syrups} setItems={setSyrups} />
                    <TreatmentItemManager title="Injections" items={injections} setItems={setInjections} />
                    <TreatmentItemManager title="Ointments / Creams" items={ointments} setItems={setOintments} />
                </div>

                <div style={styles.section}>
                    <h4>Upload Test Report (Optional)</h4>
                    <input type="file" onChange={(e) => setReportFile(e.target.files[0])} />
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
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '20px' },
    section: { border: '1px solid #eee', padding: '15px', borderRadius: '5px' },
    inputGroup: { display: 'flex', marginBottom: '10px' },
    addButton: { padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' },
    list: { listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto' },
    removeButton: { marginLeft: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' },
    submitButton: { width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px' }
};

export default TreatmentFormModal;
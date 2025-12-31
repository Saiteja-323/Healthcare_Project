// frontend/template_react/src/PatientProfileForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/axios';
import { useAuth } from './AuthContext';

const healthCategories = [
    { value: 'heart', label: 'Heart-related issues' },
    { value: 'skin', label: 'Skin-related issues' },
    { value: 'bone', label: 'Bone and muscle-related issues' },
    { value: 'respiratory', label: 'Respiratory-related issues' },
];

function PatientProfileForm() {
    const { fetchProfile } = useAuth();
    const [formData, setFormData] = useState({
        age: '',
        medical_history: '',
        current_symptoms: '',
        health_issue_category: 'heart',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/profile/patient/', formData);
            await fetchProfile(); // Refresh user data in context
            navigate('/patient/dashboard');
        } catch (err) {
            setError('Failed to submit profile. Please check your inputs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>Complete Your Patient Profile</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Please provide your details to continue.</p>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Age*:</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Primary Health Issue Category*:</label>
                    <select name="health_issue_category" value={formData.health_issue_category} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
                        {healthCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Current Health Issues/Symptoms*:</label>
                    <textarea name="current_symptoms" value={formData.current_symptoms} onChange={handleChange} required rows="4" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Past Medical History (optional):</label>
                    <textarea name="medical_history" value={formData.medical_history} onChange={handleChange} rows="4" style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {loading ? 'Submitting...' : 'Submit Profile'}
                </button>
            </form>
        </div>
    );
}

export default PatientProfileForm;
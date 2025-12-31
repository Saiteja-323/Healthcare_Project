// frontend/template_react/src/DoctorProfileForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/axios';
import { useAuth } from './AuthContext';

const specializations = [
    { value: 'heart', label: 'Cardiology (Heart-related)' },
    { value: 'skin', label: 'Dermatology (Skin-related)' },
    { value: 'bone', label: 'Orthopedics (Bone and muscle-related)' },
    { value: 'respiratory', label: 'Pulmonology (Respiratory-related)' },
];

function DoctorProfileForm() {
    const { fetchProfile } = useAuth();
    const [formData, setFormData] = useState({
        specialization: 'heart',
        years_of_experience: '',
        educational_background: '',
        credentials: '',
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
            await api.post('/api/profile/doctor/', formData);
            await fetchProfile(); // Refresh user data in context
            navigate('/doctor/dashboard');
        } catch (err) {
            setError('Failed to submit profile. Please check your inputs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>Complete Your Doctor Profile</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Please provide your professional details.</p>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Specialization*:</label>
                    <select name="specialization" value={formData.specialization} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
                        {specializations.map(spec => (
                            <option key={spec.value} value={spec.value}>{spec.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Years of Experience*:</label>
                    <input type="number" name="years_of_experience" value={formData.years_of_experience} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Educational Background*:</label>
                    <textarea name="educational_background" value={formData.educational_background} onChange={handleChange} required rows="4" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Additional Credentials (optional):</label>
                    <textarea name="credentials" value={formData.credentials} onChange={handleChange} rows="3" style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {loading ? 'Submitting...' : 'Submit Profile'}
                </button>
            </form>
        </div>
    );
}

export default DoctorProfileForm;
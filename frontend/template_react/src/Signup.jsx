// src/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

function Signup() {
    // ... (useState and handleChange function remain the same) ...
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', password_confirm: '',
        first_name: '', last_name: '', role: 'patient'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError("Passwords don't match.");
            setLoading(false);
            return;
        }
        
        try {
            const response = await axios.post('/api/register/', formData);
            // Log the user in immediately
            login(response.data.tokens, response.data.user);
            
            // Redirect to profile completion page based on role
            if (response.data.user.role === 'doctor') {
                navigate('/doctor/complete-profile', { replace: true });
            } else {
                navigate('/patient/complete-profile', { replace: true });
            }
        } catch (err) {
            if (err.response?.data) {
                let errorMessages = [];
                const errors = err.response.data;
                for (const key in errors) {
                    errorMessages.push(`${key}: ${Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]}`);
                }
                setError(errorMessages.join(' '));
            } else {
                setError('Registration failed. Please try again.');
            }
            console.error("Signup error:", err.response || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>Register New Account</h2>
            {error && <p style={{ color: 'red', textAlign: 'center', whiteSpace: 'pre-wrap' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
                {/* ... (All input fields like username, email, etc. remain exactly the same) ... */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label htmlFor="username">Username*:</label>
                        <input id="username" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label htmlFor="email">Email*:</label>
                        <input id="email" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label htmlFor="password">Password*:</label>
                        <input id="password" name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label htmlFor="password_confirm">Confirm Password*:</label>
                        <input id="password_confirm" name="password_confirm" type="password" placeholder="Confirm Password" value={formData.password_confirm} onChange={handleChange} required 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label htmlFor="first_name">First Name:</label>
                        <input id="first_name" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} />
                    </div>
                    <div>
                        <label htmlFor="last_name">Last Name:</label>
                        <input id="last_name" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} 
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }} />
                    </div>
                </div>

                <div style={{ marginTop: '15px', marginBottom: '20px' }}>
                    <label htmlFor="role">Register as*:</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}>
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                    </select>
                </div>
                
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}
export default Signup;
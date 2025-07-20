import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

function Signup() {
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

    // --- REPLACE YOUR ENTIRE HANDLESUBMIT FUNCTION WITH THIS ---
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
            // On success, log the user in
            login(response.data.tokens, response.data.user);
            
            // And redirect to the correct profile completion page
            if (response.data.user.role === 'doctor') {
                navigate('/doctor/complete-profile', { replace: true });
            } else {
                navigate('/patient/complete-profile', { replace: true });
            }
        } catch (err) {
            // THIS IS THE CORRECTED ERROR HANDLING LOGIC
            if (err.response && err.response.data) {
                const errors = err.response.data;
                const errorMessages = [];
                // Loop through the error object from Django
                for (const key in errors) {
                    // Format it nicely, e.g., "username: This username is already taken."
                    const message = `${key}: ${Array.isArray(errors[key]) ? errors[key].join(' ') : errors[key]}`;
                    errorMessages.push(message);
                }
                // Join all messages into a single string
                setError(errorMessages.join(' '));
            } else {
                // Fallback for network errors or other issues
                setError('Registration failed. Please try again or check your connection.');
            }
            console.error("Signup error details:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center' }}>Register New Account</h2>
            {/* The whiteSpace property helps display multi-line errors cleanly */}
            {error && <p style={{ color: 'red', textAlign: 'center', whiteSpace: 'pre-wrap' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
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
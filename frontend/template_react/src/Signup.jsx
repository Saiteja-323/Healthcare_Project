// src/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

function Signup() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        // department: '', // REMOVED
        role: 'patient' // Default role to patient
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
        
        // Create a new object for submission without department
        const submissionData = { ...formData };
        // delete submissionData.department; // Not needed if not in initial state

        try {
            const response = await axios.post('/api/register/', submissionData);
            login(response.data.tokens, response.data.user);
            
            if (response.data.user.role === 'doctor') { // UPDATED role
                navigate('/doctor/dashboard', { replace: true }); // UPDATED path
            } else { // Default to patient dashboard
                navigate('/patient/dashboard', { replace: true }); // UPDATED path
            }
        } catch (err) {
            if (err.response?.data) {
                let errorMessages = [];
                const errors = err.response.data;
                for (const key in errors) {
                    if (Array.isArray(errors[key])) {
                        errorMessages.push(`${key}: ${errors[key].join(', ')}`);
                    } else {
                        errorMessages.push(`${key}: ${errors[key]}`);
                    }
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
        <div style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register New Account</h2>
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
                {/* ... (username, email, passwords, first_name, last_name fields remain the same) ... */}
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
                
                {/* REMOVED Department Input */}

                <div style={{ marginTop: '15px', marginBottom: '20px' }}>
                    <label htmlFor="role">Register as*:</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} required
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}>
                        <option value="patient">Patient</option> {/* UPDATED */}
                        <option value="doctor">Doctor</option> {/* UPDATED */}
                    </select>
                </div>
                
                <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: '14px' }}>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Back to Home</Link>
            </p>
        </div>
    );
}

export default Signup;
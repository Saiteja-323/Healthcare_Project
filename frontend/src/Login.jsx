// src/Login.jsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

function Login() {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'patient' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // This checks if the user was redirected to login from a protected route
    const from = location.state?.from?.pathname || null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('/api/login/', formData);
            await login(response.data.tokens, response.data.user);
            
            // --- REDIRECT LOGIC UPDATED HERE ---

            // 1. If user was trying to access a protected page, send them there.
            if (from) {
                navigate(from, { replace: true });
            } 
            // 2. Otherwise, send them directly to their specific dashboard.
            else if (response.data.user.role === 'doctor') {
                navigate('/doctor/dashboard', { replace: true });
            } 
            else if (response.data.user.role === 'patient') {
                navigate('/patient/dashboard', { replace: true });
            }
            // The fallback to the home page '/' is removed.

        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check credentials and role.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // The JSX for the form remains exactly the same.
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Login as:</label>
                    <select name="role" value={formData.role} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Username:</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ width: '100%', padding: '10px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Password:</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '10px' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#aaa' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}

export default Login;
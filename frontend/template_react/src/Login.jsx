// src/Login.jsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

function Login() {
    const [formData, setFormData] = useState({ 
        username: '', 
        password: '', 
        role: 'patient' // Default role to patient
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('api/login/', formData);
            login(response.data.tokens, response.data.user);
            
            if (from !== "/") {
                navigate(from, { replace: true });
            } else if (response.data.user.role === 'doctor') { // UPDATED role
                navigate('/doctor/dashboard', { replace: true }); // UPDATED path
            } else if (response.data.user.role === 'patient') { // UPDATED role
                navigate('/patient/dashboard', { replace: true }); // UPDATED path
            } else {
                navigate('/', { replace: true });
            }

        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Login failed. Please check credentials and role.');
            console.error("Login error:", err.response || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="role" style={{ display: 'block', marginBottom: '5px' }}>Login as:</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        required
                    >
                        <option value="patient">Patient</option> {/* UPDATED */}
                        <option value="doctor">Doctor</option> {/* UPDATED */}
                    </select>
                </div>
                
                {/* ... (username and password fields remain the same) ... */}
                 <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input
                        id="username"
                        type="text"
                        name="username"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        required
                    />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        required
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: loading ? '#aaa' : '#007bff', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                Don't have an account? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Register here</Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: '14px' }}>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Back to Home</Link>
            </p>
        </div>
    );
}

export default Login;
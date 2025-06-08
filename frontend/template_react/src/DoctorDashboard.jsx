// src/DoctorDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function DoctorDashboard() { // Renamed component
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [allUsers, setAllUsers] = useState([]); // Renamed state
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && user.role === 'doctor') {
            fetchUsers(); // Renamed function
        } else if (user && user.role !== 'doctor') {
            setError('Access Denied: Doctor role required.');
            setLoadingData(false);
        }
    }, [user]);

    const fetchUsers = async () => { // Renamed function
        setLoadingData(true);
        setError('');
        try {
            // UPDATED API endpoint
            const response = await axios.get('http://localhost:8000/api/doctor/dashboard/'); 
            setAllUsers(response.data.users); // Assuming backend sends 'users'
        } catch (err) {
            console.error("Failed to fetch users:", err.response || err);
            if (err.response && err.response.status === 403) {
                setError('Access Denied: You do not have permission to view this data.');
            } else {
                setError('Failed to fetch user data. Please try again later.');
            }
        } finally {
            setLoadingData(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) { 
        return <div>Authenticating...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <h1>Doctor Dashboard</h1> {/* UPDATED Title */}
                <div>
                    <span style={{ marginRight: '15px' }}>Hi, Dr. {user.last_name || user.username}!</span> {/* UPDATED Greeting */}
                    <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', color: '#007bff' }}>Home</Link>
                    <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>
            
            <div style={{ marginBottom: '20px' }}>
                <h2>User Overview</h2> {/* UPDATED Title */}
                <p>Total Users Registered: {allUsers.length}</p> {/* UPDATED Text */}
            </div>
            
            {error && <p style={{ color: 'red', backgroundColor: '#ffebee', border: '1px solid #f44336', padding: '10px', borderRadius: '4px' }}>{error}</p>}
            
            {loadingData ? (
                <p>Loading user data...</p>
            ) : !error && (
                <div>
                    <h3>All Users (Patients & Doctors)</h3> {/* UPDATED Title */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Username</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Full Name</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Email</th>
                                {/* REMOVED Department Column */}
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.length > 0 ? allUsers.map(u => ( // Changed 'employee' to 'u'
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{u.username}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{u.first_name || ''} {u.last_name || ''}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{u.email}</td>
                                    {/* REMOVED Department Data Cell */}
                                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{u.role}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No users found.</td> {/* UPDATED colSpan */}
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default DoctorDashboard; // Renamed export
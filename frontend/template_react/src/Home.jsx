// src/Home.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <h1>Welcome to Health Management System</h1> {/* UPDATED Title */}
            
            {user ? (
                <div>
                    <p>Hello, {user.first_name || user.username}! (Role: {user.role})</p>
                    {user.role === 'doctor' && ( // UPDATED role
                        <Link to="/doctor/dashboard"> {/* UPDATED path */}
                            <button style={{ margin: '10px', padding: '10px 20px', cursor: 'pointer' }}>
                                Doctor Dashboard
                            </button>
                        </Link>
                    )}
                    {user.role === 'patient' && ( // UPDATED role
                        <Link to="/patient/dashboard"> {/* UPDATED path */}
                            <button style={{ margin: '10px', padding: '10px 20px', cursor: 'pointer' }}>
                                Patient Dashboard
                            </button>
                        </Link>
                    )}
                    <button 
                        onClick={handleLogout}
                        style={{ margin: '10px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <div>
                    <p>Please log in or register to continue.</p>
                    <Link to="/login">
                        <button style={{ margin: '10px', padding: '10px 20px', cursor: 'pointer' }}>Login</button>
                    </Link>
                    <Link to="/register">
                        <button style={{ margin: '10px', padding: '10px 20px', cursor: 'pointer' }}>Register</button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Home;
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function Home() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'doctor' && user.doctor_profile) {
                navigate('/doctor/dashboard', { replace: true });
            } else if (user.role === 'patient' && user.patient_profile) {
                navigate('/patient/dashboard', { replace: true });
            }
            else if (user.role === 'doctor') {
                navigate('/doctor/dashboard', { replace: true });
            } else if (user.role === 'patient') {
                navigate('/patient/dashboard', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    if (loading || user) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Loading Your Experience...</h1>
                <div style={styles.spinner}></div>
            </div>
        );
    }
    
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Welcome to Health Management System</h1>
                <p style={styles.subtitle}>Your trusted partner in digital healthcare. Connect with specialists, manage your appointments, and keep track of your medical history, all in one place.</p>
                <div style={styles.buttonContainer}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <button style={{ ...styles.button, ...styles.loginButton }}>Login</button>
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <button style={{ ...styles.button, ...styles.registerButton }}>Register</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        fontFamily: 'Arial, sans-serif'
    },
    card: {
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '50px 60px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxWidth: '700px',
    },
    title: {
        fontSize: '2.5rem',
        color: '#333',
        marginBottom: '15px'
    },
    subtitle: {
        fontSize: '1.1rem',
        color: '#666',
        lineHeight: '1.6',
        marginBottom: '40px'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px'
    },
    button: {
        padding: '14px 30px',
        fontSize: '1rem',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    loginButton: {
        backgroundColor: '#007bff',
        color: 'white',
    },
    registerButton: {
        backgroundColor: '#f0f0f0',
        color: '#333',
        border: '1px solid #ccc'
    },
    spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        borderLeftColor: '#007bff',
        animation: 'spin 1s ease infinite',
        marginTop: '20px',
    },
};

export default Home;
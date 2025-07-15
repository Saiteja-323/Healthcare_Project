// --- NEW FILE: frontend/src/PaymentModal.jsx ---

import React from 'react';

function PaymentModal({ amount, onConfirm, onClose, isEmergency }) {
    const handlePayment = () => {
        onConfirm();
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} style={styles.closeButton}>×</button>
                <h3 style={styles.title}>{isEmergency ? 'Emergency Booking' : 'Standard Appointment'}</h3>
                <p style={styles.subtitle}>Please confirm the consultation fee to proceed.</p>
                <div style={styles.paymentButtonContainer}>
                    <button onClick={handlePayment} style={styles.paymentButton}>
                        {isEmergency ? '🚑' : '💰'} Pay ₹{amount}/-
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    title: { marginBottom: '10px' },
    subtitle: { color: '#666', marginBottom: '25px' },
    paymentButtonContainer: { marginTop: '20px' },
    paymentButton: {
        width: '100%',
        padding: '15px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
};

export default PaymentModal;
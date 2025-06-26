// src/CancelAppointmentModal.jsx
import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

function CancelAppointmentModal({ appointment, onClose, onSuccess }) {
    const [suggestionMessage, setSuggestionMessage] = useState('');
    const [suggestionDate, setSuggestionDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!suggestionMessage) {
            setError('A suggestion message is required to cancel.');
            return;
        }
        setLoading(true);
        setError('');

        const payload = {
            action: 'cancel',
            suggestion_message: suggestionMessage,
        };
        if (suggestionDate) {
            payload.suggestion_date = suggestionDate;
        }

        try {
            await axios.patch(`/api/appointments/${appointment.id}/manage/`, payload);
            alert('Appointment cancelled successfully.');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel appointment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <form onSubmit={handleSubmit} style={styles.modal}>
                <button type="button" onClick={onClose} style={styles.closeButton}>×</button>
                <h3>Cancel Appointment for {appointment.patient.first_name}</h3>
                <p>Please provide a reason and an optional future date for the patient.</p>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <div style={styles.formGroup}>
                    <label htmlFor="suggestion_message">Suggestion / Reason*</label>
                    <textarea
                        id="suggestion_message"
                        rows="4"
                        value={suggestionMessage}
                        onChange={(e) => setSuggestionMessage(e.target.value)}
                        required
                        style={{width: '100%', padding: '8px'}}
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label htmlFor="suggestion_date">Suggest a New Start Date (Optional)</label>
                    <input
                        type="date"
                        id="suggestion_date"
                        value={suggestionDate}
                        onChange={(e) => setSuggestionDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        style={{width: '100%', padding: '8px'}}
                    />
                </div>

                <button type="submit" disabled={loading} style={styles.submitButton}>
                    {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
            </form>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '500px', maxWidth: '90%', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    formGroup: { marginBottom: '15px' },
    submitButton: { width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px' }
};

export default CancelAppointmentModal;
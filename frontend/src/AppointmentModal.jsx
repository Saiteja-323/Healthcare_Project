// frontend/src/AppointmentModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import calendar styles
import { format } from 'date-fns';

const timeSlots = [
    { key: '09:30-10:30', label: '9:30 AM - 10:30 AM' },
    { key: '11:00-12:30', label: '11:00 AM - 12:30 PM' },
    { key: '14:00-15:30', label: '2:00 PM - 3:30 PM' },
    { key: '16:00-18:00', label: '4:00 PM - 6:00 PM' },
];

function AppointmentModal({ doctor, onClose, onSuccess }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAvailability(selectedDate);
    }, [selectedDate, doctor]);

    const fetchAvailability = async (date) => {
        setLoading(true);
        setError('');
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await axios.get(`/api/appointments/availability/?doctor_id=${doctor.id}&date=${formattedDate}`);
            setAvailability(response.data);
        } catch (err) {
            setError('Failed to fetch slot availability.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSlot(null); // Reset slot selection when date changes
    };

    const handleSlotSelect = (slotKey) => {
        const count = availability[slotKey] || 0;
        if (count >= 5) {
            alert('Slot is filled');
            return;
        }
        setSelectedSlot(slotKey);
    };

    const handleSubmit = async () => {
        if (!selectedSlot) {
            alert('Please select a time slot.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post('/api/appointments/', {
                doctor_id: doctor.id,
                appointment_date: format(selectedDate, 'yyyy-MM-dd'),
                time_slot: selectedSlot,
            });
            alert('Appointment successfully booked!');
            onSuccess(); // Refresh the dashboard data
            onClose();   // Close the modal
        } catch (err) {
            // --- UPDATED ERROR HANDLING ---
            if (err.response && err.response.data) {
                const responseData = err.response.data;
                // Check for Django's unique_together validation error
                if (responseData.non_field_errors) {
                    setError("You have already booked this time slot. Please check 'My Appointments'.");
                // Check for our custom error messages from the view
                } else if (responseData.error) {
                    setError(responseData.error);
                } else {
                    // Handle other potential DRF validation errors (e.g., {'time_slot': ['Invalid choice.']})
                    const messages = Object.values(responseData).flat().join(' ');
                    setError(messages || 'Failed to book appointment. An unknown error occurred.');
                }
            } else {
                setError('Failed to book appointment. Please check your network connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getSlotStyle = (slotKey) => {
        const count = availability[slotKey] || 0;
        let backgroundColor = '#4CAF50'; // Green
        if (count >= 4) backgroundColor = '#ffc107'; // Yellow
        if (count >= 5) backgroundColor = '#f44336'; // Red
        return {
            backgroundColor,
            cursor: count >= 5 ? 'not-allowed' : 'pointer',
            border: selectedSlot === slotKey ? '3px solid #000' : 'none',
        };
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}>×</button>
                <h3>Book Appointment with Dr. {doctor.first_name} {doctor.last_name}</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <div style={styles.container}>
                    <div style={styles.calendarContainer}>
                        <h4>Select a Date</h4>
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            minDate={new Date()} // Prevent booking past dates
                        />
                    </div>
                    <div style={styles.slotsContainer}>
                        <h4>Select a Time Slot</h4>
                        {loading ? <p>Loading slots...</p> : (
                            timeSlots.map(slot => (
                                <button
                                    key={slot.key}
                                    style={{ ...styles.slotButton, ...getSlotStyle(slot.key) }}
                                    onClick={() => handleSlotSelect(slot.key)}
                                    disabled={availability[slot.key] >= 5}
                                >
                                    {slot.label} ({availability[slot.key] || 0}/5)
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedSlot || loading}
                    style={styles.confirmButton}
                >
                    {loading ? 'Booking...' : 'Confirm Appointment'}
                </button>
            </div>
        </div>
    );
}

// Basic styles for the modal
const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '800px', maxWidth: '90%', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    container: { display: 'flex', gap: '20px', marginTop: '20px' },
    calendarContainer: { flex: 1 },
    slotsContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
    slotButton: { color: 'white', padding: '12px', borderRadius: '5px', textAlign: 'center' },
    confirmButton: { width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }
};

export default AppointmentModal;
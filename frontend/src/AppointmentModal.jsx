// frontend/src/AppointmentModal.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';

const timeSlots = [
    { key: '09:30-10:30', label: '9:30 AM - 10:30 AM' },
    { key: '11:00-12:30', label: '11:00 AM - 12:30 PM' },
    { key: '14:00-15:30', label: '2:00 PM - 3:30 PM' },
    { key: '16:00-18:00', label: '4:00 PM - 6:00 PM' },
];

function AppointmentModal({ doctor, onClose, onSuccess, restrictedUntilDate }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [initialReport, setInitialReport] = useState(null); // <-- NEW STATE FOR FILE
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const minBookingDate = restrictedUntilDate ? new Date(restrictedUntilDate) : new Date();

    useEffect(() => {
        // If the default selected date is in the past or restricted, reset it
        if (selectedDate < minBookingDate) {
            setSelectedDate(minBookingDate);
        }
        fetchAvailability(selectedDate);
    }, [selectedDate, doctor, minBookingDate]);

    const fetchAvailability = async (date) => {
        setLoading(true);
        setError('');
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            // The API now checks for 'accepted' appointments, which is what we want
            const response = await axios.get(`/api/appointments/availability/?doctor_id=${doctor.id}&date=${formattedDate}`);
            setAvailability(response.data);
        } catch {
            setError('Failed to fetch slot availability.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
    };

    const handleSubmit = async () => {
        if (!selectedSlot) {
            alert('Please select a time slot.');
            return;
        }
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('doctor_id', doctor.id);
        formData.append('appointment_date', format(selectedDate, 'yyyy-MM-dd'));
        formData.append('time_slot', selectedSlot);
        if (initialReport) {
            formData.append('initial_report', initialReport);
        }

        try {
            await axios.post('/api/appointments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Appointment request sent successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            if (err.response && err.response.data) {
                const responseData = err.response.data;
                const messages = Object.values(responseData).flat().join(' ');
                setError(messages || 'Failed to book appointment.');
            } else {
                setError('Failed to book appointment. Please check your network connection.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // ... (handleSlotSelect and getSlotStyle are unchanged) ...
    const handleSlotSelect = (slotKey) => {
        const count = availability[slotKey] || 0;
        if (count >= 5) { alert('Slot is filled'); return; }
        setSelectedSlot(slotKey);
    };

    const getSlotStyle = (slotKey) => {
        const count = availability[slotKey] || 0;
        let backgroundColor = '#4CAF50'; // Green
        if (count >= 4) backgroundColor = '#ffc107'; // Yellow
        if (count >= 5) backgroundColor = '#f44336'; // Red
        return { backgroundColor, cursor: count >= 5 ? 'not-allowed' : 'pointer', border: selectedSlot === slotKey ? '3px solid #000' : 'none', };
    };


    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}>×</button>
                <h3>Book Appointment with Dr. {doctor.first_name} {doctor.last_name}</h3>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                <div style={styles.container}>
                    <div style={styles.calendarContainer}>
                        <h4>Select a Date</h4>
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            minDate={minBookingDate} // Use the calculated min date
                        />
                        {restrictedUntilDate && <p style={{color: 'orange', fontSize: '0.9em', marginTop: '10px'}}>Booking is available from {format(minBookingDate, 'MMM dd, yyyy')}.</p>}
                    </div>
                    <div style={styles.slotsContainer}>
                        <h4>Select a Time Slot for {format(selectedDate, 'MMM dd')}</h4>
                        {loading ? <p>Loading slots...</p> : (
                            timeSlots.map(slot => (
                                <button key={slot.key} style={{ ...styles.slotButton, ...getSlotStyle(slot.key) }} onClick={() => handleSlotSelect(slot.key)} disabled={availability[slot.key] >= 5}>
                                    {slot.label} ({availability[slot.key] || 0}/5 available)
                                </button>
                            ))
                        )}
                        <div style={{marginTop: '20px'}}>
                            <label htmlFor="report-upload">Upload medical documents (optional):</label>
                            <input id="report-upload" type="file" onChange={(e) => setInitialReport(e.target.files[0])} style={{marginTop: '5px'}}/>
                        </div>
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={!selectedSlot || loading} style={styles.confirmButton}>
                    {loading ? 'Sending Request...' : 'Confirm Appointment Request'}
                </button>
            </div>
        </div>
    );
}

// ... (styles object is unchanged)
const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '800px', maxWidth: '90%', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    container: { display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' },
    calendarContainer: { flex: 1, minWidth: '300px' },
    slotsContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '300px' },
    slotButton: { color: 'white', padding: '12px', borderRadius: '5px', textAlign: 'center' },
    confirmButton: { width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }
};

export default AppointmentModal;
// --- CORRECTED FILE: frontend/src/AppointmentModal.jsx ---

import { useState, useEffect, useMemo } from 'react';
import api from './api/axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isEqual, startOfDay } from 'date-fns';

const timeSlots = [
    { key: '09:30-10:30', label: '9:30 AM - 10:30 AM' },
    { key: '11:00-12:30', label: '11:00 AM - 12:30 PM' },
    { key: '14:00-15:30', label: '2:00 PM - 3:30 PM' },
    { key: '16:00-18:00', label: '4:00 PM - 6:00 PM' },
];

const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
};

function AppointmentModal({ doctor, onClose, onSuccess, restrictedUntilDate, isEmergency }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [initialReport, setInitialReport] = useState(null);
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // --- FIX: State to hold all unavailable dates for visual disabling ---
    const [unavailableDates, setUnavailableDates] = useState([]);

    const minBookingDate = useMemo(() => {
        const today = new Date();
        const restricted = restrictedUntilDate ? parseDateAsLocal(restrictedUntilDate) : today;
        return restricted > today ? restricted : today;
    }, [restrictedUntilDate]);

    // Fetch all unavailable dates when the modal mounts
    useEffect(() => {
        const fetchUnavailability = async () => {
            try {
                const res = await api.get(`/api/doctor/unavailability/?doctor_id=${doctor.id}`);
                const dates = (Array.isArray(res.data) ? res.data : []).map(d => parseDateAsLocal(d.date));
                setUnavailableDates(dates);
            } catch (err) {
                console.error("Could not fetch unavailability", err);
            }
        };
        fetchUnavailability();
    }, [doctor.id]);

    // Fetch slot availability whenever the selected date changes
    useEffect(() => {
        const dateToFetch = selectedDate < minBookingDate ? minBookingDate : selectedDate;
        if (selectedDate < minBookingDate) {
            setSelectedDate(minBookingDate);
        }
        fetchSlotAvailability(dateToFetch);
    }, [selectedDate, doctor.id, minBookingDate]);

    const fetchSlotAvailability = async (date) => {
        setLoading(true); setError('');
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const response = await api.get(`/api/appointments/availability/?doctor_id=${doctor.id}&date=${formattedDate}`);
            
            if (response.data.unavailable) {
                setError(response.data.message || 'The doctor is not available on this day.');
                setAvailability({});
            } else {
                setAvailability(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch slot availability.');
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
            alert('Please select a time slot.'); return;
        }
        setLoading(true); setError('');

        const formData = new FormData();
        formData.append('doctor_id', doctor.id);
        formData.append('appointment_date', format(selectedDate, 'yyyy-MM-dd'));
        formData.append('time_slot', selectedSlot);
        formData.append('is_emergency', isEmergency);
        if (initialReport) {
            formData.append('initial_report', initialReport);
        }

        try {
            await api.post('/api/appointments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Appointment request sent successfully!`);
            onSuccess();
            onClose();
        } catch (err) {
            const errorData = err.response?.data;
            const messages = errorData ? (Object.values(errorData).flat().join(' ') || 'Failed to book appointment.') : 'An unknown error occurred.';
            setError(messages);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSlotSelect = (slotKey) => {
        const count = availability[slotKey] || 0;
        if (count >= 5 && !isEmergency) { alert('Slot is filled'); return; }
        setSelectedSlot(slotKey);
    };

    const getSlotStyle = (slotKey) => {
        const count = availability[slotKey] || 0;
        let backgroundColor = '#4CAF50';
        if (count >= 4 && !isEmergency) backgroundColor = '#ffc107';
        if (count >= 5 && !isEmergency) backgroundColor = '#f44336';
        const isFull = count >= 5 && !isEmergency;
        return { backgroundColor, cursor: isFull ? 'not-allowed' : 'pointer', border: selectedSlot === slotKey ? '3px solid #000' : 'none' };
    };

    // --- FIX: Function to visually disable tiles on the calendar ---
    const tileDisabled = ({ date, view }) => {
        if (view === 'month') {
            return unavailableDates.some(unavailableDate => 
                isEqual(startOfDay(date), startOfDay(unavailableDate))
            );
        }
        return false;
    };

    const isSelectedDateUnavailable = tileDisabled({ date: selectedDate, view: 'month' });

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={onClose} style={styles.closeButton}>×</button>
                <h3>{isEmergency ? "Emergency Booking" : "Book Appointment"} with Dr. {doctor.first_name} {doctor.last_name}</h3>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                <div style={styles.container}>
                    <div style={styles.calendarContainer}>
                        <h4>Select a Date</h4>
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            minDate={minBookingDate}
                            tileDisabled={tileDisabled} // Use the disabling function
                        />
                         {isEmergency && <p style={{color: 'red', fontSize: '0.9em', marginTop: '10px'}}>Emergency booking will override slot limits.</p>}
                         {restrictedUntilDate && new Date(restrictedUntilDate) > new Date() && <p style={{color: 'orange', fontSize: '0.9em', marginTop: '10px'}}>Booking is available from {format(minBookingDate, 'MMM dd, yyyy')}.</p>}
                    </div>
                    <div style={styles.slotsContainer}>
                        <h4>Select a Time Slot for {format(selectedDate, 'MMM dd')}</h4>
                        {loading ? <p>Loading slots...</p> : isSelectedDateUnavailable ? (
                             <p style={{color: 'red'}}>❌ The doctor is unavailable on that date.</p>
                        ) : (
                            timeSlots.map(slot => {
                                const count = availability[slot.key] || 0;
                                const isFull = count >= 5 && !isEmergency;
                                return (
                                    <button key={slot.key} style={{ ...styles.slotButton, ...getSlotStyle(slot.key) }} onClick={() => handleSlotSelect(slot.key)} disabled={isFull}>
                                        {slot.label} ({isEmergency ? 'Emergency Priority' : `${count}/5 Booked`})
                                    </button>
                                );
                            })
                        )}
                        <div style={{marginTop: '20px'}}>
                            <label htmlFor="report-upload">Upload medical documents (optional):</label>
                            <input id="report-upload" type="file" onChange={(e) => setInitialReport(e.target.files[0])} style={{marginTop: '5px'}}/>
                        </div>
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={!selectedSlot || loading || isSelectedDateUnavailable} style={styles.confirmButton}>
                    {loading ? 'Sending Request...' : 'Confirm Appointment Request'}
                </button>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '800px', maxWidth: '90%', position: 'relative' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' },
    container: { display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' },
    calendarContainer: { flex: 1, minWidth: '300px' },
    slotsContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '300px' },
    slotButton: { color: 'white', padding: '12px', borderRadius: '5px', textAlign: 'center', border: 'none' },
    confirmButton: { width: '100%', padding: '12px', marginTop: '20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }
};

export default AppointmentModal;
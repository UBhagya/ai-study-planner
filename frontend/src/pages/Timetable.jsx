import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Timetable() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const [timetable, setTimetable] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [avForm, setAvForm] = useState({ day_of_week: 'Monday', start_time: '09:00', end_time: '11:00' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAvailability();
    loadTimetable();
  }, []);

  const loadAvailability = async () => {
    const res = await axios.get('http://localhost:5000/api/availability', { headers });
    setAvailability(res.data);
  };

  const loadTimetable = async () => {
    const res = await axios.get('http://localhost:5000/api/timetable', { headers });
    setTimetable(res.data);
  };

  const addAvailability = async () => {
    try {
      await axios.post('http://localhost:5000/api/availability', avForm, { headers });
      loadAvailability();
      setMessage('Availability added ✅');
    } catch {
      setMessage('Failed to add availability');
    }
  };

  const deleteAvailability = async (id) => {
    await axios.delete(`http://localhost:5000/api/availability/${id}`, { headers });
    loadAvailability();
  };

  const generateTimetable = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/timetable/generate', {}, { headers });
      setTimetable(res.data.timetable);
      setMessage('Timetable generated! 🎉');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Generation failed');
    }
    setLoading(false);
  };

  // Group timetable by day
  const timetableByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day === day || t.day_of_week === day);
    return acc;
  }, {});

  // Assign colors to subjects
  const subjectColors = {};
  let colorIndex = 0;
  timetable.forEach(t => {
    if (!subjectColors[t.subject_name]) {
      subjectColors[t.subject_name] = COLORS[colorIndex % COLORS.length];
      colorIndex++;
    }
  });

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>📅 Study Timetable</h2>

      {/* Availability Section */}
      <div style={styles.card}>
        <h3>⏰ Set Your Available Times</h3>
        {message && (
          <p style={{ color: message.includes('✅') || message.includes('🎉') ? 'green' : 'red' }}>
            {message}
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select style={styles.smallInput} value={avForm.day_of_week}
            onChange={e => setAvForm({ ...avForm, day_of_week: e.target.value })}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
          <input style={styles.smallInput} type="time" value={avForm.start_time}
            onChange={e => setAvForm({ ...avForm, start_time: e.target.value })} />
          <input style={styles.smallInput} type="time" value={avForm.end_time}
            onChange={e => setAvForm({ ...avForm, end_time: e.target.value })} />
          <button style={styles.smallBtn} onClick={addAvailability}>+ Add</button>
        </div>

        {/* Availability list */}
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availability.map(a => (
            <div key={a.availability_id} style={styles.avTag}>
              {a.day_of_week} {a.start_time?.slice(0,5)}–{a.end_time?.slice(0,5)}
              <span onClick={() => deleteAvailability(a.availability_id)}
                style={{ marginLeft: '8px', cursor: 'pointer', color: '#ef4444' }}>✕</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button style={styles.generateBtn} onClick={generateTimetable} disabled={loading}>
        {loading ? '⏳ Generating...' : '🤖 Generate AI Timetable'}
      </button>

      {/* Calendar View */}
      {timetable.length > 0 && (
        <div style={styles.calendar}>
          <h3 style={{ marginBottom: '1rem' }}>📆 Your Weekly Schedule</h3>
          <div style={styles.calendarGrid}>
            {DAYS.map(day => (
              <div key={day} style={styles.dayColumn}>
                <div style={styles.dayHeader}>{day}</div>
                {timetableByDay[day].length === 0
                  ? <div style={styles.emptySlot}>Free</div>
                  : timetableByDay[day].map((slot, i) => (
                    <div key={i} style={{
                      ...styles.slot,
                      background: subjectColors[slot.subject_name] || '#4f46e5'
                    }}>
                      <strong style={{ fontSize: '12px' }}>{slot.subject_name}</strong>
                      <p style={{ fontSize: '11px', margin: '2px 0', opacity: 0.9 }}>
                        {slot.start_time?.slice(0,5)}–{slot.end_time?.slice(0,5)}
                      </p>
                      <p style={{ fontSize: '10px', margin: 0, opacity: 0.8 }}>
                        {slot.difficulty || slot.difficulty_level}
                      </p>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(subjectColors).map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color }} />
                <span style={{ fontSize: '13px' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button style={{ ...styles.smallBtn, marginTop: '1.5rem' }}
        onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1000px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' },
  title: { color: '#4f46e5' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '1.5rem' },
  smallInput: { padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  smallBtn: { padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  generateBtn: { width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginBottom: '1.5rem' },
  avTag: { background: '#f0f4ff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: '#4f46e5' },
  calendar: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' },
  dayColumn: { display: 'flex', flexDirection: 'column', gap: '6px' },
  dayHeader: { background: '#4f46e5', color: 'white', padding: '8px 4px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' },
  slot: { padding: '8px', borderRadius: '8px', color: 'white', textAlign: 'center' },
  emptySlot: { background: '#f9fafb', border: '1px dashed #ddd', borderRadius: '8px', padding: '8px', textAlign: 'center', color: '#999', fontSize: '12px' }
};
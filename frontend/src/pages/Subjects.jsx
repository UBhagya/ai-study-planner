import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Subjects() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    subject_name: '', difficulty_level: 'Medium', priority: 3, hours_per_week: 5
  });
  const [message, setMessage] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  // Load subjects on page open
  useEffect(() => {
    axios.get('http://localhost:5000/api/subjects', { headers })
      .then(res => setSubjects(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!form.subject_name) return setMessage('Please enter subject name');
    try {
      const res = await axios.post('http://localhost:5000/api/subjects', form, { headers });
      setSubjects([...subjects, res.data]);
      setForm({ subject_name: '', difficulty_level: 'Medium', priority: 3, hours_per_week: 5 });
      setMessage('Subject added! ✅');
    } catch (err) {
      setMessage('Failed to add subject');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/subjects/${id}`, { headers });
      setSubjects(subjects.filter(s => s.subject_id !== id));
    } catch (err) {
      setMessage('Failed to delete subject');
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>📚 My Subjects</h2>

      {/* Add Subject Form */}
      <div style={styles.card}>
        <h3>Add New Subject</h3>
        {message && <p style={{ color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
        <input style={styles.input} name="subject_name" placeholder="Subject Name"
          value={form.subject_name} onChange={handleChange} />
        <select style={styles.input} name="difficulty_level" value={form.difficulty_level} onChange={handleChange}>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <label>Priority (1-5): {form.priority}</label>
        <input style={styles.input} name="priority" type="range" min="1" max="5"
          value={form.priority} onChange={handleChange} />
        <input style={styles.input} name="hours_per_week" type="number"
          placeholder="Hours per week" value={form.hours_per_week} onChange={handleChange} />
        <button style={styles.button} onClick={handleAdd}>+ Add Subject</button>
      </div>

      {/* Subject List */}
      <div style={styles.list}>
        {subjects.length === 0 && <p>No subjects yet. Add one above!</p>}
        {subjects.map(s => (
          <div key={s.subject_id} style={styles.subjectCard}>
            <div>
              <strong>{s.subject_name}</strong>
              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                {s.difficulty_level} · Priority: {s.priority} · {s.hours_per_week}hrs/week
              </p>
            </div>
            <button onClick={() => handleDelete(s.subject_id)} style={styles.deleteBtn}>🗑️</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <button style={{ ...styles.navBtn, background: '#10b981' }}
          onClick={() => navigate('/timetable')}>Generate Timetable →</button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '700px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' },
  title: { color: '#4f46e5', marginBottom: '1.5rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', marginBottom: '2rem' },
  input: { width: '100%', padding: '10px', margin: '8px 0', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' },
  button: { width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', marginTop: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  subjectCard: { background: 'white', padding: '1rem 1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' },
  navBtn: { padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
};
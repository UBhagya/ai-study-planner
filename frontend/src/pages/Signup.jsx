import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) {
      return setError('Please fill in all fields.');
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={styles.card}>
        <div style={styles.iconWrap}>📚</div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Start planning smarter with AI</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Full Name</label>
        <input style={styles.input} name="name" placeholder="Sarah Johnson"
          value={form.name} onChange={handleChange} />

        <label style={styles.label}>Email</label>
        <input style={styles.input} name="email" type="email"
          placeholder="you@email.com" value={form.email} onChange={handleChange} />

        <label style={styles.label}>Password</label>
        <input style={styles.input} name="password" type="password"
          placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />

        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Creating account...' : 'Create Account →'}
        </button>

        <p style={styles.linkText}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#e8edf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 30px rgba(30,58,95,0.12)',
    display: 'flex',
    flexDirection: 'column',
  },
  iconWrap: { fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem' },
  title: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 900,
    fontSize: '1.6rem',
    color: '#1e3a5f',
    textAlign: 'center',
    margin: '0 0 4px',
  },
  subtitle: { color: '#6b7a99', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.5rem' },
  label: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#1e3a5f',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #d0daea',
    fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1a2b42',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '4px',
    marginBottom: '16px',
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: '14px',
    fontWeight: 600,
  },
  linkText: { textAlign: 'center', fontSize: '0.88rem', color: '#6b7a99' },
  link: { color: '#2563eb', fontWeight: 700, textDecoration: 'none' },
};

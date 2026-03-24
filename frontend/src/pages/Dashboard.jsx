import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3aaa6e', '#f0b429', '#3b82f6', '#e05c7b', '#7c3aed', '#06b6d4', '#f97316'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };

  const [subjects, setSubjects] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [progress, setProgress] = useState([]);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Subject form
  const [subForm, setSubForm] = useState({ subject_name: '', difficulty_level: 'Medium', priority: 3, hours_per_week: 5 });
  const [showSubForm, setShowSubForm] = useState(false);

  // Availability form
  const [avForm, setAvForm] = useState({ day_of_week: 'Monday', start_time: '16:00', end_time: '18:00' });
  const [showAvForm, setShowAvForm] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [subRes, avRes, ttRes] = await Promise.all([
        axios.get('http://localhost:5000/api/subjects', { headers }),
        axios.get('http://localhost:5000/api/availability', { headers }),
        axios.get('http://localhost:5000/api/timetable', { headers }),
      ]);
      setSubjects(subRes.data);
      setAvailability(avRes.data);
      setTimetable(ttRes.data);
    } catch (err) {
      console.error('Load error:', err.message);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const addSubject = async () => {
    if (!subForm.subject_name) return showToast('⚠️ Enter a subject name');
    try {
      const res = await axios.post('http://localhost:5000/api/subjects', subForm, { headers });
      setSubjects([...subjects, res.data]);
      setSubForm({ subject_name: '', difficulty_level: 'Medium', priority: 3, hours_per_week: 5 });
      setShowSubForm(false);
      showToast(`📚 ${res.data.subject_name} added!`);
    } catch { showToast('❌ Failed to add subject'); }
  };

  const deleteSubject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/subjects/${id}`, { headers });
      setSubjects(subjects.filter(s => s.subject_id !== id));
      showToast('🗑️ Subject removed');
    } catch { showToast('❌ Failed to delete'); }
  };

  const addAvailability = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/availability', avForm, { headers });
      setAvailability([...availability, res.data]);
      setShowAvForm(false);
      showToast(`✅ ${avForm.day_of_week} availability added!`);
    } catch { showToast('❌ Failed to add time slot'); }
  };

  const deleteAvailability = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/availability/${id}`, { headers });
      setAvailability(availability.filter(a => a.availability_id !== id));
    } catch { showToast('❌ Failed to delete'); }
  };

  const generateTimetable = async () => {
    if (subjects.length === 0) return showToast('⚠️ Add subjects first!');
    if (availability.length === 0) return showToast('⚠️ Add available times first!');
    setGenerating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/timetable/generate', {}, { headers });
      setTimetable(res.data.timetable);
      showToast('🎉 Timetable generated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Generation failed');
    }
    setGenerating(false);
  };

  // Group timetable by day
  const ttByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day === day || t.day_of_week === day);
    return acc;
  }, {});

  // Subject color map
  const subjectColorMap = {};
  subjects.forEach((s, i) => {
    subjectColorMap[s.subject_name] = COLORS[i % COLORS.length];
  });
  // Also map from timetable
  timetable.forEach((t, i) => {
    if (!subjectColorMap[t.subject_name]) {
      subjectColorMap[t.subject_name] = COLORS[Object.keys(subjectColorMap).length % COLORS.length];
    }
  });

  // Bar chart heights (per day based on timetable)
  const barHeights = DAYS.map(day => (ttByDay[day]?.length || 0) * 30 + 10);
  const maxBar = Math.max(...barHeights, 40);

  // Total hours this week
  const totalHours = subjects.reduce((sum, s) => sum + (Number(s.hours_per_week) || 0), 0);
  const sessionsCompleted = timetable.length;

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── Page Title + Logout ── */}
      <div style={S.topBar}>
        <div style={S.pageTitle}>🎓 AI Study Planner &amp; Timetable</div>
        <button style={S.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          Sign Out
        </button>
      </div>

      <div style={S.grid}>

        {/* ══════════════ SETUP CARD ══════════════ */}
        <div style={{ ...S.card, ...S.setupCard }}>
          <div style={S.cardTitle}>
            <span style={{ ...S.iconCircle, background: '#dbeafe' }}>🛡️</span>
            AI Study Planner &amp; Timetable
          </div>
          <div style={S.setupInner}>
            <div style={S.setupForm}>
              <div style={S.welcome}>Welcome, {user?.name?.split(' ')[0] || 'Student'}!</div>
              <div style={S.setupSubtitle}>Set Up Your Study Plan</div>

              {/* Subjects Section */}
              <div style={S.sectionBox}>
                <div style={S.sectionTitle}>Subjects &amp; Priorities</div>
                {subjects.length === 0 && (
                  <p style={{ color: '#6b7a99', fontSize: '0.85rem', marginBottom: '8px' }}>
                    No subjects yet. Add one below!
                  </p>
                )}
                {subjects.map((s, i) => (
                  <div key={s.subject_id} style={S.subjectItem}>
                    <div style={{ ...S.subjectDot, background: COLORS[i % COLORS.length] }}>✓</div>
                    <span style={S.subjectName}>{s.subject_name}</span>
                    <span style={S.subjectMeta}>· Priority: {s.priority}, {s.difficulty_level}</span>
                    <button onClick={() => deleteSubject(s.subject_id)} style={S.deleteDot}>✕</button>
                  </div>
                ))}

                {showSubForm ? (
                  <div style={S.inlineForm}>
                    <input style={S.smallInput} placeholder="Subject name"
                      value={subForm.subject_name}
                      onChange={e => setSubForm({ ...subForm, subject_name: e.target.value })} />
                    <select style={S.smallInput} value={subForm.difficulty_level}
                      onChange={e => setSubForm({ ...subForm, difficulty_level: e.target.value })}>
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                    <div style={{ fontSize: '0.8rem', color: '#1e3a5f', fontWeight: 700 }}>
                      Priority: {subForm.priority}
                    </div>
                    <input type="range" min="1" max="5" value={subForm.priority}
                      onChange={e => setSubForm({ ...subForm, priority: Number(e.target.value) })}
                      style={{ width: '100%', margin: '4px 0' }} />
                    <input style={S.smallInput} type="number" placeholder="Hours/week"
                      value={subForm.hours_per_week}
                      onChange={e => setSubForm({ ...subForm, hours_per_week: Number(e.target.value) })} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={S.confirmBtn} onClick={addSubject}>✓ Add</button>
                      <button style={S.cancelBtn} onClick={() => setShowSubForm(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={S.addBtn} onClick={() => setShowSubForm(true)}>➕ Add Subject</button>
                )}
              </div>

              {/* Availability Section */}
              <div style={S.sectionBox}>
                <div style={S.sectionTitle}>Available Time</div>
                {availability.length === 0 && (
                  <p style={{ color: '#6b7a99', fontSize: '0.85rem', marginBottom: '8px' }}>
                    No time slots yet. Add one below!
                  </p>
                )}
                {availability.map(a => (
                  <div key={a.availability_id} style={S.timeItem}>
                    <span style={S.checkIcon}>✔</span>
                    <span>{a.day_of_week}: {a.start_time?.slice(0,5)} – {a.end_time?.slice(0,5)}</span>
                    <button onClick={() => deleteAvailability(a.availability_id)} style={S.deleteDot}>✕</button>
                  </div>
                ))}

                {showAvForm ? (
                  <div style={S.inlineForm}>
                    <select style={S.smallInput} value={avForm.day_of_week}
                      onChange={e => setAvForm({ ...avForm, day_of_week: e.target.value })}>
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input style={{ ...S.smallInput, flex: 1 }} type="time" value={avForm.start_time}
                        onChange={e => setAvForm({ ...avForm, start_time: e.target.value })} />
                      <input style={{ ...S.smallInput, flex: 1 }} type="time" value={avForm.end_time}
                        onChange={e => setAvForm({ ...avForm, end_time: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={S.confirmBtn} onClick={addAvailability}>✓ Add</button>
                      <button style={S.cancelBtn} onClick={() => setShowAvForm(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={S.addBtn} onClick={() => setShowAvForm(true)}>➕ Add Time Slot</button>
                )}
              </div>

              <button style={{ ...S.genBtn, opacity: generating ? 0.7 : 1 }}
                onClick={generateTimetable} disabled={generating}>
                {generating ? '⏳ Generating...' : '🤖 Generate Timetable'}
              </button>
            </div>

            {/* Illustration */}
            <div style={S.illus}>👩‍💻</div>
          </div>
        </div>

        {/* ══════════════ PROGRESS CARD ══════════════ */}
        <div style={{ ...S.card, ...S.progressCard }}>
          <div style={S.cardTitle}>
            <span style={{ ...S.iconCircle, background: '#dcfce7' }}>📊</span>
            Study Progress
          </div>

          <div style={S.progStats}>
            <div style={{ ...S.statBadge, background: '#3aaa6e' }}>
              Hours/Week Goal: {totalHours} hrs
            </div>
            <div style={{ ...S.statBadge, background: '#f0b429' }}>
              Sessions: {sessionsCompleted}
            </div>
            <div style={{ ...S.statBadge, background: '#2563eb' }}>
              Subjects: {subjects.length}
            </div>
          </div>

          <div style={S.progOverviewTitle}>↻ Progress Overview</div>
          <div style={S.chartsRow}>
            {/* Bar Chart */}
            <div style={S.barChart}>
              {DAYS.map((day, i) => (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '3px' }}>
                  <div style={{
                    ...S.bar,
                    height: `${Math.max((barHeights[i] / maxBar) * 85, 8)}px`,
                    background: COLORS[i % COLORS.length],
                  }} title={`${DAY_SHORT[i]}: ${ttByDay[day]?.length || 0} sessions`} />
                  <span style={{ fontSize: '9px', color: '#6b7a99', fontWeight: 700 }}>{DAY_SHORT[i]}</span>
                </div>
              ))}
            </div>

            {/* Pie + Legend */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={S.pieWrap}>
                <div style={{
                  ...S.pie,
                  background: subjects.length > 0
                    ? `conic-gradient(${subjects.map((s, i) => {
                        const pct = Math.round(100 / subjects.length);
                        const start = i * pct;
                        return `${COLORS[i % COLORS.length]} ${start}% ${start + pct}%`;
                      }).join(', ')})`
                    : '#e8edf5',
                }} />
              </div>
              <div style={S.pieLegend}>
                {subjects.slice(0, 4).map((s, i) => (
                  <div key={s.subject_id} style={S.legendItem}>
                    <div style={{ ...S.legendDot, background: COLORS[i % COLORS.length] }} />
                    <span>{s.subject_name}</span>
                  </div>
                ))}
                {subjects.length === 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#6b7a99' }}>Add subjects</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ TIMETABLE CARD ══════════════ */}
        <div style={{ ...S.card, ...S.timetableCard }}>
          <div style={S.cardTitle}>🕐 Your Study Timetable</div>

          {/* Day Headers */}
          <div style={S.ttGrid}>
            {DAY_SHORT.map(d => (
              <div key={d} style={S.ttHeader}>{d}</div>
            ))}
            {/* Day Cells */}
            {DAYS.map(day => (
              <div key={day} style={S.ttCell}>
                {ttByDay[day]?.length === 0 ? (
                  <div style={S.ttEmpty}>—</div>
                ) : (
                  ttByDay[day]?.map((slot, i) => (
                    <div key={i} style={{
                      ...S.ttBlock,
                      background: subjectColorMap[slot.subject_name] || COLORS[0],
                    }}>
                      <strong>{slot.subject_name}</strong>
                      <br />
                      <span style={{ fontWeight: 500, fontSize: '0.68rem' }}>
                        {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={S.ttLegend}>
            {Object.entries(subjectColorMap).map(([name, color]) => (
              <div key={name} style={S.ttLegItem}>
                <div style={{ ...S.ttLegDot, background: color }} />
                {name}
              </div>
            ))}
            {timetable.length === 0 && (
              <span style={{ color: '#6b7a99', fontSize: '0.82rem' }}>
                Generate a timetable to see your schedule here
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ BOTTOM ROW ══════════════ */}
      <div style={S.bottomRow}>
        {/* Dashboard Card */}
        <div style={S.dashCard}>
          <div style={S.dashTitle}>📊 Progress Dashboard</div>
          <div style={S.dashIllus}>⏰📚</div>
          <div style={S.dashStats}>
            <div style={S.dashStat}>
              🟢 {subjects.length > 0 ? 'On Track' : 'Add Subjects'}
            </div>
            <div style={S.dashStat}>
              📅 {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
            </div>
            <div style={S.dashStat}>
              🎯 {totalHours} hrs/week goal
            </div>
          </div>
        </div>

        {/* Reminder Card */}
        <div style={S.reminderCard}>
          <div style={S.reminderTitle}>🔔 Study Reminder</div>
          <div style={S.reminderBox}>
            <div style={S.reminderBoxTitle}>⏰ Upcoming Reminder!</div>
            <div style={{ textAlign: 'center', marginBottom: '8px', fontWeight: 800, fontSize: '1rem', color: '#1e3a5f' }}>
              Time to Study!
            </div>
            {timetable.length > 0 ? (
              <>
                <div style={S.reminderTimeRow}>
                  🕓 <span>{timetable[0]?.subject_name}: {timetable[0]?.start_time?.slice(0,5)} – {timetable[0]?.end_time?.slice(0,5)}</span>
                </div>
                <div style={S.reminderMsg}>
                  Focus on {timetable[0]?.subject_name} now. You've got this! 💪
                </div>
              </>
            ) : (
              <div style={S.reminderMsg}>Generate a timetable to see your next session!</div>
            )}
          </div>
          <div style={S.reminderBtns}>
            <button style={{ ...S.rbtn, background: '#2563eb' }}
              onClick={() => showToast('⏰ Reminder snoozed for 10 minutes.')}>
              Snooze
            </button>
            <button style={{ ...S.rbtn, background: '#7c3aed' }}
              onClick={() => showToast('🎉 Great work! Session marked as done!')}>
              Mark as Done
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div style={{ ...S.toast, opacity: toastVisible ? 1 : 0, transform: toastVisible ? 'translateY(0)' : 'translateY(10px)' }}>
        {toast}
      </div>
    </div>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */
const S = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    background: '#e8edf5',
    minHeight: '100vh',
    padding: '24px',
    color: '#1a2b42',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto 24px',
  },
  pageTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '1.7rem',
    fontWeight: 900,
    color: '#1e3a5f',
    letterSpacing: '-0.5px',
  },
  logoutBtn: {
    padding: '8px 18px',
    background: 'white',
    border: '1.5px solid #d0daea',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#1e3a5f',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: '22px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(30,58,95,0.10)',
  },
  setupCard: { gridColumn: 1, gridRow: 1 },
  progressCard: { gridColumn: 1, gridRow: 2 },
  timetableCard: { gridColumn: 2, gridRow: '1 / 3' },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#1e3a5f',
    marginBottom: '16px',
  },
  iconCircle: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    flexShrink: 0,
  },
  setupInner: { display: 'flex', gap: '18px', alignItems: 'flex-start' },
  setupForm: { flex: 1 },
  welcome: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#1e3a5f',
    marginBottom: '2px',
  },
  setupSubtitle: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#1e3a5f',
    marginBottom: '14px',
  },
  sectionBox: {
    border: '1.5px solid #d0daea',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: '0.85rem',
    color: '#1e3a5f',
    marginBottom: '10px',
  },
  subjectItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '7px',
    fontSize: '0.88rem',
  },
  subjectDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px',
    flexShrink: 0,
  },
  subjectName: { fontWeight: 700 },
  subjectMeta: { color: '#6b7a99', flex: 1 },
  deleteDot: {
    background: 'none',
    border: 'none',
    color: '#e05c7b',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '0 2px',
  },
  timeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem',
    marginBottom: '7px',
  },
  checkIcon: { color: '#3aaa6e', fontSize: '12px', flexShrink: 0 },
  addBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#2563eb',
    fontSize: '0.85rem',
    fontWeight: 600,
    padding: '4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  inlineForm: {
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '12px',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  smallInput: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1.5px solid #d0daea',
    fontSize: '0.85rem',
    fontFamily: "'DM Sans', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
    color: '#1a2b42',
  },
  confirmBtn: {
    flex: 1,
    padding: '8px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '8px',
    background: '#f1f5f9',
    color: '#6b7a99',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  genBtn: {
    marginTop: '10px',
    width: '100%',
    padding: '13px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  illus: {
    width: '80px',
    height: '90px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    flexShrink: 0,
  },
  progStats: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' },
  statBadge: {
    padding: '6px 12px',
    borderRadius: '8px',
    color: 'white',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: '0.78rem',
  },
  progOverviewTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: '0.85rem',
    color: '#1e3a5f',
    marginBottom: '10px',
  },
  chartsRow: { display: 'flex', gap: '16px', alignItems: 'center' },
  barChart: {
    flex: 1,
    height: '100px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
  },
  bar: {
    flex: 1,
    borderRadius: '4px 4px 0 0',
    minWidth: '10px',
    cursor: 'pointer',
    transition: 'height 0.6s ease',
  },
  pieWrap: { width: '90px', height: '90px', flexShrink: 0 },
  pie: { width: '90px', height: '90px', borderRadius: '50%' },
  pieLegend: { display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '10px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600 },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  ttGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '12px',
  },
  ttHeader: {
    textAlign: 'center',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: '0.75rem',
    color: '#6b7a99',
    padding: '4px 0',
  },
  ttCell: {
    minHeight: '120px',
    borderRadius: '8px',
    background: '#f4f7fb',
    padding: '3px',
  },
  ttEmpty: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#d0daea',
    fontSize: '1.2rem',
  },
  ttBlock: {
    borderRadius: '7px',
    padding: '6px 7px',
    color: 'white',
    fontFamily: "'Nunito', sans-serif",
    fontSize: '0.72rem',
    fontWeight: 800,
    lineHeight: 1.3,
    marginBottom: '3px',
    cursor: 'pointer',
  },
  ttLegend: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '8px',
  },
  ttLegItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  ttLegDot: { width: '12px', height: '12px', borderRadius: '3px' },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '22px',
    maxWidth: '1200px',
    margin: '22px auto 0',
  },
  dashCard: {
    background: '#1e3a5f',
    color: 'white',
    borderRadius: '18px',
    padding: '22px',
    boxShadow: '0 4px 20px rgba(30,58,95,0.10)',
  },
  dashTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: '14px',
  },
  dashIllus: {
    width: '100%',
    height: '100px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.2) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
  },
  dashStats: { display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' },
  dashStat: {
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  reminderCard: {
    background: '#5c9f3a',
    color: 'white',
    borderRadius: '18px',
    padding: '22px',
    boxShadow: '0 4px 20px rgba(30,58,95,0.10)',
  },
  reminderTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: '14px',
  },
  reminderBox: {
    background: 'white',
    color: '#1a2b42',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '12px',
  },
  reminderBoxTitle: {
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 900,
    fontSize: '0.95rem',
    marginBottom: '6px',
    color: '#1e3a5f',
    textAlign: 'center',
  },
  reminderTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '4px',
  },
  reminderMsg: { fontSize: '0.8rem', color: '#6b7a99', textAlign: 'center' },
  reminderBtns: { display: 'flex', gap: '10px' },
  rbtn: {
    flex: 1,
    padding: '11px',
    border: 'none',
    borderRadius: '10px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: '0.88rem',
    cursor: 'pointer',
    color: 'white',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#1e3a5f',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '10px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
    fontSize: '0.9rem',
    transition: 'all 0.3s',
    pointerEvents: 'none',
    zIndex: 999,
  },
};

const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [subjects] = await pool.query(
      'SELECT * FROM subjects WHERE user_id = ?', [userId]
    );
    const [availability] = await pool.query(
      'SELECT * FROM availability WHERE user_id = ?', [userId]
    );

    if (subjects.length === 0)
      return res.status(400).json({ message: 'Please add subjects first' });
    if (availability.length === 0)
      return res.status(400).json({ message: 'Please add availability first' });

    const aiResponse = await axios.post('http://localhost:8000/generate-timetable', {
      subjects, availability
    });

    const timetable = aiResponse.data.timetable;

    await pool.query('DELETE FROM timetable WHERE user_id = ?', [userId]);

    for (const slot of timetable) {
      await pool.query(
        'INSERT INTO timetable (user_id, subject_id, study_date, start_time, end_time) VALUES (?, ?, CURDATE(), ?, ?)',
        [userId, slot.subject_id, slot.start_time, slot.end_time]
      );
    }

    res.json({ timetable });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to generate timetable' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT t.*, s.subject_name, s.difficulty_level, s.priority
     FROM timetable t
     JOIN subjects s ON t.subject_id = s.subject_id
     WHERE t.user_id = ?
     ORDER BY t.study_date, t.start_time`,
    [req.user.user_id]
  );
  res.json(rows);
});

module.exports = router;
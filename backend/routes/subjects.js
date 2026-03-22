const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [subjects] = await pool.query(
      'SELECT * FROM subjects WHERE user_id = ? ORDER BY priority DESC',
      [req.user.user_id]
    );
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject_name, difficulty_level, priority, hours_per_week } = req.body;
    const [result] = await pool.query(
      'INSERT INTO subjects (user_id, subject_name, difficulty_level, priority, hours_per_week) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, subject_name, difficulty_level, priority, hours_per_week]
    );
    res.status(201).json({ subject_id: result.insertId, subject_name, difficulty_level, priority, hours_per_week });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM subjects WHERE subject_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
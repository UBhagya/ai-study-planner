const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM availability WHERE user_id = ?', [req.user.user_id]
  );
  res.json(rows);
});

router.post('/', authMiddleware, async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  const [result] = await pool.query(
    'INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
    [req.user.user_id, day_of_week, start_time, end_time]
  );
  res.status(201).json({ availability_id: result.insertId, day_of_week, start_time, end_time });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await pool.query(
    'DELETE FROM availability WHERE availability_id = ? AND user_id = ?',
    [req.params.id, req.user.user_id]
  );
  res.json({ message: 'Deleted' });
});

module.exports = router;
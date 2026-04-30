// backend/routes/habitRoutes.js
const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/habits  — returns habits with last 7 days history
router.get('/', auth, async (req, res) => {
  try {
    const [habits] = await db.query(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at',
      [req.user.id]
    );

    for (const h of habits) {
      // Build 7-day history array (0=oldest, 6=today)
      const [checkins] = await db.query(
        `SELECT checkin_date FROM habit_checkins
         WHERE habit_id = ? AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         ORDER BY checkin_date`,
        [h.id]
      );
      const checkinSet = new Set(checkins.map(c => c.checkin_date.toISOString().slice(0, 10)));
      h.history = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        h.history.push(checkinSet.has(d.toISOString().slice(0, 10)) ? 1 : 0);
      }
      h.today_done = h.history[6] === 1;
    }

    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits
router.post('/', auth, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Habit name is required.' });

    const [result] = await db.query(
      'INSERT INTO habits (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name, icon || '⭐', color || '#7c6aff']
    );
    const [habits] = await db.query('SELECT * FROM habits WHERE id = ?', [result.insertId]);
    habits[0].history = [0, 0, 0, 0, 0, 0, 0];
    habits[0].today_done = false;
    res.status(201).json(habits[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/habits/:id/checkin  — toggle today's check-in
router.put('/:id/checkin', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Verify ownership
    const [rows] = await db.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Habit not found.' });

    const [existing] = await db.query(
      'SELECT id FROM habit_checkins WHERE habit_id = ? AND checkin_date = ?',
      [req.params.id, today]
    );

    let checked;
    if (existing.length > 0) {
      // Un-check
      await db.query('DELETE FROM habit_checkins WHERE habit_id = ? AND checkin_date = ?',
        [req.params.id, today]);
      checked = false;
    } else {
      // Check in
      await db.query('INSERT INTO habit_checkins (habit_id, checkin_date) VALUES (?, ?)',
        [req.params.id, today]);
      checked = true;
    }

    // Recalculate streak
    const [allCheckins] = await db.query(
      'SELECT checkin_date FROM habit_checkins WHERE habit_id = ? ORDER BY checkin_date DESC',
      [req.params.id]
    );
    let streak = 0;
    let cursor = new Date();
    for (const row of allCheckins) {
      const d = row.checkin_date.toISOString().slice(0, 10);
      const expected = cursor.toISOString().slice(0, 10);
      if (d === expected) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }

    await db.query(
      'UPDATE habits SET streak = ?, best_streak = GREATEST(best_streak, ?) WHERE id = ?',
      [streak, streak, req.params.id]
    );

    res.json({ checked, streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Habit deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
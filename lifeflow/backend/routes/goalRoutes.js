// backend/routes/goalRoutes.js
const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const [goals] = await db.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const g of goals) {
      const [subs] = await db.query(
        'SELECT * FROM goal_subtasks WHERE goal_id = ? ORDER BY sort_order',
        [g.id]
      );
      g.subtasks = subs;
    }
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, progress, color, subtasks } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const [result] = await db.query(
      'INSERT INTO goals (user_id, title, type, progress, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, type || 'weekly', progress || 0, color || '#7c6aff']
    );
    const goalId = result.insertId;

    if (Array.isArray(subtasks) && subtasks.length > 0) {
      const vals = subtasks.map((s, i) => [goalId, s.title || s, s.done ? 1 : 0, i]);
      await db.query(
        'INSERT INTO goal_subtasks (goal_id, title, done, sort_order) VALUES ?',
        [vals]
      );
    }

    const [goals] = await db.query('SELECT * FROM goals WHERE id = ?', [goalId]);
    const [subs]  = await db.query('SELECT * FROM goal_subtasks WHERE goal_id = ?', [goalId]);
    goals[0].subtasks = subs;
    res.status(201).json(goals[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, progress, color } = req.body;
    await db.query(
      `UPDATE goals SET
        title    = COALESCE(?, title),
        type     = COALESCE(?, type),
        progress = COALESCE(?, progress),
        color    = COALESCE(?, color)
       WHERE id = ? AND user_id = ?`,
      [title, type, progress, color, req.params.id, req.user.id]
    );
    res.json({ message: 'Goal updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/goals/:goalId/subtasks/:subId
router.put('/:goalId/subtasks/:subId', auth, async (req, res) => {
  try {
    const { done } = req.body;
    await db.query(
      'UPDATE goal_subtasks SET done = ? WHERE id = ? AND goal_id = ?',
      [done ? 1 : 0, req.params.subId, req.params.goalId]
    );
    // Recalculate progress
    const [subs]  = await db.query('SELECT done FROM goal_subtasks WHERE goal_id = ?', [req.params.goalId]);
    const progress = subs.length ? Math.round((subs.filter(s => s.done).length / subs.length) * 100) : 0;
    await db.query('UPDATE goals SET progress = ? WHERE id = ?', [progress, req.params.goalId]);
    res.json({ message: 'Subtask updated.', progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Goal deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// backend/routes/taskRoutes.js
const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/tasks?date=YYYY-MM-DD&category=study
router.get('/', auth, async (req, res) => {
  try {
    const { date, category } = req.query;
    let sql    = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [req.user.id];

    if (date) {
      sql += ' AND task_date = ?';
      params.push(date);
    }
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY task_date DESC, task_time ASC';

    const [tasks] = await db.query(sql, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, task_time, duration, task_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Task name is required.' });

    const [result] = await db.query(
      `INSERT INTO tasks (user_id, name, category, task_time, duration, task_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, category || 'personal', task_time || null,
       duration || null, task_date || new Date().toISOString().slice(0, 10)]
    );
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(tasks[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, task_time, duration, done } = req.body;
    await db.query(
      `UPDATE tasks SET
        name      = COALESCE(?, name),
        category  = COALESCE(?, category),
        task_time = COALESCE(?, task_time),
        duration  = COALESCE(?, duration),
        done      = COALESCE(?, done)
       WHERE id = ? AND user_id = ?`,
      [name, category, task_time, duration,
       done !== undefined ? (done ? 1 : 0) : null,
       req.params.id, req.user.id]
    );
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(tasks[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
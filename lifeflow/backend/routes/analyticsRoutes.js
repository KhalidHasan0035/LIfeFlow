// backend/routes/analyticsRoutes.js
const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/analytics/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const uid = req.user.id;

    const [[taskRow]] = await db.query(
      `SELECT
        COUNT(*) AS total,
        SUM(done) AS done_count
       FROM tasks WHERE user_id = ? AND task_date = CURDATE()`,
      [uid]
    );

    const [[goalRow]] = await db.query(
      'SELECT COUNT(*) AS count FROM goals WHERE user_id = ?', [uid]
    );

    const [[habitRow]] = await db.query(
      `SELECT COUNT(*) AS total,
        SUM(CASE WHEN hc.id IS NOT NULL THEN 1 ELSE 0 END) AS done_today
       FROM habits h
       LEFT JOIN habit_checkins hc ON hc.habit_id = h.id AND hc.checkin_date = CURDATE()
       WHERE h.user_id = ?`,
      [uid]
    );

    // Longest streak
    const [[streakRow]] = await db.query(
      'SELECT MAX(streak) AS max_streak FROM habits WHERE user_id = ?', [uid]
    );

    // Monthly tasks
    const [[monthRow]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(done) AS done_count
       FROM tasks WHERE user_id = ? AND MONTH(task_date) = MONTH(CURDATE())
       AND YEAR(task_date) = YEAR(CURDATE())`,
      [uid]
    );

    const taskDoneToday = Number(taskRow.done_count || 0);
    const taskTotalToday = Number(taskRow.total || 0);
    const habitDoneToday = Number(habitRow.done_today || 0);
    const habitTotal = Number(habitRow.total || 0);

    res.json({
      goals_active:      Number(goalRow.count),
      tasks_done_today:  taskDoneToday,
      tasks_total_today: taskTotalToday,
      today_pct:         taskTotalToday ? Math.round((taskDoneToday / taskTotalToday) * 100) : 0,
      habits_done_today: habitDoneToday,
      habits_total:      habitTotal,
      habit_pct:         habitTotal ? Math.round((habitDoneToday / habitTotal) * 100) : 0,
      current_streak:    Number(streakRow.max_streak || 0),
      monthly_tasks_done: Number(monthRow.done_count || 0),
      monthly_tasks_total: Number(monthRow.total || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/weekly  — last 7 days completion %
router.get('/weekly', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const rows = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const [[row]] = await db.query(
        `SELECT COUNT(*) AS total, SUM(done) AS done_count
         FROM tasks WHERE user_id = ? AND task_date = ?`,
        [uid, dateStr]
      );
      const total = Number(row.total || 0);
      const done  = Number(row.done_count || 0);
      rows.push({ date: dateStr, day: dayName, total, done, pct: total ? Math.round((done / total) * 100) : 0 });
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT category,
        COUNT(*) AS total,
        SUM(done) AS done_count
       FROM tasks WHERE user_id = ?
       GROUP BY category`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
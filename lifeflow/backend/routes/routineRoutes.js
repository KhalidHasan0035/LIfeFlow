// backend/routes/routineRoutes.js
const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// GET /api/routine?date=YYYY-MM-DD
router.get('/', auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const [blocks] = await db.query(
      `SELECT * FROM routine_blocks WHERE user_id = ? AND routine_date = ?
       ORDER BY sort_order, block_time`,
      [req.user.id, date]
    );

    const done     = blocks.filter(b => b.status === 'done').length;
    const total    = blocks.length;
    const pct      = total ? Math.round((done / total) * 100) : 0;

    res.json({ date, blocks, summary: { done, total, pct } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/routine
router.post('/', auth, async (req, res) => {
  try {
    const { name, block_time, duration, routine_date, sort_order } = req.body;
    if (!name || !block_time)
      return res.status(400).json({ error: 'Name and block_time are required.' });

    const date = routine_date || new Date().toISOString().slice(0, 10);

    // Auto sort_order: append at end
    const [maxRow] = await db.query(
      'SELECT MAX(sort_order) as mx FROM routine_blocks WHERE user_id = ? AND routine_date = ?',
      [req.user.id, date]
    );
    const order = sort_order || (maxRow[0].mx || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO routine_blocks (user_id, name, block_time, duration, routine_date, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, block_time, duration || null, date, order]
    );
    const [blocks] = await db.query('SELECT * FROM routine_blocks WHERE id = ?', [result.insertId]);
    res.status(201).json(blocks[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/routine/:id  — update status or details
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, block_time, duration, status } = req.body;
    await db.query(
      `UPDATE routine_blocks SET
        name       = COALESCE(?, name),
        block_time = COALESCE(?, block_time),
        duration   = COALESCE(?, duration),
        status     = COALESCE(?, status)
       WHERE id = ? AND user_id = ?`,
      [name, block_time, duration, status, req.params.id, req.user.id]
    );
    res.json({ message: 'Routine block updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/routine/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM routine_blocks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Routine block deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
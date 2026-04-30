// backend/routes/authRoutes.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const router  = express.Router();

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, name: user.name },
  process.env.JWT_SECRET || 'secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered.' });

    const hash   = await bcrypt.hash(password, 10);
    const avatar = name.trim().split(' ').map(w => w[0].toUpperCase()).join('').slice(0, 2);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash, avatar]
    );

    const user  = { id: result.insertId, email, name };
    const token = sign(user);
    res.status(201).json({ token, user: { id: user.id, name, email, avatar, plan: 'free' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = sign(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/seed  — creates the demo user on first run
router.post('/seed', async (req, res) => {
  try {
    const hash = await bcrypt.hash('demo123', 10);
    await db.query(
      `INSERT INTO users (name, email, password, avatar, plan)
       VALUES ('Demo User', 'demo@lifeflow.com', ?, 'DU', 'pro')
       ON DUPLICATE KEY UPDATE name=name`,
      [hash]
    );
    res.json({ message: 'Demo user ready. Email: demo@lifeflow.com | Password: demo123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// backend/server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/goals',     require('./routes/goalRoutes'));
app.use('/api/tasks',     require('./routes/taskRoutes'));
app.use('/api/habits',    require('./routes/habitRoutes'));
app.use('/api/routine',   require('./routes/routineRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ─── Serve Frontend ───────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Login page
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// App page
app.get('/app', (req, res) => {
  res.sendFile(path.join(frontendPath, 'app.html'));
});

// 404 fallback for unknown routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  🚀 LifeFlow Server running!');
  console.log(`  👉 Open: http://localhost:${PORT}`);
  console.log(`  📡 API:  http://localhost:${PORT}/api`);
  console.log('');
  console.log('  Demo login: demo@lifeflow.com / demo123');
  console.log('  (Run POST /api/auth/seed once to activate demo user)');
  console.log('');
});
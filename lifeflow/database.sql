-- ============================================================
-- LifeFlow Database Schema
-- Run: mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS lifeflow_db;
USE lifeflow_db;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(10) DEFAULT NULL,
  plan ENUM('free','pro') DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('daily','weekly','monthly') DEFAULT 'weekly',
  progress INT DEFAULT 0,
  color VARCHAR(30) DEFAULT '#7c6aff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- GOAL SUBTASKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_subtasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goal_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  done TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('study','health','personal','work','other') DEFAULT 'personal',
  task_time VARCHAR(20) DEFAULT NULL,
  duration VARCHAR(30) DEFAULT NULL,
  done TINYINT(1) DEFAULT 0,
  task_date DATE DEFAULT (CURDATE()),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '⭐',
  color VARCHAR(30) DEFAULT '#7c6aff',
  streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- HABIT CHECK-INS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  habit_id INT NOT NULL,
  checkin_date DATE NOT NULL,
  UNIQUE KEY unique_checkin (habit_id, checkin_date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- DAILY ROUTINE BLOCKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routine_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  block_time VARCHAR(10) NOT NULL,
  duration VARCHAR(30) DEFAULT NULL,
  status ENUM('done','active','upcoming') DEFAULT 'upcoming',
  routine_date DATE DEFAULT (CURDATE()),
  sort_order INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- DEMO USER (password: demo123)
-- ─────────────────────────────────────────
INSERT INTO users (name, email, password, avatar, plan) VALUES
('Abdullah Hasan', 'demo@lifeflow.com', '$2b$10$rQnKMd/YourHashedPasswordHere', 'AH', 'pro')
ON DUPLICATE KEY UPDATE name=name;

-- Note: The demo user password hash above is a placeholder.
-- The server seeds a real bcrypt hash on first startup via /api/auth/seed
-- Or simply register at http://localhost:5000 with any email.

-- ─────────────────────────────────────────
-- SAMPLE DATA (linked to user id=1)
-- ─────────────────────────────────────────

-- Goals
INSERT INTO goals (user_id, title, type, progress, color) VALUES
(1, 'Read 2 textbooks this month', 'monthly', 45, '#f5a623'),
(1, 'Exercise 5 days this week', 'weekly', 60, '#3ecf8e'),
(1, 'Finish DSA course', 'monthly', 30, '#7c6aff'),
(1, 'Meditate every morning', 'daily', 85, '#23c5c5');

-- Goal subtasks
INSERT INTO goal_subtasks (goal_id, title, done, sort_order) VALUES
(1, 'Read 30 min daily', 1, 1),
(1, 'Take notes', 0, 2),
(1, 'Weekly review', 0, 3),
(2, 'Morning jog', 1, 1),
(2, 'Evening stretches', 1, 2),
(2, 'Strength training', 0, 3),
(3, 'Arrays & Strings', 1, 1),
(3, 'Linked Lists', 0, 2),
(3, 'Trees & Graphs', 0, 3),
(3, 'DP Problems', 0, 4),
(4, '10 min session', 1, 1),
(4, 'Breathing exercise', 0, 2);

-- Tasks
INSERT INTO tasks (user_id, name, category, task_time, duration, done) VALUES
(1, 'Complete Chapter 5 notes', 'study', '08:00', '2 hours', 0),
(1, 'Morning jog – 30 mins', 'health', '06:30', '30 min', 1),
(1, 'Review lecture slides', 'study', '10:00', '1 hour', 0),
(1, 'Water intake tracking', 'health', 'All day', '—', 1),
(1, 'Call mom', 'personal', '18:00', '30 min', 0),
(1, 'Write daily journal', 'personal', '21:00', '30 min', 0),
(1, 'Group project meeting', 'work', '14:00', '1 hour', 0),
(1, 'Solve 5 math problems', 'study', '16:00', '1 hour', 1);

-- Habits
INSERT INTO habits (user_id, name, icon, color, streak, best_streak) VALUES
(1, 'Study 2hrs', '📚', '#7c6aff', 7, 14),
(1, 'Exercise', '🏃', '#3ecf8e', 5, 10),
(1, 'Read 20min', '📖', '#23c5c5', 12, 18),
(1, '8hrs Sleep', '😴', '#f5a623', 3, 7),
(1, 'Drink Water', '💧', '#ff6b9d', 14, 21),
(1, 'Journal', '✍️', '#f5a623', 4, 8);

-- Habit check-ins (last 7 days for habit id 1)
INSERT IGNORE INTO habit_checkins (habit_id, checkin_date) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(2, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(2, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(3, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(3, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(3, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(3, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Routine blocks
INSERT INTO routine_blocks (user_id, name, block_time, duration, status, sort_order) VALUES
(1, 'Wake up & freshen', '06:00', '20 min', 'done', 1),
(1, 'Morning jog', '06:30', '30 min', 'done', 2),
(1, 'Breakfast & planning', '07:00', '30 min', 'done', 3),
(1, 'Study – Chapter 5 notes', '08:00', '2 hrs', 'done', 4),
(1, 'Review lecture slides', '10:00', '1 hr', 'done', 5),
(1, 'Short break', '11:00', '15 min', 'done', 6),
(1, 'Group project meeting', '11:15', '45 min', 'done', 7),
(1, 'Lunch', '12:00', '1 hr', 'done', 8),
(1, 'Solve math problems', '14:00', '1.5 hrs', 'active', 9),
(1, 'Online lecture', '15:30', '1 hr', 'upcoming', 10),
(1, 'Self-study', '16:30', '1 hr', 'upcoming', 11),
(1, 'Call mom', '18:00', '30 min', 'upcoming', 12),
(1, 'Dinner', '19:00', '45 min', 'upcoming', 13),
(1, 'Write daily journal', '21:00', '20 min', 'upcoming', 14),
(1, 'Wind down & sleep', '22:00', '—', 'upcoming', 15);
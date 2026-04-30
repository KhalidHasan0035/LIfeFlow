// frontend/js/habits.js

async function initHabits() {
  try {
    const habits = await api.getHabits();
    renderHabits(habits);
  } catch (err) {
    console.error('Habits load error:', err.message);
  }
}

function renderHabits(habits) {
  const el = document.getElementById('habitsGrid');
  if (!el) return;
  el.innerHTML = habits.length
    ? ''
    : '<p style="color:var(--text3);font-size:.85rem">No habits yet. Add your first habit!</p>';

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  habits.forEach(h => {
    const history = h.history || [0, 0, 0, 0, 0, 0, 0];
    const pct = Math.round((history.filter(Boolean).length / 7) * 100);

    const dotsHtml = history.map((v, i) => {
      const isToday = i === 6;
      return `<div class="habit-dot${v ? ' done' : ''}${isToday ? ' today' : ''}"
                   onclick="${isToday ? `checkinHabit(${h.id})` : ''}"
                   title="${dayLabels[i]}">${dayLabels[i][0]}</div>`;
    }).join('');

    const div = document.createElement('div');
    div.className = 'habit-card';
    div.id = 'habit-' + h.id;
    div.innerHTML = `
      <div class="habit-header">
        <div class="habit-name">${h.icon} ${escHtml(h.name)}</div>
        <div style="display:flex;align-items:center;gap:.5rem">
          <div class="habit-streak">🔥 ${h.streak}</div>
          <button onclick="deleteHabit(${h.id})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.75rem" title="Delete">✕</button>
        </div>
      </div>
      <div class="habit-dots">${dotsHtml}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <span style="font-size:.7rem;color:var(--text3)">Weekly: ${pct}%</span>
        <span style="font-size:.7rem;color:var(--text3)">Best: ${h.best_streak} days</span>
      </div>
      <div class="habit-progress">
        <div class="habit-bar" style="width:${pct}%;background:${h.color}"></div>
      </div>
    `;
    el.appendChild(div);
  });
}

async function checkinHabit(id) {
  try {
    const res = await api.checkinHabit(id);
    initHabits();
    showToast(res.checked ? `Habit checked in! Streak: ${res.streak}🔥` : 'Check-in removed.');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function deleteHabit(id) {
  if (!confirm('Delete this habit?')) return;
  try {
    await api.deleteHabit(id);
    document.getElementById('habit-' + id)?.remove();
    showToast('Habit deleted.');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function handleAddHabit(e) {
  e.preventDefault();
  const name = document.getElementById('habitName').value.trim();
  if (!name) return;
  try {
    await api.createHabit({
      name,
      icon:  document.getElementById('habitIcon').value || '⭐',
      color: document.getElementById('habitColor').value || '#7c6aff',
    });
    closeModal('habitModal');
    e.target.reset();
    initHabits();
    showToast('Habit added!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}
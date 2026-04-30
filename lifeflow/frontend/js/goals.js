// frontend/js/goals.js

async function initGoals() {
  try {
    const goals = await api.getGoals();
    renderGoals(goals);
  } catch (err) {
    console.error('Goals load error:', err.message);
  }
}

function renderGoals(goals) {
  const el = document.getElementById('goalsList');
  if (!el) return;
  el.innerHTML = goals.length
    ? ''
    : '<p style="color:var(--text3);font-size:.85rem;padding:.5rem 0">No goals yet. Create your first goal!</p>';

  goals.forEach(g => {
    const typeColors = { daily: 'var(--accent)', weekly: 'var(--teal)', monthly: 'var(--amber)' };
    const color = typeColors[g.type] || 'var(--accent)';
    const subs  = (g.subtasks || []);
    const subsHtml = subs.map(s => `
      <span class="goal-task-mini${s.done ? ' done' : ''}"
            onclick="toggleSub(${g.id}, ${s.id}, ${s.done})" style="cursor:pointer">
        ${s.done ? '✓ ' : ''}${escHtml(s.title)}
      </span>`).join('');

    const div = document.createElement('div');
    div.className = 'goal-item';
    div.id = 'goal-' + g.id;
    div.innerHTML = `
      <div class="goal-top">
        <div class="goal-title">${escHtml(g.title)}</div>
        <div style="display:flex;gap:.5rem;align-items:center">
          <span class="goal-type type-${g.type}">${g.type}</span>
          <button onclick="deleteGoal(${g.id})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.8rem" title="Delete">✕</button>
        </div>
      </div>
      <div class="goal-progress-row">
        <div class="goal-pct" style="color:${color}">${g.progress}%</div>
        <div class="goal-bar-wrap">
          <div class="goal-bar" style="width:${g.progress}%;background:${color}"></div>
        </div>
      </div>
      ${subs.length ? `<div class="goal-tasks-mini">${subsHtml}</div>` : ''}
    `;
    el.appendChild(div);
  });
}

async function toggleSub(goalId, subId, currentDone) {
  try {
    const res = await api.toggleSubtask(goalId, subId, !currentDone);
    // Re-fetch and re-render
    const goals = await api.getGoals();
    renderGoals(goals);
    showToast('Progress updated!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  try {
    await api.deleteGoal(id);
    document.getElementById('goal-' + id)?.remove();
    showToast('Goal deleted.');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function handleCreateGoal(e) {
  e.preventDefault();
  const title    = document.getElementById('goalTitle').value.trim();
  const type     = document.getElementById('goalType').value;
  const subRaw   = document.getElementById('goalSubtasks').value;
  const subtasks = subRaw.split(',').map(s => s.trim()).filter(Boolean);

  if (!title) return;

  try {
    await api.createGoal({ title, type, subtasks });
    closeModal('goalModal');
    e.target.reset();
    initGoals();
    showToast('Goal created!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}
// frontend/js/dashboard.js
let weeklyChartInst = null;
let donutChartInst  = null;

async function initDashboard() {
  try {
    const [summary, weekly, categories] = await Promise.all([
      api.getSummary(),
      api.getWeekly(),
      api.getCategories(),
    ]);

    // Stat cards
    setEl('dashGoals',    summary.goals_active);
    setEl('dashDone',     summary.tasks_done_today);
    setEl('dashStreak',   '🔥 ' + summary.current_streak);
    setEl('dashHabitPct', summary.habit_pct + '%');

    // Today tasks
    const tasks = await api.getTasks({ date: todayStr() });
    renderDashTasks(tasks.slice(0, 5));

    // Weekly bar chart
    renderWeeklyChart(weekly);

    // Donut chart
    renderDonutChart(categories);

  } catch (err) {
    console.error('Dashboard load error:', err.message);
  }
}

function renderDashTasks(tasks) {
  const el = document.getElementById('dashTaskList');
  if (!el) return;
  el.innerHTML = tasks.length ? '' : '<p style="color:var(--text3);font-size:.85rem;padding:.5rem 0">No tasks for today yet.</p>';
  tasks.forEach(t => {
    const div = document.createElement('div');
    div.className = 'task-item' + (t.done ? ' done' : '');
    div.innerHTML = `
      <div class="task-check" onclick="quickToggle(${t.id}, ${t.done ? 1 : 0})">
        ${t.done ? '<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" fill="none" stroke="white" stroke-width="1.8"/></svg>' : ''}
      </div>
      <div class="task-info">
        <div class="task-name">${escHtml(t.name)}</div>
        <div class="task-meta">${t.task_time || '—'} · ${t.duration || '—'}</div>
      </div>
      <span class="task-badge badge-${t.category}">${t.category}</span>
    `;
    el.appendChild(div);
  });
}

async function quickToggle(id, currentDone) {
  await api.updateTask(id, { done: !currentDone });
  initDashboard();
}

function renderWeeklyChart(weekly) {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx) return;
  if (weeklyChartInst) weeklyChartInst.destroy();

  weeklyChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weekly.map(d => d.day),
      datasets: [
        {
          label: 'Completed %',
          data: weekly.map(d => d.pct),
          backgroundColor: 'rgba(124,106,255,.8)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Planned',
          data: weekly.map(d => d.total > 0 ? 100 : 0),
          backgroundColor: 'rgba(124,106,255,.12)',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)', drawBorder: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)', drawBorder: false }, min: 0, max: 100, ticks: { font: { size: 11 } } },
      },
    },
  });
}

function renderDonutChart(categories) {
  const ctx = document.getElementById('donutChart');
  if (!ctx) return;
  if (donutChartInst) donutChartInst.destroy();

  const colors = {
    study: 'rgba(124,106,255,.85)',
    health: 'rgba(62,207,142,.85)',
    personal: 'rgba(245,166,35,.85)',
    work: 'rgba(35,197,197,.85)',
    other: 'rgba(255,107,157,.85)',
  };
  const labels = categories.map(c => c.category);
  const data   = categories.map(c => Number(c.total));
  const bgs    = labels.map(l => colors[l] || 'rgba(150,150,200,.7)');

  donutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: bgs, borderWidth: 0, hoverOffset: 4 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { position: 'bottom', labels: { padding: 12, boxWidth: 10, font: { size: 11 } } } },
    },
  });
}
// frontend/js/analytics.js
let monthlyChartInst = null;
let categoryChartInst = null;

async function initAnalytics() {
  try {
    const [summary, weekly, categories] = await Promise.all([
      api.getSummary(),
      api.getWeekly(),
      api.getCategories(),
    ]);

    // Summary cards
    setEl('aGoals',    summary.goals_active);
    setEl('aMonthly',  summary.monthly_tasks_done);
    setEl('aHabitPct', summary.habit_pct + '%');
    setEl('aStreak',   summary.current_streak);

    // Weekly day bars
    renderWeeklySummary(weekly);

    // Monthly line chart
    renderMonthlyChart(weekly);

    // Category radar
    renderCategoryChart(categories);

  } catch (err) {
    console.error('Analytics load error:', err.message);
  }
}

function renderWeeklySummary(weekly) {
  const el = document.getElementById('weeklySummary');
  if (!el) return;
  el.innerHTML = weekly.map(d => `
    <div class="day-col">
      <div class="day-bar-wrap">
        <div class="day-bar" style="height:${d.pct}%"></div>
      </div>
      <div class="day-pct">${d.pct}%</div>
      <div class="day-label">${d.day}</div>
    </div>
  `).join('');
}

function renderMonthlyChart(weekly) {
  const ctx = document.getElementById('monthlyChart');
  if (!ctx) return;
  if (monthlyChartInst) monthlyChartInst.destroy();

  monthlyChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weekly.map(d => d.day),
      datasets: [{
        label: 'Completion %',
        data: weekly.map(d => d.pct),
        borderColor: 'rgba(124,106,255,1)',
        backgroundColor: 'rgba(124,106,255,.1)',
        tension: .4,
        fill: true,
        pointBackgroundColor: 'rgba(124,106,255,1)',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, min: 0, max: 100, ticks: { font: { size: 11 } } },
      },
    },
  });
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  if (categoryChartInst) categoryChartInst.destroy();

  const labels = categories.length
    ? categories.map(c => c.category)
    : ['study', 'health', 'personal', 'work'];
  const data = categories.length
    ? categories.map(c => Number(c.done_count || 0))
    : [10, 6, 8, 4];

  categoryChartInst = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Tasks Done',
        data,
        backgroundColor: 'rgba(124,106,255,.2)',
        borderColor: 'rgba(124,106,255,.8)',
        pointBackgroundColor: 'rgba(124,106,255,1)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,.08)' },
          ticks: { display: false },
          pointLabels: { font: { size: 11 }, color: '#9898b8' },
        },
      },
    },
  });
}
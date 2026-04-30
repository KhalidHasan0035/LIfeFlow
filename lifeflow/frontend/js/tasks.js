// frontend/js/tasks.js
let currentFilter = 'all';

async function initTasks() {
  const params = currentFilter !== 'all' ? { category: currentFilter } : {};
  try {
    const tasks = await api.getTasks(params);
    renderTaskList(tasks, 'fullTaskList');
  } catch (err) {
    console.error('Tasks load error:', err.message);
  }
}

function renderTaskList(tasks, targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = tasks.length
    ? ''
    : '<p style="color:var(--text3);font-size:.85rem;padding:.5rem 0">No tasks found.</p>';

  tasks.forEach(t => {
    const div = document.createElement('div');
    div.className = 'task-item' + (t.done ? ' done' : '');
    div.id = 'task-' + t.id;
    div.innerHTML = `
      <div class="task-check" onclick="toggleTask(${t.id}, ${t.done ? 1 : 0})">
        ${t.done ? '<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" fill="none" stroke="white" stroke-width="1.8"/></svg>' : ''}
      </div>
      <div class="task-info">
        <div class="task-name">${escHtml(t.name)}</div>
        <div class="task-meta">${t.task_time || '—'} · ${t.duration || '—'} · ${t.task_date || ''}</div>
      </div>
      <span class="task-badge badge-${t.category}">${t.category}</span>
      <button onclick="deleteTask(${t.id})" style="background:none;border:none;color:var(--text3);cursor:pointer;margin-left:.5rem;font-size:.8rem" title="Delete">✕</button>
    `;
    el.appendChild(div);
  });
}

async function toggleTask(id, currentDone) {
  try {
    await api.updateTask(id, { done: currentDone ? 0 : 1 });
    initTasks();
    showToast(currentDone ? 'Task unmarked.' : 'Task completed!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function deleteTask(id) {
  try {
    await api.deleteTask(id);
    document.getElementById('task-' + id)?.remove();
    showToast('Task deleted.');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

function filterTasks(cat) {
  currentFilter = cat;
  document.querySelectorAll('[id^="tf-"]').forEach(b => b.className = 'btn btn-ghost');
  document.getElementById('tf-' + cat).className = 'btn btn-primary';
  initTasks();
}

async function handleAddTask(e) {
  e.preventDefault();
  const name = document.getElementById('taskName').value.trim();
  if (!name) return;

  try {
    await api.createTask({
      name,
      category:  document.getElementById('taskCat').value,
      task_time: document.getElementById('taskTime').value || null,
      duration:  document.getElementById('taskDur').value,
      task_date: todayStr(),
    });
    closeModal('taskModal');
    e.target.reset();
    initTasks();
    showToast('Task added!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}
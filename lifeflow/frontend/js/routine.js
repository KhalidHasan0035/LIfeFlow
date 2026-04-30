// frontend/js/routine.js
let currentRoutineDate = todayStr();

async function initRoutine(date) {
  currentRoutineDate = date || todayStr();
  try {
    const data = await api.getRoutine(currentRoutineDate);
    renderRoutine(data);
  } catch (err) {
    console.error('Routine load error:', err.message);
  }
}

function renderRoutine(data) {
  const { blocks, summary } = data;

  // Progress bar
  setEl('routineDonePct', summary.pct + '%');
  setEl('routineDoneText', `${summary.done} / ${summary.total} tasks`);
  const bar = document.getElementById('routineProgressBar');
  if (bar) bar.style.width = summary.pct + '%';

  // Timeline
  const el = document.getElementById('routineTimeline');
  if (!el) return;
  el.innerHTML = blocks.length
    ? ''
    : '<p style="color:var(--text3);font-size:.85rem">No routine blocks yet.</p>';

  blocks.forEach(b => {
    const div = document.createElement('div');
    div.className = 'tl-item' + (b.status === 'active' ? ' active' : '');
    div.id = 'block-' + b.id;

    const dotClass = b.status === 'done'
      ? 'tl-dot done'
      : b.status === 'active'
        ? 'tl-dot active'
        : 'tl-dot upcoming';

    div.innerHTML = `
      <div class="tl-time">${b.block_time}</div>
      <div class="${dotClass}"></div>
      <div class="tl-content" style="flex:1;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="tl-task-name">${escHtml(b.name)}</div>
          <div class="tl-task-dur">${b.duration || '—'}</div>
        </div>
        <div style="display:flex;gap:.4rem">
          ${b.status !== 'done' ? `<button onclick="markBlock(${b.id},'done')" class="btn btn-ghost" style="font-size:.7rem;padding:.25rem .6rem">✓ Done</button>` : ''}
          <button onclick="deleteBlock(${b.id})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.75rem">✕</button>
        </div>
      </div>
    `;
    el.appendChild(div);
  });
}

async function markBlock(id, status) {
  try {
    await api.updateBlock(id, { status });
    initRoutine(currentRoutineDate);
    showToast('Block marked done!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function deleteBlock(id) {
  try {
    await api.deleteBlock(id);
    document.getElementById('block-' + id)?.remove();
    showToast('Block removed.');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}

async function handleAddBlock(e) {
  e.preventDefault();
  const name = document.getElementById('blockName').value.trim();
  const time = document.getElementById('blockTime').value;
  if (!name || !time) return;
  try {
    await api.addBlock({
      name,
      block_time: time,
      duration:   document.getElementById('blockDur').value,
      routine_date: currentRoutineDate,
    });
    closeModal('blockModal');
    e.target.reset();
    initRoutine(currentRoutineDate);
    showToast('Block added!');
  } catch (err) {
    showToast('Error: ' + err.message, true);
  }
}
// frontend/js/api.js
// Central API helper — all fetch calls go through here

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('lf_token');
}

async function request(method, endpoint, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  login:    (body) => request('POST', '/auth/login',    body),
  seed:     ()     => request('POST', '/auth/seed'),

  // Goals
  getGoals:       ()        => request('GET',    '/goals'),
  createGoal:     (body)    => request('POST',   '/goals',              body),
  updateGoal:     (id, b)   => request('PUT',    `/goals/${id}`,        b),
  deleteGoal:     (id)      => request('DELETE', `/goals/${id}`),
  toggleSubtask:  (gid,sid,done) => request('PUT', `/goals/${gid}/subtasks/${sid}`, {done}),

  // Tasks
  getTasks:   (params = {}) => request('GET', '/tasks?' + new URLSearchParams(params)),
  createTask: (body)        => request('POST',   '/tasks',      body),
  updateTask: (id, body)    => request('PUT',    `/tasks/${id}`,body),
  deleteTask: (id)          => request('DELETE', `/tasks/${id}`),

  // Habits
  getHabits:     ()   => request('GET',  '/habits'),
  createHabit:   (b)  => request('POST', '/habits',          b),
  checkinHabit:  (id) => request('PUT',  `/habits/${id}/checkin`),
  deleteHabit:   (id) => request('DELETE',`/habits/${id}`),

  // Routine
  getRoutine:    (date) => request('GET',  '/routine' + (date ? `?date=${date}` : '')),
  addBlock:      (body) => request('POST', '/routine',           body),
  updateBlock:   (id,b) => request('PUT',  `/routine/${id}`,     b),
  deleteBlock:   (id)   => request('DELETE',`/routine/${id}`),

  // Analytics
  getSummary:    ()     => request('GET', '/analytics/summary'),
  getWeekly:     ()     => request('GET', '/analytics/weekly'),
  getCategories: ()     => request('GET', '/analytics/categories'),
};

window.api = api;
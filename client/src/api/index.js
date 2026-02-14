const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.errors?.[0]?.msg || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Stats
  getStats: () => request('/stats'),

  // Contacts
  getContacts: (search) => request(`/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getContact: (id) => request(`/contacts/${id}`),
  createContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  reorderTasks: (items) => request('/tasks/reorder', { method: 'PUT', body: JSON.stringify({ items }) }),

  // Reminders
  getReminders: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return request(`/reminders${qs ? `?${qs}` : ''}`);
  },
  getReminder: (id) => request(`/reminders/${id}`),
  createReminder: (data) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
};

import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  setup: (data: any) => api.post('/auth/setup', data),
  me: () => api.get('/auth/me'),
};

// ── WhatsApp ──────────────────────────────────────────────────────────────
export const whatsappApi = {
  getStatus: () => api.get('/whatsapp/status'),
  getQR: () => api.get('/whatsapp/qr'),
  restart: () => api.post('/whatsapp/restart'),
  logout: () => api.post('/whatsapp/logout'),
};

// ── Chat ──────────────────────────────────────────────────────────────────
export const chatApi = {
  getContacts: () => api.get('/chat/contacts'),
  getMessages: (contactId: string, page = 1) =>
    api.get(`/chat/${contactId}/messages?page=${page}`),
  sendMessage: (contactId: string, body: string) =>
    api.post(`/chat/${contactId}/send`, { body }),
  markRead: (contactId: string) => api.post(`/chat/${contactId}/read`),
};

// ── Memory ────────────────────────────────────────────────────────────────
export const memoryApi = {
  getAll: () => api.get('/memory'),
  get: (contactId: string) => api.get(`/memory/${contactId}`),
  update: (contactId: string, data: any) =>
    api.put(`/memory/${contactId}`, data),
  delete: (contactId: string) => api.delete(`/memory/${contactId}`),
};

// ── Personality ───────────────────────────────────────────────────────────
export const personalityApi = {
  getAll: () => api.get('/personality'),
  create: (data: any) => api.post('/personality', data),
  update: (id: string, data: any) => api.put(`/personality/${id}`, data),
  delete: (id: string) => api.delete(`/personality/${id}`),
  setDefault: (id: string) => api.post(`/personality/${id}/default`),
  seedDefaults: () => api.post('/personality/seed'),
};

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getDailyStats: () => api.get('/analytics/daily'),
  getMoodStats: () => api.get('/analytics/moods'),
  getTopContacts: () => api.get('/analytics/top-contacts'),
};

// ── Settings ──────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};

export default api;

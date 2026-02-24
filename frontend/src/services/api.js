import axios from 'axios';

// Base API instance — le proxy Vite redirige /api vers le backend FastAPI
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur : ajoute automatiquement le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : gestion globale des erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide — on nettoie la session
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Ne redirige pas automatiquement, laisse les composants gérer
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password }),
};

// ─── Users ───────────────────────────────────────────────────
export const usersAPI = {
  getMe: () =>
    api.get('/users/me'),

  listAll: () =>
    api.get('/users/'),

  updateRole: (userId, roleName) =>
    api.put(`/users/${userId}/role`, { role_name: roleName }),

  deleteUser: (userId) =>
    api.delete(`/users/${userId}`),
};

// ─── Events ──────────────────────────────────────────────────
export const eventsAPI = {
  getAll: () =>
    api.get('/events/'),

  getById: (id) =>
    api.get(`/events/${id}`),
};

export default api;

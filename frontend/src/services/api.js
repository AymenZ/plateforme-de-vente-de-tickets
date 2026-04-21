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

  getAdminAll: () =>
    api.get('/events/admin/all'),

  toggleAdminStatus: (id) =>
    api.patch(`/events/admin/${id}/toggle-status`),

  getById: (id) =>
    api.get(`/events/${id}`),

  getMyEvents: () =>
    api.get('/events/my'),

  getOrganizerStats: () =>
    api.get('/events/my/stats'),

  create: (eventData) =>
    api.post('/events/', eventData),

  update: (id, eventData) =>
    api.put(`/events/${id}`, eventData),

  delete: (id) =>
    api.delete(`/events/${id}`),
};

// ─── Ticket Types ───────────────────────────────────────────
export const ticketTypesAPI = {
  listByEvent: (eventId) =>
    api.get(`/events/${eventId}/tickets/`),

  create: (eventId, payload) =>
    api.post(`/events/${eventId}/tickets/`, payload),

  update: (eventId, ticketId, payload) =>
    api.put(`/events/${eventId}/tickets/${ticketId}`, payload),

  delete: (eventId, ticketId) =>
    api.delete(`/events/${eventId}/tickets/${ticketId}`),
};

// ─── Comments ───────────────────────────────────────────────
export const commentsAPI = {
  listByEvent: (eventId, params = {}) =>
    api.get(`/events/${eventId}/comments`, { params }),

  listAllForAdmin: (params = {}) =>
    api.get('/comments/admin/all', { params }),

  create: (eventId, payload) =>
    api.post(`/events/${eventId}/comments`, payload),

  listMine: (params = {}) =>
    api.get('/users/me/comments', { params }),

  update: (commentId, payload) =>
    api.put(`/comments/${commentId}`, payload),

  delete: (commentId) =>
    api.delete(`/comments/${commentId}`),
};

// ─── Orders / Cart ──────────────────────────────────────────
export const ordersAPI = {
  getCart: () =>
    api.get('/orders/cart'),

  addCartItem: (ticketTypeId, quantity) =>
    api.post('/orders/cart/items', { ticket_type_id: ticketTypeId, quantity }),

  updateCartItem: (itemId, quantity) =>
    api.put(`/orders/cart/items/${itemId}`, { quantity }),

  deleteCartItem: (itemId) =>
    api.delete(`/orders/cart/items/${itemId}`),

  createCheckoutSession: (payload = {}) =>
    api.post('/orders/cart/checkout-session', payload),

  checkoutCart: () =>
    api.post('/orders/cart/checkout'),

  getMyOrders: () =>
    api.get('/orders/my'),

  getOrderById: (id) =>
    api.get(`/orders/${id}`),
};

// ─── Payments ───────────────────────────────────────────────
export const paymentsAPI = {
  syncCheckoutSession: (sessionId) =>
    api.post('/payments/checkout-session/sync', { session_id: sessionId }),
};

// ─── Purchased Tickets ─────────────────────────────────────
export const ticketsAPI = {
  getMy: () =>
    api.get('/tickets/my'),

  getById: (ticketId) =>
    api.get(`/tickets/${ticketId}`),

  getByOrder: (orderId) =>
    api.get(`/tickets/order/${orderId}`),

  verify: (ticketCode) =>
    api.get(`/tickets/verify/${ticketCode}`),
};

export default api;

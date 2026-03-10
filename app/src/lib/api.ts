import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Wishlists
export const wishlists = {
  create: (data: { title: string; description?: string; occasion?: string; is_public?: boolean }) =>
    api.post('/wishlists', data),
  getAll: () => api.get('/wishlists'),
  get: (id: string) => api.get(`/wishlists/${id}`),
  delete: (id: string) => api.delete(`/wishlists/${id}`),
};

// Items
export const items = {
  create: (data: {
    wishlist_id: string;
    title: string;
    description?: string;
    url?: string;
    price?: number;
    image_url?: string;
    is_group_gift?: boolean;
    target_amount?: number;
  }) => api.post('/items', data),
  getByWishlist: (wishlistId: string) => api.get(`/wishlists/${wishlistId}/items`),
  delete: (id: string) => api.delete(`/items/${id}`),
};

// Public
export const publicApi = {
  getWishlist: (slug: string) => api.get(`/public/wishlists/${slug}`),
};

// Reservations
export const reservations = {
  create: (data: { item_id: string; anonymous_name?: string }) =>
    api.post('/reservations', data),
  cancel: (itemId: string) => api.delete(`/reservations/${itemId}`),
};

// Contributions
export const contributions = {
  create: (data: { item_id: string; amount: number; anonymous_name?: string }) =>
    api.post('/contributions', data),
};

// URL Parser
export const urlParser = {
  parse: (url: string) => api.post('/parse-url', { url }),
};

export default api;

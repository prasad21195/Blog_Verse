import axios from 'axios';

// One centralized Axios instance for the whole app. Every request goes
// through here so we never repeat "attach the token" logic in components.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor: reads the JWT from localStorage and attaches it
// as a Bearer token on every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the token is invalid/expired, the backend
// returns 401 -- we clear local auth state so the UI reflects "logged out".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('bv_token');
      localStorage.removeItem('bv_user');
    }
    return Promise.reject(error);
  }
);

export default api;

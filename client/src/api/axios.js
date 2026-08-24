import axios from 'axios';

// Create a base axios instance that automatically adds the API URL
// and attaches the JWT token to every request
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor — runs before EVERY request
// Automatically attaches the JWT token from localStorage to the Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — runs after EVERY response
// If the server returns 401 (Unauthorized), clear localStorage and redirect to login
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

export default api;

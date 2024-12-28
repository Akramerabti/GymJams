// lib/axios.js
import axios from 'axios';
import { storage } from '../utils/helpers';

// Create axios instance with custom config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = storage.get('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add shop-specific headers
    config.headers['X-App-Version'] = import.meta.env.VITE_APP_VERSION;
    config.headers['X-Platform'] = 'web';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.get('refresh-token');
        const response = await api.post('/auth/refresh', { refreshToken });
        const { token } = response.data;

        storage.set('auth-token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure
        storage.remove('auth-token');
        storage.remove('refresh-token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other common errors
    if (error.response?.status === 404) {
      // Handle 404 errors
      console.error('Resource not found:', error.config.url);
    }

    if (error.response?.status === 403) {
      // Handle forbidden errors
      console.error('Access forbidden:', error.config.url);
    }

    if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
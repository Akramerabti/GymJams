import axios from 'axios';
import { toast } from 'sonner'; // Assuming you're using Sonner for toasts

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials
});

// Add request interceptor to include the token in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get the token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', config.url); // Debugging: Log the request URL
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log the error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
      return Promise.reject({
        ...error,
        message: 'Too many requests. Please try again later.',
      });
    }

    // Handle unauthorized access (401 Unauthorized)
    if (error.response?.status === 401) {
      console.error('Unauthorized access.');
      localStorage.removeItem('token'); // Clear the invalid token
      toast.error('Your session has expired. Please log in again.');
      return Promise.reject(error);
    }

    // Handle network errors (e.g., CORS issues)
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.');
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.',
      });
    }

    // Handle other errors
    toast.error(error.response?.data?.message || 'An unexpected error occurred.');
    return Promise.reject(error);
  }
);

export default api;
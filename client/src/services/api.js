import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable CORS credentials
});

// Add request interceptor to include the token in every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // Get the token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request:', config.url); // Debugging: Log the request URL
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  response => {
    if (response.config.url === '/auth/login' && response.status === 200) {
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('token', token);
      }
    }
    return response;
  },
  error => {
    // Handle request timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timed out. Please check your connection and try again.',
        statusCode: 408
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        statusCode: 0
      });
    }

    // Handle server errors
    const errorResponse = {
      message: error.response?.data?.message || 'An unexpected error occurred',
      statusCode: error.response?.status,
      data: error.response?.data
    };

    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    return Promise.reject(errorResponse);
  }
);

export default api;
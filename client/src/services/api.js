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

// Add response interceptor to handle successful registration
api.interceptors.response.use(
  (response) => {
    // Check if this is a successful registration response
    if (response.config.url === '/auth/register' && response.status === 201) {
      console.log('Registration successful, redirecting...');
      localStorage.setItem('verificationEmail', response.data.user.email);
      window.location.href = '/email-verification-notification';
    }
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
      console.error('Unauthorized access, redirecting to login...');
      localStorage.removeItem('token'); // Clear the invalid token
      window.location.href = '/login'; // Redirect to login page
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

const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the request should be retried
    if (
      error.code === 'ERR_NETWORK' || // Network error
      error.response?.status >= 500 || // Server error
      error.response?.status === 429 // Rate limiting
    ) {
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`);

        // Wait for a delay before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, originalRequest._retryCount * 1000)
        );

        return api(originalRequest); // Retry the request
      }
    }

    return Promise.reject(error);
  }
);

export default api;
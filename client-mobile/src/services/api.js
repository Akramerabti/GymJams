// client/src/services/api.js
import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://gymtonic.onrender.com/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Keep track of the refresh token request to avoid multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers = [];

// Function to add callbacks to the queue
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to execute all callbacks with the new token
const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Add request interceptor to include auth token and guest token in every request
api.interceptors.request.use(
  (config) => {
    // Get regular auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Get guest token and add it as a header if available
    const guestToken = localStorage.getItem('gymbros_guest_token');
    if (guestToken) {
      // Add as header for all requests
      config.headers['x-gymbros-guest-token'] = guestToken;
      
      // Also add to params for all requests
      config.params = config.params || {};
      config.params.guestToken = guestToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Add response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // If response includes a guestToken, save it
    if (response.data && response.data.guestToken) {
      localStorage.setItem('gymbros_guest_token', response.data.guestToken);
      api.defaults.headers.common['x-gymbros-guest-token'] = response.data.guestToken;
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && 
        error.response?.data?.message?.includes('expired') &&
        !originalRequest.url.includes('/auth/refresh-token')) {
      
      if (isRefreshing) {
        // If a refresh is already in progress, wait for the new token
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }

      // Set the retry flag to avoid infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { token } = response.data;
        
        // Update the token in localStorage and in the original request
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Update token for other requests waiting for the refresh
        onRefreshed(token);
        isRefreshing = false;
        
        // Retry the original request with the new token
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        isRefreshing = false;
        
        // Don't clear guest token - only clear auth token
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        
        // Check if a guest token exists to avoid showing login toast for guest users
        const guestToken = localStorage.getItem('gymbros_guest_token');
        if (!guestToken) {
          toast.error('Your session has expired. Please log in again.');
        }
        
        // Instead of redirecting, we'll let the app handle this
        return Promise.reject(refreshError);
      }
    }
    
    // Special handling for 401s on endpoints that support guest tokens
    if (error.response?.status === 401 && 
        (originalRequest.url.includes('/gym-bros/') || 
         originalRequest.url.includes('/profile'))) {
      
      // Check if we have a guest token
      const guestToken = localStorage.getItem('gymbros_guest_token');
      
      // If this was a request without a guest token but we have one stored, retry with it
      if (guestToken && (!originalRequest.headers['x-gymbros-guest-token'] || 
                         !originalRequest.params?.guestToken)) {
        
        // Add the guest token to the request
        originalRequest.headers['x-gymbros-guest-token'] = guestToken;
        originalRequest.params = originalRequest.params || {};
        originalRequest.params.guestToken = guestToken;
        
        // Retry the request with the guest token
        return axios(originalRequest);
      }
    }

    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
      return Promise.reject({
        ...error,
        message: 'Too many requests. Please try again later.',
      });
    }
    
    // Handle network errors (e.g., CORS issues)
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.');
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
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

// Add response interceptor to handle successful registration
api.interceptors.response.use(
  response => {
    // Check if this is a successful registration response
    if (response.config.url === '/auth/register' && response.status === 201) {
      console.log('Registration successful, redirecting...');
      localStorage.setItem('verificationEmail', response.data.user.email);
      window.location.href = '/email-verification-notification';
    }
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Request:', request.url);
  return request;
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
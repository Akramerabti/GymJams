// lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Hardcode for development
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add debugging interceptors
api.interceptors.request.use(request => {
  console.log('Request:', request.url);
  return request;
});

api.interceptors.response.use(
  response => response,
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
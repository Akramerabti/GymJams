// lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(request => {
  console.log('Request:', request.baseURL + request.url);
  return request;
});

export default api;
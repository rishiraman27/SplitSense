import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Intercept every request before it leaves the frontend
API.interceptors.request.use((config) => {
  // Get the current state from our Zustand store
  const state = useAuthStore.getState();
  const token = state.user?.token;
  
  // If we have a token, attach it to the Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
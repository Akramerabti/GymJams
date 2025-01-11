import React, { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';
import api from '../services/api';
import { usePoints } from './usePoints';

// Create the auth store
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      setUser: (user) => set({ user: { ...user } }), // Ensure a new object is created
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set({ user: null, token: null, error: null }),
    }),
    {
      name: 'auth-storage', // Name for persisted storage
    }
  )
);

export const useAuth = () => {
  const store = useAuthStore();

  // Login function
  const login = async (email, password) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await authService.login(email, password);

      // Check if the user's email is verified
      if (!response.user.isEmailVerified) {
        throw new Error('Please verify your email before logging in.');
      }

      localStorage.setItem('token', response.token);

      store.setUser(response.user);
      store.setToken(response.token);

      // Update points balance
      usePoints.getState().setBalance(response.user.points || 0);

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      store.reset();
      localStorage.removeItem('token'); // Clear the token from localStorage
      console.log('Logged out and cleared token');
    }
  };

  // Check authentication function
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('Checking auth, token:', token);

    if (!token) {
      console.log('No token found, resetting store');
      store.reset();
      return false;
    }

    store.setLoading(true);
    store.setError(null);

    try {
      console.log('Validating token with server...');
      const user = await authService.validateToken(token);
      console.log('Token validation successful, user:', user);
      store.setUser(user);
      store.setToken(token);
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      store.reset();
      localStorage.removeItem('token');
      return false;
    } finally {
      store.setLoading(false);
    }
  }, [store.token]);

  // Register function
  const register = async (userData) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await authService.register(userData);
      if (!response.success) {
        throw new Error('Registration failed');
      }
      return response;
    } catch (error) {
      // Extract the most useful error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Registration failed';

      store.setError(errorMessage);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const validatePhone = async (phone) => {
    try {
      return await authService.validatePhone(phone);
    } catch (error) {
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      console.log('Updated User:', updatedUser); // Debugging
  
      // Update the user object in the store
      store.setUser({ ...store.user, ...updatedUser });
  
      return updatedUser;
    } catch (error) {
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return {
    user: store.user,
    token: store.token,
    loading: store.loading,
    error: store.error,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    verifyEmail,
    validatePhone,
  };
};
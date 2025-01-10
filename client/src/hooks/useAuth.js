import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';
import api from '../services/api';
import { usePoints } from './usePoints';

// Constants
const VALIDATION_INTERVAL = 60000;

// Create the auth store
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      isValidating: false, // Add isValidating state
      lastValidation: 0, // Add lastValidation state
      setUser: (user) => set({ user: { ...user } }), // Ensure a new object is created
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setIsValidating: (isValidating) => set({ isValidating }), // Add setIsValidating
      setLastValidation: (lastValidation) => set({ lastValidation }), // Add setLastValidation
      reset: () => set({ user: null, token: null, error: null, isValidating: false, lastValidation: 0 }),
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
    }
  };

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

  const checkAuth = async () => {
    if (!store.token) {
      store.setLoading(false);
      return false;
    }

    const now = Date.now();
    if (store.isValidating || (now - store.lastValidation < VALIDATION_INTERVAL)) {
      return !!store.user;
    }

    store.setIsValidating(true);
    store.setLoading(true);
    store.setError(null);

    try {
      const user = await authService.validateToken(store.token);
      store.setUser(user);
      store.setLastValidation(now);
      return true;
    } catch (error) {
      store.reset();
      store.setError(error.message);
      return false;
    } finally {
      store.setIsValidating(false);
      store.setLoading(false);
    }
  };

  // Verify email function
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
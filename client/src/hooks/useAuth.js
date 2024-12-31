import React, { useCallback } from 'react'; // Add useCallback to the import
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set({ user: null, token: null, error: null }),
    }),
    {
      name: 'auth-storage',
    },
    {
      verifyEmail: async (token) => {
        try {
          console.log('Verifying email with token:', token);  // Add logging
          const response = await api.get(`/auth/verify-email/${token}`);
          console.log('Email verification response:', response.data);  // Log response
          return response.data;
        } catch (error) {
          console.error('Email verification error:', error);  // Log error
          throw error;
        }
      },
    }
  )
);

export const useAuth = () => {
  const store = useAuthStore();

  const login = async (email, password) => {
    console.log('Logging in with email:', email);  // Log email before the request
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await authService.login(email, password);
      console.log('Login successful:', response);  // Log response after successful login

      // Check if the user's email is verified
      if (!response.user.isEmailVerified) {
        throw new Error('Please verify your email before logging in.');
      }
      
      store.setUser(response.user);
      store.setToken(response.token);
      return response;
    } catch (error) {
      console.error('Login failed:', error);  // Log error if login fails
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const register = async (userData) => {
    console.log('Registering user:', userData);  // Log user data before registering
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await authService.register(userData);
      console.log('Registration successful:', response);  // Log registration response
      return response;
    } catch (error) {
      console.error('Registration failed:', error);  // Log error if registration fails
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const logout = async () => {
    console.log('Logging out');  // Log when logging out
    try {
      await authService.logout();
    } finally {
      store.reset();
      console.log('Logged out and state reset');  // Log after reset
    }
  };

  const updateProfile = async (profileData) => {
    console.log('Updating profile with data:', profileData);  // Log profile update
    store.setLoading(true);
    store.setError(null);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      console.log('Profile updated successfully:', updatedUser);  // Log updated user info
      store.setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);  // Log error if update fails
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const checkAuth = useCallback(async () => {
  if (!store.token) return false;
  try {
    const user = await authService.validateToken(store.token);
    store.setUser(user);
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    store.reset();
    return false;
  }
}, [store]);

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
    verifyEmail: store.verifyEmail,
  };
};

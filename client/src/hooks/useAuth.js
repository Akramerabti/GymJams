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
    {verifyEmail: async (token) => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  })
);

export const useAuth = () => {
  const store = useAuthStore();

  const login = async (email, password) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await authService.login(email, password);
      store.setUser(response.user);
      store.setToken(response.token);
      return response;
    } catch (error) {
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const register = async (userData) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      store.reset();
    }
  };

  const updateProfile = async (profileData) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      store.setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      store.setError(error.message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const checkAuth = async () => {
    if (!store.token) return false;
    try {
      const user = await authService.validateToken(store.token);
      store.setUser(user);
      return true;
    } catch (error) {
      store.reset();
      return false;
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
    verifyEmail: store.verifyEmail,
  };
};

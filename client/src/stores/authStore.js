// stores/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/axios';

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Action Creators
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        if (token) {
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ token, isAuthenticated: true });
        } else {
          delete api.defaults.headers.common['Authorization'];
          set({ token: null, isAuthenticated: false });
        }
      },
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Authentication Actions
      login: async (email, password) => {
        const { setLoading, setError, setUser, setToken } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;
          
          setToken(token);
          setUser(user);
          
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      register: async (userData) => {
        const { setLoading, setError } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.post('/auth/register', userData);
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      logout: () => {
        const { setUser, setToken } = get();
        setUser(null);
        setToken(null);
        // Clean up any other auth-related state
        localStorage.removeItem('cart');
      },

      checkAuth: async () => {
        const { token, setUser, logout } = get();
        if (!token) return false;

        try {
          // Verify token expiration
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
            return false;
          }

          // Validate token with backend
          const response = await api.get('/auth/validate');
          setUser(response.data);
          return true;
        } catch (error) {
          logout();
          return false;
        }
      },

      updateProfile: async (profileData) => {
        const { setLoading, setError, setUser } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.put('/auth/profile', profileData);
          setUser(response.data);
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Profile update failed';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (email) => {
        const { setLoading, setError } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.post('/auth/reset-password', { email });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Password reset failed';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Utility methods
      isTokenValid: () => {
        const { token } = get();
        if (!token) return false;

        try {
          const decoded = jwtDecode(token);
          return decoded.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      },

      // Reset store to initial state
      reset: () => set(initialState)
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
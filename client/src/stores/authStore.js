import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { usePoints } from '../hooks/usePoints'; // Import the usePoints hook

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Action Creators
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });

        // Update points balance when user is set
        if (user?.points !== undefined) {
          usePoints.getState().setBalance(user.points);
        }
      },
      setToken: (token) => {
        if (token) {
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

          // Set user and token in the store
          setToken(token);
          setUser(user);

          // Update points balance
          if (user.points !== undefined) {
            usePoints.getState().setBalance(user.points);
          }

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

      verifyEmail: async (token) => {
        const { setLoading, setError, setUser, setToken } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.get(`/auth/verify-email/${token}`);
          const { user, token: authToken } = response.data;

          // Set user and token in the store
          setToken(authToken);
          setUser(user);

          // Update points balance
          if (user.points !== undefined) {
            usePoints.getState().setBalance(user.points);
          }

          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Email verification failed';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      resendVerificationEmail: async (email) => {
        const { setLoading, setError } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.post('/auth/resend-verification-email', { email });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to resend verification email';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      logout: async () => {
        const { setLoading, setError, reset } = get();
        setLoading(true);

        try {
          // Call the logout endpoint
          await api.post('/auth/logout');

          // Clear auth token from axios headers
          delete api.defaults.headers.common['Authorization'];

          // Clear local storage items
          localStorage.removeItem('token');
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('persist:auth-storage');

          // Reset store state
          reset();

          // Reset points balance
          usePoints.getState().setBalance(0);

          // Optional: Clear other stores
          if (window.resetStores) {
            window.resetStores();
          }
        } catch (error) {
          setError('Logout failed');
          console.error('Logout error:', error);
        } finally {
          setLoading(false);
        }
      },

      clearCart: () => {
        localStorage.removeItem('cart');
      },

      checkAuth: async () => {
        const { token, setUser, logout } = get();
        if (!token) return false;

        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
            return false;
          }

          const response = await api.get('/auth/validate');
          setUser(response.data);

          // Update points balance
          if (response.data.points !== undefined) {
            usePoints.getState().setBalance(response.data.points);
          }

          return true;
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
          return false;
        }
      },

      updateProfile: async (profileData) => {
        const { token, setLoading, setError, setUser } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.put(
            '/auth/profile',
            profileData,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          // Update user in the store
          setUser(response.data);

          // Update points balance
          if (response.data.points !== undefined) {
            usePoints.getState().setBalance(response.data.points);
          }

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

      getUser: async () => {
        const { setLoading, setError, setUser } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.get('/auth/user');
          setUser(response.data);

          // Update points balance
          if (response.data.points !== undefined) {
            usePoints.getState().setBalance(response.data.points);
          }

          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to fetch user data';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      refreshToken: async () => {
        const { setLoading, setError, setToken } = get();
        setLoading(true);
        setError(null);

        try {
          const response = await api.post('/auth/refresh-token');
          const { token } = response.data;
          setToken(token);
          return token;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to refresh token';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

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

      reset: () => {
        set(initialState);
        usePoints.getState().setBalance(0); // Reset points balance on logout
      },

      validatePhone: async (phone) => {
        const { user } = get();
        try {
          const response = await api.post('/auth/validate-phone', {
            phone,
            userId: user.id
          });
          return response.data.isValid;
        } catch (error) {
          throw error;
        }
      },

      registerResetCallback: (callback) => {
        if (!window.resetStores) {
          window.resetStores = [];
        }
        window.resetStores.push(callback);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export the hook with the same interface as useAuth
export const useAuth = () => {
  const store = useAuthStore();

  return {
    user: store.user,
    token: store.token,
    loading: store.loading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateProfile: store.updateProfile,
    checkAuth: store.checkAuth,
    verifyEmail: store.verifyEmail,
    validatePhone: store.validatePhone,
  };
};
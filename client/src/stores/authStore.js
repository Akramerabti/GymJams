import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { usePoints } from '../hooks/usePoints';

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

      // Token Validation
      isTokenValid: () => {
        const token = get().token;
        if (!token) return false;

        try {
          const decoded = jwtDecode(token);
          return decoded.exp * 1000 > Date.now(); // Check if token is expired
        } catch {
          return false;
        }
      },

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

      checkAuth: async () => {
        const { token, setUser, logout, isTokenValid } = get();
        if (!token || !isTokenValid()) {
          logout();
          return false;
        }

        try {
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
    isTokenValid: store.isTokenValid, // Add isTokenValid to useAuth
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
  };
};

export default useAuthStore;
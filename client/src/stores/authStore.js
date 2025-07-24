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
  showOnboarding: false,
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Existing methods...
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });

        // Update points balance when user is set
        if (user?.points !== undefined) {
          usePoints.getState().setBalance(user.points);
        }
      },

      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token); // Ensure token is saved to localStorage
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ token, isAuthenticated: true });
        } else {
          localStorage.removeItem('token'); // Ensure token is removed on logout
          delete api.defaults.headers.common['Authorization'];
          set({ token: null, isAuthenticated: false });
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      showOnboarding: false,
      setShowOnboarding: (show) => set({ showOnboarding: show }),

      // Reset function
      reset: () => {
        set(initialState); // Reset to initial state
        delete api.defaults.headers.common['Authorization']; // Clear auth token from axios headers
      },

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

      // Validate phone
      validatePhone: async (phone) => {
        const { user } = get();
        //('Validating phone:', phone); // Log the phone number
        try {
          const response = await api.post('/auth/validate-phone', {
            phone: phone,
            userId: user.id
          });
          return response.data.isValid;
        } catch (error) {
          console.error('Error validating phone:', error); // Log any errors
          throw error;
        }
      },

      // Update profile
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

      // Register
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

      // Verify email
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

      // Resend verification email
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

      // Login with email and password
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
          //('has received login bonus', user.hasReceivedFirstLoginBonus)
          if (!(user.hasReceivedFirstLoginBonus)) {
            set({ showOnboarding: true }); 
            usePoints.getState().updatePointsInBackend((user.points)+100);
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

      loginWithToken: async (token) => {
        const { setLoading, setError, setUser, setToken } = get();
        setLoading(true);
        setError(null);
    
        try {
          // Store the token
          setToken(token);
          
          // Fetch user data using the token
          const response = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const user = response.data;
          
          // Set user in the store
          setUser(user);
          
          // Update points balance
          if (user.points !== undefined) {
            usePoints.getState().setBalance(user.points);
          }
          
          // Check first login bonus
          if (!user.hasReceivedFirstLoginBonus) {
            set({ showOnboarding: true });
            usePoints.getState().updatePointsInBackend((user.points)+100);
          }
          
          return { token, user };
        } catch (error) {
          const message = error.response?.data?.message || 'Token login failed';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // Logout
      logout: async () => {
        const { setLoading, setError, reset } = get();
        setLoading(true);
      
        try {
          // Attempt to call the logout endpoint (only if the token is valid)
          if (get().isTokenValid()) {
            await api.post('/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear auth token from axios headers
          delete api.defaults.headers.common['Authorization'];
      
          // Clear ALL relevant storage items
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken'); // Add this line
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('persist:auth-storage');
          sessionStorage.removeItem('accessToken'); // Add this line if using sessionStorage
      
          // Reset store state
          reset();
      
          // Reset points balance
          usePoints.getState().setBalance(0);
      
          // Optional: Clear other stores
          if (window.resetStores) {
            window.resetStores();
          }
      
          setLoading(false);
      
          // Refresh the page to ensure clean state
          window.location.href = window.location.origin;
        }
      },

      // Check authentication
      checkAuth: async () => {
        const { token, setUser, isTokenValid } = get();

        // If no token or token is invalid, logout immediately
        if (!token || !isTokenValid()) {
          return false;
        }

        try {
          const response = await api.get('/auth/validate');
          const user = response.data;
          setUser(response.data);

          // Update points balance
          if (response.data.points !== undefined) {
            usePoints.getState().setBalance(response.data.points);
          }
          if (!(user.user.hasReceivedFirstLoginBonus)) {
            set({ showOnboarding: true }); 
            usePoints.getState().updatePointsInBackend((user.user.points)+100);
          }

          return true;
        } catch (error) {
          console.error('Token validation failed:', error);
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
        showOnboarding: state.showOnboarding, 
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
    isTokenValid: store.isTokenValid, 
    login: store.login,
    loginWithToken: store.loginWithToken, 
    logout: store.logout,
    checkAuth: store.checkAuth,
    validatePhone: store.validatePhone,
    updateProfile: store.updateProfile,
    register: store.register,
    verifyEmail: store.verifyEmail,
    resendVerificationEmail: store.resendVerificationEmail,
    registerResetCallback: store.registerResetCallback,
    showOnboarding: store.showOnboarding,
    setShowOnboarding: store.setShowOnboarding,
  };
};

export default useAuthStore;
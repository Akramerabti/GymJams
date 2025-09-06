import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { usePoints } from '../hooks/usePoints';
import locationService from '../services/location.service';

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
        try {
          const response = await api.post('/auth/validate-phone', {
            phone: phone,
            userId: user.id
          });
          return response.data.isValid;
        } catch (error) {
          console.error('Error validating phone:', error);
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

      // Login with email and password - REMOVED AUTOMATIC LOCATION SYNC
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
          if (!(user.hasReceivedFirstLoginBonus)) {
            set({ showOnboarding: true }); 
            usePoints.getState().updatePointsInBackend((user.points)+100);
          }

          // REMOVED: await get().syncLocationOnLogin(user);
          // Location sync now handled by PermissionsContext
      
          return response.data;
        } catch (error) {
  const message = error.response?.data?.message || 'Login failed';
  
  // Check if this is an OAuth user trying to login with password
  if (error.response?.data?.isOAuthUser) {
    // Throw enhanced error for MobileGatekeeper to catch
    throw {
      ...error,
      isOAuthUser: true,
      email: email,
      redirectToPasswordSetup: true
    };
  }
  
  setError(message);
  throw error;
} finally {
          setLoading(false);
        }
      },

      // Login with token - REMOVED AUTOMATIC LOCATION SYNC
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

          // REMOVED: await get().syncLocationOnLogin(user);
          // Location sync now handled by PermissionsContext
          
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
          localStorage.removeItem('accessToken');
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('persist:auth-storage');
          localStorage.removeItem('hasCompletedOnboarding');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('mobileGatekeeperOpen');
      
          // Reset store state
          reset();
      
          // Reset points balance
          usePoints.getState().setBalance(0);
      
          // Optional: Clear other stores
          if (window.resetStores) {
            window.resetStores();
          }
      
          setLoading(false);
      
          // Dispatch logout event for mobile gatekeeper
          window.dispatchEvent(new Event('user-logout'));
      
          // For mobile users, don't redirect - let the mobile gatekeeper modal handle it
          // For desktop users, redirect to home
          const isMobile = window.innerWidth <= 768;
          if (!isMobile) {
            window.location.href = window.location.origin;
          }
          // Mobile users will see the gatekeeper modal automatically due to our state logic
        }
      },

      // Check authentication - REMOVED AUTOMATIC LOCATION SYNC
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
          
          // Handle first login bonus properly
          if (user && !(user.hasReceivedFirstLoginBonus)) {
            set({ showOnboarding: true }); 
            usePoints.getState().updatePointsInBackend((user.points || 0) + 100);
          }

          // REMOVED: await get().syncLocationOnLogin(user.user);
          // Location sync now handled by PermissionsContext

          return true;
        } catch (error) {
          console.error('Token validation failed:', error);
          return false;
        }
      },

      // UPDATED: Only sync existing location data between localStorage and backend
      // NO automatic geolocation requests
      syncLocationOnLogin: async (user) => {
        try {
          // Helper function to check if location data is complete
          const hasCompleteLocationData = (location) => {
            return location && location.lat && location.lng && location.city;
          };
          
          // Get location from localStorage
          const localLocation = localStorage.getItem('userLocation');
          const parsedLocalLocation = localLocation ? JSON.parse(localLocation) : null;
          
          // Only sync existing data - NO automatic geolocation requests
          if (hasCompleteLocationData(parsedLocalLocation) && !hasCompleteLocationData(user.location)) {
            // Case 1: Upload localStorage location to backend
            try {
              const response = await api.put('/user/location', parsedLocalLocation);
              if (response.status === 200) {
                const updatedUser = {
                  ...user,
                  location: parsedLocalLocation,
                  hasCompleteLocation: true,
                  needsLocationUpdate: false
                };
                get().setUser(updatedUser);
              }
            } catch (error) {
              console.warn('Failed to upload location to backend:', error);
            }
          } else if (hasCompleteLocationData(user.location) && !hasCompleteLocationData(parsedLocalLocation)) {
            // Case 2: Download backend location to localStorage
            try {
              const locationData = {
                lat: user.location.lat,
                lng: user.location.lng,
                city: user.location.city,
                address: user.location.address || '',
                source: 'backend',
                timestamp: user.location.updatedAt || new Date().toISOString()
              };
              
              localStorage.setItem('userLocation', JSON.stringify(locationData));
              
              const updatedUser = {
                ...user,
                hasCompleteLocation: true,
                needsLocationUpdate: false
              };
              get().setUser(updatedUser);
            } catch (error) {
              console.warn('Failed to save location to localStorage:', error);
            }
          } else if (hasCompleteLocationData(parsedLocalLocation) && hasCompleteLocationData(user.location)) {
            // Case 3: Both exist - use the more recent one
            try {
              const localTime = new Date(parsedLocalLocation.timestamp || 0);
              const backendTime = new Date(user.location.updatedAt || 0);
              
              if (backendTime > localTime) {
                // Backend is more recent - update localStorage
                const locationData = {
                  lat: user.location.lat,
                  lng: user.location.lng,
                  city: user.location.city,
                  address: user.location.address || '',
                  source: 'backend',
                  timestamp: user.location.updatedAt
                };
                localStorage.setItem('userLocation', JSON.stringify(locationData));
              }
              
              const updatedUser = {
                ...user,
                hasCompleteLocation: true,
                needsLocationUpdate: false
              };
              get().setUser(updatedUser);
            } catch (error) {
              console.warn('Failed to sync location data:', error);
            }
          }
          
        } catch (error) {
          console.error('❌ AuthStore: Error syncing location on login:', error);
          // Don't throw error to avoid breaking login flow
        }
      },

      // REMOVED: refreshUserLocation method entirely - it was causing geolocation violations

      // Keep helper method for reverse geocoding (used by PermissionsContext if needed)
      reverseGeocode: async (lat, lng) => {
        return await locationService.reverseGeocode(lat, lng);
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
    isAuthenticated: store.isAuthenticated,
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
    showOnboarding: store.showOnboarding,
    setShowOnboarding: store.setShowOnboarding,
    setUser: store.setUser,
    setToken: store.setToken,
    syncLocationOnLogin: store.syncLocationOnLogin,
    reverseGeocode: store.reverseGeocode,
    setToken: store.setToken,
    setUser: store.setUser,
  };
};

export default useAuthStore;
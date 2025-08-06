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

          // Sync location data after successful login
          await get().syncLocationOnLogin(user);
      
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

          // Sync location data after successful token login
          await get().syncLocationOnLogin(user);
          
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

          // Sync location data on auth check
          await get().syncLocationOnLogin(user.user);

          return true;
        } catch (error) {
          console.error('Token validation failed:', error);
          return false;
        }
      },

      // New method to sync location data on login
      syncLocationOnLogin: async (user) => {
        try {
          console.log('🔄 AuthStore: Starting location sync on login for user:', user.id);
          
          // Helper function to check if location data is complete
          const hasCompleteLocationData = (location) => {
            return location && location.lat && location.lng && location.city;
          };
          
          // Get location from localStorage
          const localLocation = localStorage.getItem('userLocation');
          const parsedLocalLocation = localLocation ? JSON.parse(localLocation) : null;
          
          console.log('📍 AuthStore: Local location:', parsedLocalLocation);
          console.log('🏠 AuthStore: Backend location:', user.location);
          
          // Check if user has given location permission before
          const hasLocationPermission = parsedLocalLocation || hasCompleteLocationData(user.location);
          
          if (hasLocationPermission) {
            // User has provided location before - fetch fresh location
            console.log('🔄 AuthStore: User has location permission, fetching fresh location...');
            await get().refreshUserLocation(user);
          } else {
            // Handle first-time location sync scenarios:
            // 1. User has location in localStorage but not in backend -> Upload to backend
            // 2. User has location in backend but not in localStorage -> Download to localStorage  
            // 3. User has different locations -> Use the more recent one
            // 4. User has no location anywhere -> Do nothing (LocationBanner will handle)
            
            if (hasCompleteLocationData(parsedLocalLocation) && !hasCompleteLocationData(user.location)) {
              // Case 1: Upload localStorage location to backend
              console.log('⬆️ AuthStore: Uploading localStorage location to backend');
              
              const response = await api.put('/user/location', parsedLocalLocation);
              if (response.status === 200) {
                console.log('✅ AuthStore: Successfully synced localStorage location to backend');
                
                // Update user in store
                const updatedUser = {
                  ...user,
                  location: parsedLocalLocation,
                  hasCompleteLocation: true,
                  needsLocationUpdate: false
                };
                get().setUser(updatedUser);
              }
            } else if (hasCompleteLocationData(user.location) && !hasCompleteLocationData(parsedLocalLocation)) {
              // Case 2: Download backend location to localStorage
              console.log('⬇️ AuthStore: Downloading backend location to localStorage');
              
              const locationData = {
                lat: user.location.lat,
                lng: user.location.lng,
                city: user.location.city,
                address: user.location.address || '',
                source: 'backend'
              };
              
              localStorage.setItem('userLocation', JSON.stringify(locationData));
              console.log('✅ AuthStore: Successfully synced backend location to localStorage');
              
              // Update user flags since they now have complete location
              const updatedUser = {
                ...user,
                hasCompleteLocation: true,
                needsLocationUpdate: false
              };
              get().setUser(updatedUser);
            } else if (hasCompleteLocationData(parsedLocalLocation) && hasCompleteLocationData(user.location)) {
              // Case 3: Both exist - compare timestamps or coordinates
              const localTime = new Date(parsedLocalLocation.timestamp || 0);
              const backendTime = new Date(user.location.updatedAt || 0);
              
              console.log('🔄 AuthStore: Both locations exist, comparing timestamps:', {
                local: localTime,
                backend: backendTime
              });
              
              // If backend is more recent, update localStorage
              if (backendTime > localTime) {
                console.log('⬇️ AuthStore: Backend location is newer, updating localStorage');
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
              
              // Both locations exist, so user has complete location
              const updatedUser = {
                ...user,
                hasCompleteLocation: true,
                needsLocationUpdate: false
              };
              get().setUser(updatedUser);
            }
          }
          
          console.log('✅ AuthStore: Location sync completed');
        } catch (error) {
          console.error('❌ AuthStore: Error syncing location on login:', error);
          // Don't throw error to avoid breaking login flow
        }
      },

      // New method to refresh user location on login/reload
      refreshUserLocation: async (user) => {
        try {
          console.log('🔄 AuthStore: Refreshing user location...');
          
          // Check if geolocation is available
          if (!navigator.geolocation) {
            console.log('❌ AuthStore: Geolocation not supported');
            return;
          }
          
          // Get fresh GPS coordinates
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0 // Don't use cached position
              }
            );
          });
          
          const { latitude, longitude } = position.coords;
          console.log('📍 AuthStore: Fresh GPS coordinates:', { lat: latitude, lng: longitude });
          
          // Reverse geocode to get current city
          const cityName = await get().reverseGeocode(latitude, longitude);
          console.log('🏙️ AuthStore: Current city:', cityName);
          
          const freshLocationData = {
            lat: latitude,
            lng: longitude,
            city: cityName,
            address: '',
            source: 'fresh-gps',
            timestamp: new Date().toISOString()
          };
          
          // Update localStorage
          localStorage.setItem('userLocation', JSON.stringify(freshLocationData));
          
          // Update backend if user is logged in
          if (user?.id) {
            console.log('⬆️ AuthStore: Uploading fresh location to backend...');
            const response = await api.put('/user/location', freshLocationData);
            
            if (response.status === 200) {
              console.log('✅ AuthStore: Fresh location updated successfully');
              
              // Update user in store
              const updatedUser = {
                ...user,
                location: freshLocationData,
                hasCompleteLocation: true,
                needsLocationUpdate: false
              };
              get().setUser(updatedUser);
            }
          }
          
        } catch (error) {
          console.log('⚠️ AuthStore: Could not refresh location (user may have denied permission):', error.message);
          // Don't throw error - user might have revoked location permission
        }
      },

      // Helper method for reverse geocoding
      reverseGeocode: async (lat, lng) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            return data.city || data.locality || data.principalSubdivision || 'Unknown City';
          }
          
          return 'Unknown City';
        } catch (error) {
          console.error('❌ AuthStore: Reverse geocoding error:', error);
          return 'Unknown City';
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
    syncLocationOnLogin: store.syncLocationOnLogin,
    refreshUserLocation: store.refreshUserLocation,
    reverseGeocode: store.reverseGeocode,
  };
};

export default useAuthStore;
import locationService from './location.service.js';
import api from './api.js';

class GymBrosLocationService {
  
  /**
   * Check if we should skip location step during setup
   * @param {Object} user - Current user data
   * @param {string} phone - Phone number for guest users
   * @returns {Object} Location check result
   */
  async shouldSkipLocationStep(user = null, phone = null) {
    try {
      console.log('🔍 Starting location check for setup step...');
      
      // 1. Check localStorage first (fastest and most recent)
      const localLocation = this.getStoredLocation();
      console.log('📱 localStorage location:', localLocation);
      
      // 2. Check backend for existing locations
      let serverLocation = null;
      try {
        const response = await api.post('/gym-bros-location/check', {
          user: user,
          phone: phone
        });
        
        if (response.data.hasLocation) {
          serverLocation = response.data.locationData;
          console.log('🗄️ Server location:', serverLocation);
        }
      } catch (error) {
        console.warn('Failed to check backend location:', error);
      }

      // 3. Check authenticated user's location
      let userProfileLocation = null;
      if (user && user.location && this.isLocationComplete(user.location)) {
        userProfileLocation = user.location;
        console.log('👤 User profile location:', userProfileLocation);
      }

      // 4. Determine the best location and sync if needed
      let bestLocation = null;
      let locationSource = null;
      let needsServerUpdate = false;

      if (localLocation && this.isLocationComplete(localLocation)) {
        bestLocation = localLocation;
        locationSource = 'localStorage';
        
        // Check if localStorage is different/newer than server
        if (serverLocation) {
          const isDifferent = 
            Math.abs(localLocation.lat - (serverLocation.lat || 0)) > 0.001 ||
            Math.abs(localLocation.lng - (serverLocation.lng || 0)) > 0.001 ||
            localLocation.city !== serverLocation.city;
            
          const localTimestamp = new Date(localLocation.timestamp || 0);
          const serverTimestamp = new Date(serverLocation.updatedAt || 0);
          const isNewer = localTimestamp > serverTimestamp;
          
          if (isDifferent || isNewer) {
            console.log('� localStorage location is different/newer, will sync to server');
            needsServerUpdate = true;
          }
        } else {
          // No server location, definitely need to sync
          needsServerUpdate = true;
        }
      } else if (userProfileLocation) {
        bestLocation = userProfileLocation;
        locationSource = 'user_profile';
        // Store in localStorage for faster access
        this.storeLocation(userProfileLocation);
      } else if (serverLocation) {
        bestLocation = serverLocation;
        locationSource = 'server';
        // Store in localStorage for faster access
        this.storeLocation(serverLocation);
      }

      // 5. If we have a good location, sync to server if needed
      if (bestLocation) {
        if (needsServerUpdate) {
          console.log('🔄 Syncing localStorage location to server...');
          try {
            const normalizedLocation = this.normalizeLocationData(bestLocation);
            await this.updateLocation(normalizedLocation, user, phone);
            console.log('✅ Location synced to server successfully');
          } catch (error) {
            console.warn('⚠️ Failed to sync location to server:', error);
          }
        }
        
        return {
          skipStep: true,
          locationData: bestLocation,
          source: locationSource,
          message: `Using ${locationSource} location`
        };
      }

      // 6. No good location found, try IP geolocation as fallback
      console.log('🌐 No stored location found, trying IP geolocation...');
      try {
        const freshLocation = await locationService.getLocationByIP();
        if (freshLocation && this.isLocationComplete(freshLocation)) {
          console.log('📍 Got fresh IP-based location:', freshLocation);
          this.storeLocation(freshLocation);
          
          // Save to server as well
          try {
            const normalizedLocation = this.normalizeLocationData(freshLocation);
            await this.updateLocation(normalizedLocation, user, phone);
            console.log('✅ IP location saved to server');
          } catch (error) {
            console.warn('⚠️ Failed to save IP location to server:', error);
          }
          
          return {
            skipStep: true,
            locationData: freshLocation,
            source: 'ip_geolocation',
            message: 'Using IP-based location'
          };
        }
      } catch (error) {
        console.warn('Failed to get IP location:', error);
      }

      // 7. No location found anywhere - setup required
      console.log('❌ No location found, setup required');
      return {
        skipStep: false,
        locationData: null,
        source: null,
        message: 'Location setup required'
      };

    } catch (error) {
      console.error('Error checking location for setup:', error);
      return {
        skipStep: false,
        locationData: null,
        source: null,
        message: 'Error checking location'
      };
    }
  }

  /**
   * Update location across all systems (localStorage, backend, user profile)
   * @param {Object} locationData - Location data to update
   * @param {Object} user - Current user (optional)
   * @param {string} phone - Phone for guest users
   * @returns {Object} Update result
   */
  async updateLocation(locationData, user = null, phone = null) {
    try {
      console.log('📍 UPDATE LOCATION DEBUG: Starting update...');
      console.log('📍 UPDATE LOCATION DEBUG: locationData:', locationData);
      console.log('📍 UPDATE LOCATION DEBUG: user:', user);
      console.log('📍 UPDATE LOCATION DEBUG: phone:', phone);
      
      // 1. Normalize and validate location data
      const normalizedLocation = this.normalizeLocationData(locationData);
      console.log('📍 UPDATE LOCATION DEBUG: Normalized location:', normalizedLocation);
      
      // 2. Store in localStorage immediately
      this.storeLocation(normalizedLocation);
      console.log('📍 UPDATE LOCATION DEBUG: Stored in localStorage');

      // 3. Update backend (GymBros profile and User model if authenticated)
      console.log('📍 UPDATE LOCATION DEBUG: Sending to backend...');
      const response = await api.post('/gym-bros-location/update', {
        locationData: normalizedLocation,
        user: user,
        phone: phone
      });

      console.log('📍 UPDATE LOCATION DEBUG: Backend response:', response.data);
      console.log('📍 UPDATE LOCATION DEBUG: Backend response full:', response);

      if (response.data.success) {
        console.log('📍 UPDATE LOCATION DEBUG: Backend update successful');
        console.log('📍 UPDATE LOCATION DEBUG: Updates made:', response.data.updates);
        
        // 4. If user is authenticated, also update auth store
        if (user && typeof window !== 'undefined') {
          try {
            console.log('📍 UPDATE LOCATION DEBUG: Updating auth store...');
            const { default: useAuthStore } = await import('../stores/authStore.js');
            const authState = useAuthStore.getState();
            console.log('📍 UPDATE LOCATION DEBUG: Current auth store user:', authState.user);
            
            if (authState.user) {
              const updatedUser = {
                ...authState.user,
                location: {
                  lat: normalizedLocation.lat,
                  lng: normalizedLocation.lng,
                  city: normalizedLocation.city,
                  address: normalizedLocation.address,
                  state: normalizedLocation.state,
                  country: normalizedLocation.country,
                  isVisible: true,
                  updatedAt: new Date().toISOString()
                }
              };
              console.log('📍 UPDATE LOCATION DEBUG: Setting updated user:', updatedUser);
              useAuthStore.getState().setUser(updatedUser);
              console.log('📍 UPDATE LOCATION DEBUG: Auth store updated successfully');
            }
          } catch (error) {
            console.error('📍 UPDATE LOCATION ERROR: Failed to update auth store:', error);
          }
        }

        return {
          success: true,
          updates: response.data.updates || [],
          nearbyGyms: response.data.nearbyGyms || [],
          message: response.data.message || 'Location updated successfully'
        };
      }

      throw new Error(response.data.message || 'Failed to update backend location');

    } catch (error) {
      console.error('📍 UPDATE LOCATION ERROR: Error updating location:', error);
      throw error;
    }
  }

  /**
   * Get location recommendations (gyms, groups, etc.)
   * @param {Object} locationData - Current location
   * @returns {Object} Recommendations
   */
  async getLocationRecommendations(locationData) {
    try {
      if (!locationData || !locationData.lat || !locationData.lng) {
        return {
          nearbyGyms: [],
          locationGroups: [],
          gymGroups: []
        };
      }

      const response = await api.get('/gym-bros/location-recommendations', {
        params: {
          lat: locationData.lat,
          lng: locationData.lng
        }
      });

      return response.data;

    } catch (error) {
      console.error('Error getting location recommendations:', error);
      return {
        nearbyGyms: [],
        locationGroups: [],
        gymGroups: []
      };
    }
  }

  /**
   * Search for gyms near a location
   * @param {Object} locationData - Location to search near
   * @param {string} query - Search query (optional)
   * @param {number} radiusMiles - Search radius
   * @returns {Array} Nearby gyms
   */
  async searchNearbyGyms(locationData, query = '', radiusMiles = 25) {
    try {
      const response = await api.get('/gym-bros/gyms/search', {
        params: {
          lat: locationData.lat,
          lng: locationData.lng,
          query: query,
          radius: radiusMiles
        }
      });

      return response.data.gyms || [];

    } catch (error) {
      console.error('Error searching nearby gyms:', error);
      return [];
    }
  }

  /**
   * Create a new gym
   * @param {Object} gymData - Gym information
   * @returns {Object} Created gym
   */
  async createGym(gymData) {
    try {
      const response = await api.post('/gym-bros/gyms', gymData);
      return response.data;
    } catch (error) {
      console.error('Error creating gym:', error);
      throw error;
    }
  }

  /**
   * Associate user with a gym
   * @param {string} gymId - Gym ID
   * @param {boolean} isPrimary - Set as primary gym
   * @param {string} membershipType - Membership type
   * @returns {Object} Association result
   */
  async associateWithGym(gymId, isPrimary = false, membershipType = 'member') {
    try {
      const response = await api.post('/gym-bros/gyms/associate', {
        gymId: gymId,
        isPrimary: isPrimary,
        membershipType: membershipType
      });

      return response.data;
    } catch (error) {
      console.error('Error associating with gym:', error);
      throw error;
    }
  }

  /**
   * Check if location data is complete
   * @param {Object} locationData - Location to check
   * @returns {boolean} Whether location is complete
   */
  isLocationComplete(locationData) {
    return !!(
      locationData &&
      locationData.lat &&
      locationData.lng &&
      locationData.city
    );
  }

  /**
   * Normalize location data to match server schema requirements
   * @param {Object} locationData - Raw location data
   * @returns {Object} Normalized location data
   */
  normalizeLocationData(locationData) {
    if (!locationData) return null;

    // Map source to valid enum values
    let source = 'manual'; // default
    if (locationData.source) {
      const sourceMap = {
        'gps': 'gps',
        'ip': 'ip-geolocation', 
        'ip-geolocation': 'ip-geolocation',
        'manual': 'manual',
        'imported': 'imported',
        'auto-refresh': 'ip-geolocation', // Map auto-refresh to ip-geolocation
        'fresh-gps-guest': 'gps', // Map guest GPS to gps
        'fresh-gps': 'gps',
        'user_input': 'manual'
      };
      source = sourceMap[locationData.source] || 'manual';
    }

    // Smart country detection based on city and coordinates
    let country = locationData.country || 'US'; // default fallback
    
    // Detect Canada based on city names or coordinates
    if (locationData.city) {
      const city = locationData.city.toLowerCase();
      const canadianCities = ['montreal', 'toronto', 'vancouver', 'calgary', 'ottawa', 'edmonton', 'winnipeg', 'quebec', 'hamilton', 'vaudreuil'];
      if (canadianCities.some(canadianCity => city.includes(canadianCity))) {
        country = 'CA';
      }
    }
    
    // Detect Canada based on coordinates (rough boundaries)
    if (locationData.lat && locationData.lng) {
      const lat = parseFloat(locationData.lat);
      const lng = parseFloat(locationData.lng);
      
      // Canada coordinate boundaries (approximate)
      if (lat >= 41.0 && lat <= 83.0 && lng >= -141.0 && lng <= -52.0) {
        country = 'CA';
      }
    }

    // Check if address contains Canada
    if (locationData.address && locationData.address.toLowerCase().includes('canada')) {
      country = 'CA';
    }

    // Determine accuracy based on source and data quality
    let accuracy = locationData.accuracy;
    if (!accuracy) {
      if (source === 'gps' && locationData.lat && locationData.lng) {
        // GPS coordinates are highly accurate
        accuracy = 'high';
      } else if (source === 'ip-geolocation') {
        // IP geolocation is less accurate
        accuracy = 'low';
      } else {
        // Manual or other sources default to medium
        accuracy = 'medium';
      }
    }

    // Ensure required fields are present
    const normalized = {
      lat: parseFloat(locationData.lat) || 0,
      lng: parseFloat(locationData.lng) || 0,
      city: locationData.city || locationData.address || 'Unknown City',
      address: locationData.address || locationData.city || 'Unknown Address',
      state: locationData.state || locationData.region || '',
      country: country,
      zipCode: locationData.zipCode || locationData.postal || '',
      source: source,
      accuracy: accuracy,
      timestamp: locationData.timestamp || new Date().toISOString()
    };

    // Make sure city and address are not empty
    if (!normalized.city || normalized.city === 'Unknown City') {
      normalized.city = normalized.address || 'Unknown City';
    }
    if (!normalized.address || normalized.address === 'Unknown Address') {
      normalized.address = normalized.city || 'Unknown Address';
    }

    console.log('🔧 NORMALIZE: Original:', locationData);
    console.log('🔧 NORMALIZE: Normalized:', normalized);
    console.log('🔧 NORMALIZE: Country detected as:', country, '(from city/coords/address)');

    return normalized;
  }

  /**
   * Store location in localStorage
   * @param {Object} locationData - Location to store
   */
  storeLocation(locationData) {
    try {
      const locationToStore = {
        ...locationData,
        timestamp: new Date().toISOString()
      };
      
      // Ensure we have the minimum required fields for localStorage
      if (!locationToStore.city && locationToStore.address) {
        locationToStore.city = locationToStore.address;
      }
      if (!locationToStore.address && locationToStore.city) {
        locationToStore.address = locationToStore.city;
      }
      
      localStorage.setItem('userLocation', JSON.stringify(locationToStore));
      localStorage.setItem('gymBrosLocation', JSON.stringify(locationToStore));
      console.log('💾 STORE: Saved location to localStorage:', locationToStore);
    } catch (error) {
      console.error('Failed to store location:', error);
    }
  }

  /**
   * Get stored location from localStorage
   * @returns {Object|null} Stored location or null
   */
  getStoredLocation() {
    try {
      // Try GymBros-specific location first
      const gymBrosLocation = localStorage.getItem('gymBrosLocation');
      if (gymBrosLocation) {
        const parsed = JSON.parse(gymBrosLocation);
        if (this.isLocationFresh(parsed)) {
          return parsed;
        }
      }

      // Fall back to general user location
      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const parsed = JSON.parse(userLocation);
        if (this.isLocationFresh(parsed)) {
          return parsed;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get stored location:', error);
      return null;
    }
  }

  /**
   * Check if location is still fresh (not too old)
   * @param {Object} locationData - Location to check
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {boolean} Whether location is fresh
   */
  isLocationFresh(locationData, maxAgeHours = 24) {
    if (!locationData || !locationData.timestamp) return false;
    
    const locationTime = new Date(locationData.timestamp).getTime();
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    return (now - locationTime) < maxAgeMs;
  }

  /**
   * Get the best available location using smart fallbacks
   * @param {Object} user - Current user
   * @param {string} phone - Phone for guest users
   * @returns {Object} Best available location
   */
  async getBestLocation(user = null, phone = null) {
    try {
      // 1. Check stored location first
      const stored = this.getStoredLocation();
      if (stored && this.isLocationFresh(stored)) {
        return stored;
      }

      // 2. Try smart location check
      const smartResult = await this.shouldSkipLocationStep(user, phone);
      if (smartResult.skipStep && smartResult.locationData) {
        return smartResult.locationData;
      }

      // 3. Try to get fresh location using IP
      const ipLocation = await locationService.getLocationByIP();
      if (ipLocation) {
        this.storeLocation(ipLocation);
        return ipLocation;
      }

      // 4. Return default fallback
      return {
        lat: 40.7128, // NYC
        lng: -74.0060,
        city: 'New York',
        address: 'New York, NY',
        source: 'default'
      };

    } catch (error) {
      console.error('Error getting best location:', error);
      return null;
    }
  }

  /**
   * Start automatic location syncing like Snapchat
   * This runs in the background and keeps location updated
   * @param {Object} user - Current user
   * @param {string} phone - Phone for guest users
   */
  startAutoLocationSync(user = null, phone = null) {
    // Clear any existing interval
    if (this.locationSyncInterval) {
      clearInterval(this.locationSyncInterval);
    }

    console.log('🔄 AUTO-SYNC: Starting automatic location sync like Snapchat...');
    console.log('🔄 AUTO-SYNC: User:', user);
    console.log('🔄 AUTO-SYNC: Phone:', phone);

    // Initial sync (run immediately)
    console.log('🔄 AUTO-SYNC: Running initial sync...');
    this.syncLocationIfNeeded(user, phone);

    // Set up periodic sync every 5 minutes (like Snapchat)
    this.locationSyncInterval = setInterval(() => {
      console.log('🔄 AUTO-SYNC: Running periodic sync (5min interval)...');
      this.syncLocationIfNeeded(user, phone);
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('🔄 AUTO-SYNC: Interval set up successfully, will sync every 5 minutes');
  }

  /**
   * Stop automatic location syncing
   */
  stopAutoLocationSync() {
    if (this.locationSyncInterval) {
      clearInterval(this.locationSyncInterval);
      this.locationSyncInterval = null;
      console.log('🛑 Stopped automatic location sync');
    }
  }

  /**
   * Sync location if needed (silent background sync like Snapchat)
   * @param {Object} user - Current user
   * @param {string} phone - Phone for guest users
   */
  async syncLocationIfNeeded(user = null, phone = null) {
    try {
      console.log('🔍 AUTO-SYNC DEBUG: Starting syncLocationIfNeeded...');
      console.log('🔍 AUTO-SYNC DEBUG: User:', user);
      console.log('🔍 AUTO-SYNC DEBUG: Phone:', phone);
      
      // Get current localStorage location
      const localLocation = this.getStoredLocation();
      console.log('🔍 AUTO-SYNC DEBUG: localStorage location:', localLocation);
      
      if (!localLocation || !this.isLocationComplete(localLocation)) {
        console.log('🔍 AUTO-SYNC DEBUG: No valid localStorage location, trying IP...');
        // Try to get fresh location silently
        try {
          const freshLocation = await locationService.getLocationByIP();
          if (freshLocation && this.isLocationComplete(freshLocation)) {
            console.log('🔄 Auto-sync: Got fresh IP location, updating...', freshLocation);
            // Normalize before updating
            const normalizedFreshLocation = this.normalizeLocationData(freshLocation);
            await this.updateLocation(normalizedFreshLocation, user, phone);
          }
        } catch (error) {
          console.warn('Auto-sync: Failed to get fresh location:', error);
        }
        return;
      }

      console.log('🔍 AUTO-SYNC DEBUG: Valid localStorage found, checking server...');

      // Check if we need to sync with server
      try {
        const serverCheck = await api.post('/gym-bros-location/check', {
          user: user,
          phone: phone
        });

        console.log('🔍 AUTO-SYNC DEBUG: Server check response:', serverCheck.data);

        let needsSync = false;

        if (serverCheck.data.hasLocation) {
          const serverLocation = serverCheck.data.locationData;
          console.log('🔍 AUTO-SYNC DEBUG: Server location:', serverLocation);
          
          // Check if localStorage location is different or newer
          const latDiff = Math.abs(localLocation.lat - (serverLocation.lat || 0));
          const lngDiff = Math.abs(localLocation.lng - (serverLocation.lng || 0));
          const cityDiff = localLocation.city !== serverLocation.city;
          
          console.log('🔍 AUTO-SYNC DEBUG: Lat diff:', latDiff);
          console.log('🔍 AUTO-SYNC DEBUG: Lng diff:', lngDiff);
          console.log('🔍 AUTO-SYNC DEBUG: City diff:', cityDiff, `"${localLocation.city}" vs "${serverLocation.city}"`);
          
          const isDifferent = latDiff > 0.001 || lngDiff > 0.001 || cityDiff;
            
          const localTimestamp = new Date(localLocation.timestamp || 0);
          const serverTimestamp = new Date(serverLocation.updatedAt || 0);
          const isNewer = localTimestamp > serverTimestamp;
          
          console.log('🔍 AUTO-SYNC DEBUG: isDifferent:', isDifferent);
          console.log('🔍 AUTO-SYNC DEBUG: Local timestamp:', localTimestamp);
          console.log('🔍 AUTO-SYNC DEBUG: Server timestamp:', serverTimestamp);
          console.log('🔍 AUTO-SYNC DEBUG: isNewer:', isNewer);
          
          needsSync = isDifferent || isNewer;
        } else {
          console.log('🔍 AUTO-SYNC DEBUG: No server location found, definitely need sync');
          // No server location, definitely sync
          needsSync = true;
        }

        console.log('🔍 AUTO-SYNC DEBUG: needsSync:', needsSync);

        if (needsSync) {
          console.log('🔄 AUTO-SYNC: localStorage newer/different, FORCING sync to server...');
          console.log('🔄 AUTO-SYNC: Syncing location data:', localLocation);
          
          // Normalize the location data before syncing
          const normalizedLocation = this.normalizeLocationData(localLocation);
          console.log('🔄 AUTO-SYNC: Normalized location for sync:', normalizedLocation);
          
          const syncResult = await this.updateLocation(normalizedLocation, user, phone);
          console.log('✅ AUTO-SYNC: Location synced successfully:', syncResult);
          
          // FORCE UPDATE: Also manually trigger a profile refresh
          if (user && typeof window !== 'undefined') {
            try {
              console.log('🔄 AUTO-SYNC: Force updating auth store with new location...');
              const { default: useAuthStore } = await import('../stores/authStore.js');
              
              // Access the store directly (not as a hook)
              const authState = useAuthStore.getState();
              if (authState.user) {
                const updatedUser = {
                  ...authState.user,
                  location: {
                    lat: normalizedLocation.lat,
                    lng: normalizedLocation.lng,
                    city: normalizedLocation.city,
                    address: normalizedLocation.address || '',
                    state: normalizedLocation.state || '',
                    country: normalizedLocation.country || '',
                    isVisible: true,
                    updatedAt: new Date().toISOString()
                  }
                };
                console.log('🔄 AUTO-SYNC: Setting updated user in auth store:', updatedUser);
                
                // Call the setUser action
                useAuthStore.getState().setUser(updatedUser);
              }
            } catch (error) {
              console.error('AUTO-SYNC: Failed to update auth store:', error);
            }
          }
          
        } else {
          console.log('🔍 AUTO-SYNC DEBUG: No sync needed, locations match');
        }

      } catch (error) {
        console.error('🔍 AUTO-SYNC ERROR: Failed to check/sync location:', error);
      }

    } catch (error) {
      console.error('🔍 AUTO-SYNC ERROR: Error in syncLocationIfNeeded:', error);
    }
  }

  /**
   * FORCE SYNC NOW - Manual trigger for debugging
   * Call this from console: window.gymBrosLocationService.forceSyncNow()
   */
  async forceSyncNow() {
    try {
      console.log('🚀 FORCE SYNC: Starting manual sync...');
      
      // Get current user from auth store
      if (typeof window !== 'undefined') {
        const { default: useAuthStore } = await import('../stores/authStore.js');
        const authState = useAuthStore.getState();
        const user = authState.user;
        
        console.log('🚀 FORCE SYNC: Current user:', user);
        
        const localLocation = this.getStoredLocation();
        console.log('🚀 FORCE SYNC: localStorage location:', localLocation);
        
        if (localLocation && this.isLocationComplete(localLocation)) {
          console.log('🚀 FORCE SYNC: Forcing update with localStorage location...');
          const normalizedLocation = this.normalizeLocationData(localLocation);
          console.log('🚀 FORCE SYNC: Normalized location:', normalizedLocation);
          const result = await this.updateLocation(normalizedLocation, user, user?.phone);
          console.log('🚀 FORCE SYNC: Update result:', result);
          return { success: true, result };
        } else {
          console.log('🚀 FORCE SYNC: No valid localStorage location found');
          return { success: false, error: 'No valid localStorage location' };
        }
      }
    } catch (error) {
      console.error('🚀 FORCE SYNC ERROR:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * TEST LOCATION UPDATE - for debugging
   * Call this from console: window.gymBrosLocationService.testLocationUpdate()
   */
  async testLocationUpdate() {
    try {
      console.log('🧪 TEST: Starting location update test...');
      
      // Get current user and phone from store or localStorage
      let user = null;
      let phone = null;
      
      if (typeof window !== 'undefined') {
        const { default: useAuthStore } = await import('../stores/authStore.js');
        const authState = useAuthStore.getState();
        user = authState.user;
        
        // Try to get phone from guest token if no user
        if (!user) {
          const guestToken = localStorage.getItem('guestToken');
          if (guestToken) {
            try {
              const decoded = JSON.parse(atob(guestToken.split('.')[1]));
              phone = decoded.phone;
            } catch (e) {
              console.warn('Failed to decode guest token:', e);
            }
          }
        }
      }
      
      console.log('🧪 TEST: User:', user);
      console.log('🧪 TEST: Phone:', phone);
      
      // Create test Montreal location
      const testLocation = {
        lat: 45.5052989,
        lng: -73.6266889,
        city: 'Montreal',
        address: 'Montreal, QC, Canada',
        state: 'QC',
        country: 'CA',
        source: 'manual',
        timestamp: new Date().toISOString()
      };
      
      console.log('🧪 TEST: Test location:', testLocation);
      
      const result = await this.updateLocation(testLocation, user, phone);
      console.log('🧪 TEST: Update result:', result);
      
      return { success: true, result };
      
    } catch (error) {
      console.error('🧪 TEST ERROR:', error);
      return { success: false, error: error.message };
    }
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.gymBrosLocationService = new GymBrosLocationService();
}

export default new GymBrosLocationService();

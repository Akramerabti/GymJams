import api from './api';
import { toast } from 'sonner';

const convertAccuracyToEnum = (numericAccuracy) => {
  if (typeof numericAccuracy !== 'number' || isNaN(numericAccuracy)) {
    return 'medium';
  }
  
  if (numericAccuracy < 10) return 'high';
  if (numericAccuracy < 100) return 'medium';
  if (numericAccuracy < 500) return 'low';
  return 'approximate';
};

class GymBrosLocationService {
  constructor() {
    this.lastLocationUpdate = null;
    this.locationCache = new Map();
    this.watchId = null;
    this.locationSyncInterval = null;
    this.isAutoSyncActive = false;
    this.pendingLocationRequest = null; // Prevent concurrent requests
    this.lastRequestTime = 0;
    this.minRequestInterval = 10000; // 10 seconds minimum between requests
  }

  // Smart timeout configuration based on device capabilities
  getLocationOptions(priority = 'balanced') {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSlowConnection = navigator.connection && navigator.connection.effectiveType === 'slow-2g';
    
    const configs = {
      // Quick attempt for UI responsiveness
      quick: {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      },
      
      // Balanced for most use cases
      balanced: {
        enableHighAccuracy: true,
        timeout: isMobile ? 12000 : 8000, // Mobile devices need more time
        maximumAge: 120000 // 2 minutes
      },
      
      // High accuracy for critical operations
      precise: {
        enableHighAccuracy: true,
        timeout: isSlowConnection ? 20000 : 15000,
        maximumAge: 60000 // 1 minute
      },
      
      // For background sync (less aggressive)
      background: {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 600000 // 10 minutes
      }
    };
    
    return configs[priority] || configs.balanced;
  }

  // Improved getCurrentLocation with multiple fallback strategies
  async getCurrentLocation(options = {}) {
    const now = Date.now();
    
    // Prevent too frequent requests
    if (now - this.lastRequestTime < this.minRequestInterval && !options.force) {
      const cached = this.getCachedLocation();
      if (cached) {
        console.log('📍 Using cached location (too frequent requests)');
        return cached;
      }
    }

    // Return existing pending request if one is in progress
    if (this.pendingLocationRequest && !options.force) {
      console.log('📍 Using existing location request');
      return this.pendingLocationRequest;
    }

    this.lastRequestTime = now;
    
    // Strategy 1: Try quick GPS first
    this.pendingLocationRequest = this._attemptLocationWithFallbacks(options);
    
    try {
      const result = await this.pendingLocationRequest;
      return result;
    } finally {
      this.pendingLocationRequest = null;
    }
  }

  async _attemptLocationWithFallbacks(options = {}) {
    const strategies = [
      // Strategy 1: Quick attempt
      { name: 'quick', config: this.getLocationOptions('quick') },
      // Strategy 2: Balanced attempt
      { name: 'balanced', config: this.getLocationOptions('balanced') },
      // Strategy 3: High accuracy attempt (last resort)
      { name: 'precise', config: this.getLocationOptions('precise') }
    ];

    let lastError = null;

    for (const strategy of strategies) {
      try {
        console.log(`📍 Trying ${strategy.name} location strategy`);
        const location = await this._getGPSLocation({ ...strategy.config, ...options });
        
        if (location) {
          console.log(`📍 Success with ${strategy.name} strategy`);
          const enhanced = await this.enhanceLocationWithAddress(location);
          this.cacheLocation(enhanced);
          return enhanced;
        }
      } catch (error) {
        console.warn(`📍 ${strategy.name} strategy failed:`, error.message);
        lastError = error;
        
        // If it's a permission error, don't try other strategies
        if (error.code === 1) {
          break;
        }
      }
    }

    // All GPS strategies failed, try fallbacks
    console.log('📍 All GPS strategies failed, trying fallbacks');
    
    // Fallback 1: Use cached location
    const cached = this.getCachedLocation();
    if (cached) {
      console.log('📍 Using cached location as fallback');
      return cached;
    }

    // Fallback 2: Use localStorage
    const stored = this.getStoredLocation();
    if (stored) {
      console.log('📍 Using stored location as fallback');
      return stored;
    }

    // Fallback 3: Try IP-based location
    try {
      const ipLocation = await this.getLocationByIP();
      if (ipLocation) {
        console.log('📍 Using IP-based location as fallback');
        this.cacheLocation(ipLocation);
        return ipLocation;
      }
    } catch (ipError) {
      console.warn('📍 IP location fallback failed:', ipError);
    }

    // All fallbacks failed
    throw lastError || new Error('All location methods failed');
  }

  // Core GPS location function with proper error handling
  _getGPSLocation(options) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out'));
      }, options.timeout + 1000); // Add buffer to browser timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: convertAccuracyToEnum(position.coords.accuracy),
            source: 'gps',
            timestamp: new Date().toISOString(),
            coords: {
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            }
          };
          
          resolve(location);
        },
        (error) => {
          clearTimeout(timeoutId);
          
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          const locationError = new Error(errorMessage);
          locationError.code = error.code;
          reject(locationError);
        },
        options
      );
    });
  }

  // IP-based location fallback
  async getLocationByIP() {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout for IP API
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          return {
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            city: data.city || 'Unknown City',
            address: `${data.city || 'Unknown City'}, ${data.region || ''} ${data.postal || ''}`.trim(),
            source: 'ip-geolocation',
            accuracy: 'low',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      throw new Error('IP geolocation failed');
    } catch (error) {
      throw new Error(`IP location failed: ${error.message}`);
    }
  }

  // Improved location caching
  cacheLocation(location) {
    if (!location || !location.lat || !location.lng) return;
    
    const cacheKey = 'current_location';
    this.locationCache.set(cacheKey, {
      ...location,
      cachedAt: Date.now()
    });
    
    // Also store in localStorage
    try {
      localStorage.setItem('userLocation', JSON.stringify(location));
    } catch (e) {
      console.warn('Failed to store location in localStorage:', e);
    }
  }

  getCachedLocation() {
    const cached = this.locationCache.get('current_location');
    if (cached) {
      const age = Date.now() - cached.cachedAt;
      // Use cached location if less than 5 minutes old
      if (age < 5 * 60 * 1000) {
        return cached;
      }
    }
    return null;
  }

  getStoredLocation() {
    try {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        const location = JSON.parse(stored);
        // Check if not too old (1 hour)
        if (location.timestamp) {
          const age = Date.now() - new Date(location.timestamp).getTime();
          if (age < 60 * 60 * 1000) {
            return location;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to get stored location:', e);
    }
    return null;
  }

  // Get user's best known location with improved fallbacks
  async getBestLocation(user, phone) {
    try {
      // Try cached first
      const cached = this.getCachedLocation();
      if (cached) {
        console.log('📍 Using cached location');
        return cached;
      }

      // Try backend
      const response = await api.post('/gym-bros/check', { user, phone });
      if (response.data && response.data.location) {
        console.log('📍 Got saved location from backend:', response.data.location);
        this.cacheLocation(response.data.location);
        return response.data.location;
      }

      // Fallback to GPS with quick priority
      return await this.getCurrentLocation({ priority: 'quick' });
    } catch (error) {
      console.error('Error getting best location:', error);
      
      // Final fallback to stored location
      const stored = this.getStoredLocation();
      if (stored) {
        return stored;
      }
      
      throw error;
    }
  }

  // Improved auto location sync with better error handling
  startAutoLocationSync(user, phone) {
    console.log('🔄 STARTING AUTO LOCATION SYNC FOR USER:', user, phone);
    
    if (this.isAutoSyncActive) {
      console.log('⚠️ AUTO SYNC ALREADY ACTIVE - STOPPING EXISTING');
      this.stopAutoLocationSync();
    }
    
    this.isAutoSyncActive = true;
    
    // Start with a less aggressive approach
    this.locationSyncInterval = setInterval(() => {
      console.log('⏰ PERIODIC LOCATION SYNC');
      
      // Use background priority for auto-sync
      this.getCurrentLocation({ priority: 'background' })
        .then(location => {
          if (location) {
            this.updateUserLocation(location, user, phone);
          }
        })
        .catch(error => {
          console.error('❌ PERIODIC SYNC ERROR:', error);
          // Don't toast errors for background sync
        });
    }, 10 * 60 * 1000); // Increased to 10 minutes for less aggressive sync
  }

  stopAutoLocationSync() {
    console.log('🛑 STOPPING AUTO LOCATION SYNC');
    
    this.isAutoSyncActive = false;
    
    if (this.locationSyncInterval) {
      clearInterval(this.locationSyncInterval);
      this.locationSyncInterval = null;
    }
  }

  forceSyncNow() {
    console.log('⚡ FORCE SYNC NOW');
    return this.getCurrentLocation({ priority: 'balanced', force: true })
      .then(location => {
        if (location) {
          console.log('📍 FORCE SYNC GOT LOCATION:', location);
          return location;
        }
      })
      .catch(error => {
        console.error('❌ FORCE SYNC ERROR:', error);
        throw error;
      });
  }

  // Watch user's location for real-time updates (IMPROVED)
  watchLocation(callback, options = {}) {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: false, // CHANGED: Less aggressive for watching
      timeout: 20000, // CHANGED: Longer timeout for watching
      maximumAge: 60000, // CHANGED: 1 minute cache for watching
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const basicLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: convertAccuracyToEnum(position.coords.accuracy),
            source: 'gps',
            timestamp: new Date().toISOString()
          };

          // Only call callback if location has changed significantly (>10 meters)
          if (this.hasLocationChangedSignificantly(basicLocation)) {
            console.log('📍 Location changed significantly:', basicLocation);

            // Enhance with city information
            try {
              const enhancedLocation = await this.enhanceLocationWithAddress(basicLocation);
              this.lastLocationUpdate = enhancedLocation;
              callback(enhancedLocation);
            } catch (error) {
              // Fallback to basic location with saved city
              const savedLocation = localStorage.getItem('userLocation');
              let fallbackCity = 'Montreal';

              if (savedLocation) {
                try {
                  const parsed = JSON.parse(savedLocation);
                  if (parsed.city) fallbackCity = parsed.city;
                } catch (e) {}
              }

              const locationWithFallback = {
                ...basicLocation,
                city: fallbackCity,
                address: fallbackCity
              };

              this.lastLocationUpdate = locationWithFallback;
              callback(locationWithFallback);
            }
          }
        } catch (error) {
          console.error('Error processing watch location:', error);
          callback(null, error);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
        callback(null, error);
      },
      defaultOptions
    );

    return this.watchId;
  }

  // Stop watching location
  stopWatchingLocation() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('📍 Stopped watching location');
    }
  }

  // Check if location has changed significantly
  hasLocationChangedSignificantly(newLocation, threshold = 10) {
    if (!this.lastLocationUpdate) return true;

    const distance = this.calculateDistance(
      this.lastLocationUpdate.lat,
      this.lastLocationUpdate.lng,
      newLocation.lat,
      newLocation.lng
    );

    return distance > threshold; // threshold in meters
  }

  // Update user location with real-time support
  async updateUserLocation(locationData, user, phone, profileId) {
    try {
      const response = await api.post('/gym-bros/update', {
        locationData,
        user,
        phone
      });

      return response.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  // Enhanced location with address (with better error handling)
  async enhanceLocationWithAddress(locationData) {
    if (locationData.address && locationData.address.trim() !== '') {
      return locationData;
    }

    try {
      const address = await this.reverseGeocode(locationData.lat, locationData.lng);
      
      return {
        ...locationData,
        address: address.address || 'Unknown location',
        city: address.city || locationData.city || '',
        state: address.state || locationData.state || '',
        country: address.country || locationData.country || '',
        zipCode: address.zipCode || locationData.zipCode || ''
      };
    } catch (error) {
      console.warn('⚠️ Reverse geocoding failed, using fallback:', error);
      
      return {
        ...locationData,
        address: locationData.address || 'Location coordinates',
        city: locationData.city || 'Unknown City'
      };
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GymBros-App/1.0'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      if (data && data.address) {
        return {
          address: data.display_name || 'Unknown location',
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || data.address.province || '',
          country: data.address.country || '',
          zipCode: data.address.postcode || ''
        };
      }

      throw new Error('No address data found');
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  // Calculate distance between two points in meters
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Validate coordinates
  isValidCoordinates(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  // Check existing location (legacy)
  async checkExistingLocation(user, phone) {
    try {
      const response = await api.post('/gym-bros/check', {
        user,
        phone
      });

      return response.data;
    } catch (error) {
      console.error('Error checking existing location:', error);
      throw error;
    }
  }

  // NEW: Check if location permissions are granted
  async checkLocationPermission() {
    if (!navigator.permissions) {
      return 'unsupported';
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.warn('Failed to check location permission:', error);
      return 'unknown';
    }
  }

  // NEW: Clear all location data
  clearLocationCache() {
    this.locationCache.clear();
    this.lastLocationUpdate = null;
    try {
      localStorage.removeItem('userLocation');
    } catch (e) {
      console.warn('Failed to clear stored location:', e);
    }
    console.log('📍 Location cache cleared');
  }

  // Send real-time location update (for live tracking)
  async updateUserLocationRealtime(locationData) {
    try {
      const response = await api.post('/gym-bros/realtime/location', {
        locationData
      });

      return response.data;
    } catch (error) {
      console.error('Error updating real-time location:', error);
      // Don't throw error for real-time updates to avoid disrupting UX
      return { success: false, error: error.message };
    }
  }

  // Get map users with zoom-level awareness
  async getMapUsers(bounds, zoom, maxDistance = 25) {
    try {
      const response = await api.get('/gym-bros/map/users', {
        params: {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
          zoom: zoom,
          maxDistance: maxDistance
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching map users:', error);
      throw error;
    }
  }

  // Get gyms for map with backend-aligned filtering (no bbox/zoom)
  async getGymsForMap(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 1000,
        offset: filters.offset || 0
      };

      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.types && filters.types.length > 0) {
        params.types = filters.types.join(',');
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await api.get('/gym-bros/gyms', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching gyms for map:', error);
      throw error;
    }
  }

  // Get real-time map updates
  async getMapUpdates(bounds, lastUpdate) {
    try {
      const params = {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west
      };

      if (lastUpdate) {
        params.lastUpdate = lastUpdate;
      }

      const response = await api.get('/gym-bros/realtime/updates', { params });

      return response.data;
    } catch (error) {
      console.error('Error fetching map updates:', error);
      throw error;
    }
  }

  // Get clustered data for large zoom-out views
  async getMapClusters(bounds, zoom, clusterSize = 0.01) {
    try {
      const response = await api.get('/gym-bros/map/clusters', {
        params: {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
          zoom: zoom,
          clusterSize: clusterSize
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching map clusters:', error);
      throw error;
    }
  }

  // Search nearby gyms
  async searchNearbyGyms(location, query = '', radius = 100) {
    try {
      const response = await api.get('/gym-bros/gyms/search', {
        params: {
          lat: location.lat,
          lng: location.lng,
          query: query,
          radius: radius
        }
      });

      return response.data.gyms || [];
    } catch (error) {
      console.error('Error searching gyms:', error);
      throw error;
    }
  }



  // Create a new gym
  async createGym(gymData) {
    try {
      const response = await api.post('/gym-bros/gyms', gymData);
      
      if (response.data.success) {
        toast.success(`Gym "${response.data.gym.name}" created successfully!`);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating gym:', error);
      toast.error('Failed to create gym. Please try again.');
      throw error;
    }
  }

  async associateWithGym(gymId, isPrimary = false, membershipType = 'member', options = {}) {
  try {
    const requestData = {
      gymId,
      isPrimary,
      membershipType,
      visitFrequency: options.visitFrequency || 'weekly',
      preferredTimes: options.preferredTimes || [],
      notes: options.notes || ''
    };

    // Add profile/user info if available
    if (options.profileId) {
      requestData.profileId = options.profileId;
    }
    if (options.userId) {
      requestData.userId = options.userId;
    }

    console.log('Sending gym association request:', requestData);

    const response = await api.post('/gym-bros/gyms/associate', requestData);

    if (response.data.success) {
      const gymName = response.data.gym?.name || 'the facility';
      toast.success(`Successfully joined ${gymName}!`);
    }

    return response.data;
  } catch (error) {
    console.error('Error associating with gym:', error);
    const errorMessage = error.response?.data?.message || 'Failed to join facility.';
    toast.error(errorMessage);
    throw error;
  }
}

async associateWithMultipleGyms(gymAssociations) {
  try {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const association of gymAssociations) {
      try {
        const result = await this.associateWithGym(
          association.gymId,
          association.isPrimary,
          association.membershipType,
          association.options
        );
        results.push({ ...association, success: true, result });
        successCount++;
      } catch (error) {
        results.push({ ...association, success: false, error: error.message });
        failCount++;
      }
    }

    // Show summary toast
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully joined ${successCount} facilities!`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Joined ${successCount} facilities, ${failCount} failed.`);
    } else if (failCount > 0) {
      toast.error(`Failed to join ${failCount} facilities.`);
    }

    return {
      success: successCount > 0,
      results,
      successCount,
      failCount
    };
  } catch (error) {
    console.error('Error associating with multiple gyms:', error);
    toast.error('Failed to process gym associations.');
    throw error;
  }
}

  async getUserGyms() {
  try {
    const response = await api.get('/gym-bros/gyms/my-gyms');
    return response.data;
  } catch (error) {
    console.error('Error getting user gyms:', error);
    throw error;
  }
}

async getGymMembers(gymId, options = {}) {
  try {
    const params = {
      limit: options.limit || 50,
      offset: options.offset || 0
    };

    if (options.membershipType) {
      params.membershipType = options.membershipType;
    }

    if (options.status) {
      params.status = options.status;
    }

    const response = await api.get(`/gym-bros/gyms/${gymId}/members`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting gym members:', error);
    throw error;
  }
}

async shouldSkipLocationStep(user, phone) {
  try {
    // Check if user already has location data
    if (user && user.location && user.location.lat && user.location.lng) {
      return {
        skipStep: true,
        source: 'user_profile',
        locationData: user.location
      };
    }

    // Check backend for existing location
    try {
      const response = await this.checkExistingLocation(user, phone);
      if (response && response.location && response.location.lat && response.location.lng) {
        return {
          skipStep: true,
          source: 'backend',
          locationData: response.location
        };
      }
    } catch (backendError) {
      console.warn('Backend location check failed:', backendError);
    }

    // Check localStorage
    const storedLocation = this.getStoredLocation();
    if (storedLocation && storedLocation.lat && storedLocation.lng) {
      return {
        skipStep: true,
        source: 'localStorage',
        locationData: storedLocation
      };
    }

    // Check cache
    const cachedLocation = this.getCachedLocation();
    if (cachedLocation && cachedLocation.lat && cachedLocation.lng) {
      return {
        skipStep: true,
        source: 'cache',
        locationData: cachedLocation
      };
    }

    // No existing location found
    return {
      skipStep: false,
      source: null,
      locationData: null
    };

  } catch (error) {
    console.error('Error checking if should skip location step:', error);
    return {
      skipStep: false,
      source: null,
      locationData: null
    };
  }
}

async recordGymVisit(gymId, visitData = {}) {
  try {
    const response = await api.post(`/gym-bros/gyms/${gymId}/visit`, {
      timestamp: visitData.timestamp || new Date().toISOString(),
      duration: visitData.duration,
      workoutType: visitData.workoutType,
      notes: visitData.notes
    });

    return response.data;
  } catch (error) {
    console.error('Error recording gym visit:', error);
    // Don't show error toast for visit recording as it's not critical
    return { success: false };
  }
}


async checkGymMembership(gymId) {
  try {
    const response = await api.get(`/gym-bros/gyms/${gymId}/membership`);
    return response.data;
  } catch (error) {
    console.error('Error checking gym membership:', error);
    return { isMember: false };
  }
}

  // Get nearby groups
  async getNearbyGroups(location, radius = 25) {
    try {
      const response = await api.get('/gym-bros/groups/nearby', {
        params: {
          lat: location.lat,
          lng: location.lng,
          radius: radius
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting nearby groups:', error);
      throw error;
    }
  }

  async removeGymAssociation(gymId) {
  try {
    const response = await api.delete(`/gym-bros/gyms/associate/${gymId}`);

    if (response.data.success) {
      toast.success('Successfully left the facility!');
    }

    return response.data;
  } catch (error) {
    console.error('Error removing gym association:', error);
    toast.error('Failed to leave facility.');
    throw error;
  }
}

async updateGymAssociation(gymId, updates) {
  try {
    const response = await api.put(`/gym-bros/gyms/associate/${gymId}`, updates);

    if (response.data.success) {
      toast.success('Gym association updated successfully!');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating gym association:', error);
    toast.error('Failed to update gym association.');
    throw error;
  }
}

async setPrimaryGym(gymId, options = {}) {
  try {
    const requestData = { gymId };
    
    if (options.profileId) {
      requestData.profileId = options.profileId;
    }
    if (options.userId) {
      requestData.userId = options.userId;
    }

    const response = await api.put('/gym-bros/gyms/set-primary', requestData);

    if (response.data.success) {
      toast.success('Primary gym updated successfully!');
    }

    return response.data;
  } catch (error) {
    console.error('Error setting primary gym:', error);
    toast.error('Failed to set primary gym.');
    throw error;
  }
}

  // Create location-based group
  async createLocationGroup(groupData) {
    try {
      const response = await api.post('/gym-bros/groups/location', groupData);
      
      if (response.data.success) {
        toast.success(`Group "${response.data.group.name}" created successfully!`);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating location group:', error);
      toast.error('Failed to create group. Please try again.');
      throw error;
    }
  }

  // Get location recommendations
  async getLocationRecommendations(location) {
    try {
      const response = await api.get('/gym-bros/location-recommendations', {
        params: {
          lat: location.lat,
          lng: location.lng
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting location recommendations:', error);
      throw error;
    }
  }

  // Format location for display
  formatLocationForDisplay(location) {
    if (!location) return 'Unknown location';

    const parts = [];
    
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country && location.country !== 'US') parts.push(location.country);

    return parts.length > 0 ? parts.join(', ') : 'Unknown location';
  }

  // Get location accuracy description
  getLocationAccuracyDescription(accuracy) {
    if (!accuracy || typeof accuracy !== 'number') return 'Unknown accuracy';
    
    if (accuracy < 10) return 'Very precise (GPS)';
    if (accuracy < 50) return 'Precise (GPS)';
    if (accuracy < 100) return 'Good accuracy';
    if (accuracy < 500) return 'Approximate';
    return 'Low accuracy';
  }
}

const gymBrosLocationService = new GymBrosLocationService();
export default gymBrosLocationService;
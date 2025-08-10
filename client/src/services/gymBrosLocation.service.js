import api from './api';
import { toast } from 'sonner';

const convertAccuracyToEnum = (numericAccuracy) => {
  if (typeof numericAccuracy !== 'number' || isNaN(numericAccuracy)) {
    return 'medium'; // default
  }
  
  // Convert GPS accuracy (in meters) to enum
  if (numericAccuracy < 10) return 'high';        // Very precise GPS
  if (numericAccuracy < 100) return 'medium';     // Good GPS
  if (numericAccuracy < 500) return 'low';        // Approximate GPS  
  return 'approximate';                           // Poor accuracy
};

class EnhancedGymBrosLocationService {
 constructor() {
  this.lastLocationUpdate = null;
  this.locationCache = new Map();
  this.watchId = null;
  this.locationSyncInterval = null;
  this.isAutoSyncActive = false;
}
  // Get user's best known location with fallbacks
  async getBestLocation(user, phone) {
    try {
      // Try to get saved location from backend first
      const response = await api.post('/gym-bros/check', {
        user,
        phone
      });

      if (response.data && response.data.location) {
        console.log('📍 Got saved location from backend:', response.data.location);
        return response.data.location;
      }

      // Fallback to browser geolocation
      return await this.getCurrentLocation();
    } catch (error) {
      console.error('Error getting best location:', error);
      
      // Final fallback to browser geolocation
      return await this.getCurrentLocation();
    }
  }

  startAutoLocationSync(user, phone) {
  console.log('🔄 STARTING AUTO LOCATION SYNC FOR USER:', user, phone);
  
  if (this.isAutoSyncActive) {
    console.log('⚠️ AUTO SYNC ALREADY ACTIVE - STOPPING EXISTING');
    this.stopAutoLocationSync();
  }
  
  this.isAutoSyncActive = true;
  
  // Start watching location
  this.watchLocation((location, error) => {
    if (error) {
      console.error('❌ AUTO SYNC LOCATION ERROR:', error);
      return;
    }
    
    if (location) {
      console.log('📍 AUTO SYNC GOT NEW LOCATION:', location);
      // Update location automatically
      this.updateUserLocation(location, user, phone);
    }
  });
  
  // Also set up periodic sync every 5 minutes
  this.locationSyncInterval = setInterval(() => {
    console.log('⏰ PERIODIC LOCATION SYNC');
    this.getCurrentLocation()
      .then(location => {
        if (location) {
          this.updateUserLocation(location, user, phone);
        }
      })
      .catch(error => {
        console.error('❌ PERIODIC SYNC ERROR:', error);
      });
  }, 5 * 60 * 1000); // 5 minutes
}

// ADD THIS METHOD
stopAutoLocationSync() {
  console.log('🛑 STOPPING AUTO LOCATION SYNC');
  
  this.isAutoSyncActive = false;
  
  // Stop watching location
  this.stopWatchingLocation();
  
  // Clear interval
  if (this.locationSyncInterval) {
    clearInterval(this.locationSyncInterval);
    this.locationSyncInterval = null;
  }
}

// ADD THIS METHOD
forceSyncNow() {
  console.log('⚡ FORCE SYNC NOW');
  return this.getCurrentLocation()
    .then(location => {
      if (location) {
        console.log('📍 FORCE SYNC GOT LOCATION:', location);
        // You'll need to store user info to sync
        return location;
      }
    })
    .catch(error => {
      console.error('❌ FORCE SYNC ERROR:', error);
      throw error;
    });
}

  // FIXED: Get current location with city information
getCurrentLocation(options = {}) {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // Increased timeout to 15 seconds
    maximumAge: 60000,
    ...options
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const basicLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: convertAccuracyToEnum(position.coords.accuracy),
            source: 'gps',
            timestamp: new Date().toISOString()
          };
          
          console.log('📍 Got basic browser location:', basicLocation);
          
          try {
            const enhancedLocation = await this.enhanceLocationWithAddress(basicLocation);
            console.log('📍 Enhanced location with city:', enhancedLocation);

            localStorage.setItem('userLocation', JSON.stringify(enhancedLocation));
            
            resolve(enhancedLocation);
          } catch (geocodeError) {
            console.warn('⚠️ Reverse geocoding failed, using fallback city');
            
            // Fallback: try to get city from localStorage or use default
            const savedLocation = localStorage.getItem('userLocation');
            let fallbackCity = 'Montreal'; // Default for your area
            
            if (savedLocation) {
              try {
                const parsed = JSON.parse(savedLocation);
                if (parsed.city) {
                  fallbackCity = parsed.city;
                }
              } catch (e) {
                console.warn('Failed to parse saved location');
              }
            }
            
            const locationWithFallback = {
              ...basicLocation,
              city: fallbackCity,
              address: fallbackCity,
              state: 'Quebec',
              country: 'Canada',
              zipCode: ''
            };
            
            console.log('📍 Using fallback location:', locationWithFallback);
            resolve(locationWithFallback);
          }
        } catch (error) {
          console.error('Error processing location:', error);
          reject(error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Could not get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        // Try to use saved location as fallback
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const parsed = JSON.parse(savedLocation);
            console.log('📍 Using saved location due to GPS error:', parsed);
            resolve(parsed);
            return;
          } catch (e) {
            console.warn('Failed to parse saved location');
          }
        }
        
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
}



  // Watch user's location for real-time updates
  watchLocation(callback, options = {}) {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 30000, // Update every 30 seconds max
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
  async searchNearbyGyms(location, query = '', radius = 25) {
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

  // Associate user with a gym
  async associateWithGym(gymId, isPrimary = false, membershipType = 'member') {
    try {
      const response = await api.post('/gym-bros/gyms/associate', {
        gymId,
        isPrimary,
        membershipType
      });

      if (response.data.success) {
        toast.success('Successfully associated with gym!');
      }

      return response.data;
    } catch (error) {
      console.error('Error associating with gym:', error);
      toast.error('Failed to associate with gym.');
      throw error;
    }
  }

  // Get user's gyms
  async getUserGyms() {
    try {
      const response = await api.get('/gym-bros/gyms/my-gyms');
      return response.data;
    } catch (error) {
      console.error('Error getting user gyms:', error);
      throw error;
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

  // Enhanced location data with address lookup
  async enhanceLocationWithAddress(locationData) {
    // If we already have a good address, return as-is
    if (locationData.address && locationData.address.trim() !== '') {
      return locationData;
    }

    try {
      // Use reverse geocoding to get address
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
      console.error('Error enhancing location with address:', error);
      
      // Return original data with fallback address
      return {
        ...locationData,
        address: locationData.address || 'Location coordinates'
      };
    }
  }

  // Simple reverse geocoding using a free service
  async reverseGeocode(lat, lng) {
    try {
      // Using Nominatim (OpenStreetMap) for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GymBros-App/1.0'
          }
        }
      );

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
      console.error('Reverse geocoding error:', error);
      throw error;
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

  // Check if location exists (legacy)
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

  // Clear location cache
  clearLocationCache() {
    this.locationCache.clear();
    this.lastLocationUpdate = null;
    console.log('📍 Location cache cleared');
  }
}

const enhancedGymBrosLocationService = new EnhancedGymBrosLocationService();
export default enhancedGymBrosLocationService;
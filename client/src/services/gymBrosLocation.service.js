import api from './api';
import { toast } from 'sonner';

class EnhancedGymBrosLocationService {
  constructor() {
    this.lastLocationUpdate = null;
    this.locationCache = new Map();
    this.watchId = null;
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

  // Get current location using browser geolocation
  getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps',
            timestamp: new Date().toISOString()
          };
          
          console.log('📍 Got current browser location:', location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          // Provide different error messages based on error type
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
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
          timestamp: new Date().toISOString()
        };

        // Only call callback if location has changed significantly (>10 meters)
        if (this.hasLocationChangedSignificantly(location)) {
          console.log('📍 Location changed significantly:', location);
          this.lastLocationUpdate = location;
          callback(location);
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

  // Get gyms for map with enhanced filtering
  async getGymsForMap(bounds, zoom, filters = {}) {
    try {
      const params = {
        bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
        zoom: zoom,
        limit: filters.limit || 1000,
        offset: filters.offset || 0
      };

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
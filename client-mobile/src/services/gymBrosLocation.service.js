// Updated gymBrosLocationService.js - GPS methods removed, business logic kept
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
  }

  // ✅ KEEP - IP-based location fallback (useful when GPS fails)
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

  // ✅ KEEP - Location caching for performance
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

  // ✅ KEEP - Get cached location
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

  // ✅ KEEP - Get stored location from localStorage
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

  // ✅ KEEP - Enhanced location with address
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

  // ✅ KEEP - Reverse geocoding
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

  // ✅ KEEP - Calculate distance between two points in meters
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

  // ✅ KEEP - Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // ✅ KEEP - Validate coordinates
  isValidCoordinates(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  // ✅ KEEP - Clear all location data
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

  // ✅ KEEP - Backend API Methods
  async updateUserLocationRealtime(locationData) {
    try {
      console.log('🔄 gymBrosLocationService: Updating real-time location', {
        locationData,
        timestamp: new Date().toISOString()
      });
      
      const response = await api.post('/gym-bros/realtime/location', {
        locationData
      });

      console.log('✅ gymBrosLocationService: Real-time location updated successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ gymBrosLocationService: Error updating real-time location:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Don't throw error for real-time updates to avoid disrupting UX
      return { success: false, error: error.message, details: error.response?.data };
    }
  }

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

  // ✅ KEEP - Map API Methods
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

  // ✅ KEEP - Gym Business Logic Methods
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

  // ✅ KEEP - All other gym-related methods...
  async getUserGyms() {
    try {
      const response = await api.get('/gym-bros/gyms/my-gyms');
      return response.data;
    } catch (error) {
      console.error('Error getting user gyms:', error);
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

  // ✅ KEEP - Format location for display
  formatLocationForDisplay(location) {
    if (!location) return 'Unknown location';

    const parts = [];
    
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country && location.country !== 'US') parts.push(location.country);

    return parts.length > 0 ? parts.join(', ') : 'Unknown location';
  }

  // ✅ KEEP - Get location accuracy description
  getLocationAccuracyDescription(accuracy) {
    if (!accuracy || typeof accuracy !== 'number') return 'Unknown accuracy';
    
    if (accuracy < 10) return 'Very precise (GPS)';
    if (accuracy < 50) return 'Precise (GPS)';
    if (accuracy < 100) return 'Good accuracy';
    if (accuracy < 500) return 'Approximate';
    return 'Low accuracy';
  }

  // 🚀 NEW - Helper method to work with PermissionsContext location
  processLocationFromPermissions(permissionsLocation) {
    if (!permissionsLocation) return null;
    
    // Ensure consistent format for backend
    return {
      lat: permissionsLocation.lat,
      lng: permissionsLocation.lng,
      city: permissionsLocation.city || 'Unknown City',
      address: permissionsLocation.address || permissionsLocation.city || 'Unknown location',
      source: permissionsLocation.source || 'permissions-context',
      accuracy: permissionsLocation.accuracy || 'medium',
      timestamp: permissionsLocation.timestamp || new Date().toISOString()
    };
  }
}

const gymBrosLocationService = new GymBrosLocationService();
export default gymBrosLocationService;
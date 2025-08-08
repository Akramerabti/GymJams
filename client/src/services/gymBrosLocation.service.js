import locationService from './location.service.js';
import api from './api.js';

class GymBrosLocationService {
  constructor() {
    this.isAutoSyncActive = false;
    this.lastSyncTime = 0;
    this.syncCooldown = 1800000;
    this.requestQueue = new Map();
    this.lastKnownLocation = null;
    this.locationCheckInterval = null;
    this.significantDistanceThreshold = 500;
  }
  
  isInCooldown() {
    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;
    return timeSinceLastSync < this.syncCooldown;
  }

  async debouncedApiCall(key, apiCall) {
    if (this.requestQueue.has(key)) {
      return await this.requestQueue.get(key);
    }

    const promise = apiCall().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return await promise;
  }
  
  async shouldSkipLocationStep(user = null, phone = null) {
    try {
      if (this.isInCooldown()) {
        const localLocation = this.getStoredLocation();
        if (localLocation && this.isLocationComplete(localLocation)) {
          return {
            skipStep: true,
            locationData: localLocation,
            source: 'localStorage',
            message: 'Using cached location (cooldown active)'
          };
        }
      }

      const localLocation = this.getStoredLocation();
      
      if (localLocation && this.isLocationComplete(localLocation)) {
        this.lastKnownLocation = localLocation;
        return {
          skipStep: true,
          locationData: localLocation,
          source: 'localStorage',
          message: 'Using stored location'
        };
      }

      const freshLocation = await locationService.getLocationByIP();
      if (freshLocation && this.isLocationComplete(freshLocation)) {
        this.storeLocation(freshLocation);
        this.lastKnownLocation = freshLocation;
        return {
          skipStep: true,
          locationData: freshLocation,
          source: 'ip_geolocation',
          message: 'Using IP-based location'
        };
      }

      return {
        skipStep: false,
        locationData: null,
        source: null,
        message: 'Location setup required'
      };

    } catch (error) {
      return {
        skipStep: false,
        locationData: null,
        source: null,
        message: 'Error checking location'
      };
    }
  }

  async updateLocation(locationData, user = null, phone = null) {
    try {
      if (this.isInCooldown()) {
        return {
          success: false,
          message: 'Location update in cooldown'
        };
      }
      
      const normalizedLocation = this.normalizeLocationData(locationData);
      
      this.storeLocation(normalizedLocation);
      this.lastKnownLocation = normalizedLocation;
      this.lastSyncTime = Date.now();

      const response = await api.post('/gym-bros-location/update', {
        locationData: normalizedLocation,
        user: user,
        phone: phone
      });

      if (response.data.success && user && typeof window !== 'undefined') {
        try {
          const { default: useAuthStore } = await import('../stores/authStore.js');
          const authState = useAuthStore.getState();
          
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
            useAuthStore.getState().setUser(updatedUser);
          }
        } catch (error) {}
      }

      return {
        success: true,
        updates: response.data.updates || [],
        nearbyGyms: response.data.nearbyGyms || [],
        message: response.data.message || 'Location updated successfully'
      };

    } catch (error) {
      throw error;
    }
  }

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
      return {
        nearbyGyms: [],
        locationGroups: [],
        gymGroups: []
      };
    }
  }

  async searchNearbyGyms(locationData, query = '', radiusMiles = 25) {
  try {
    if (!locationData || !locationData.lat || !locationData.lng) {
      return [];
    }

    const userLat = parseFloat(locationData.lat);
    const userLng = parseFloat(locationData.lng);

    const response = await api.get('/gym-bros/gyms/search', {
      params: {
        lat: userLat,
        lng: userLng,
        radius: radiusMiles,
        query: query
      }
    });

    const gyms = response.data.gyms || [];
    
    return gyms.map(gym => ({
      ...gym,
      distanceMiles: gym.distanceMiles !== undefined ? gym.distanceMiles : 
        this.calculateDistance(userLat, userLng, gym.location.lat, gym.location.lng)
    }));

  } catch (error) {
    return [];
  }
}

  async createGym(gymData) {
  try {
    if (!gymData.name || !gymData.location) {
      throw new Error('Gym name and location are required');
    }

    // Pass all the location data to the backend for geocoding
    const requestData = {
      name: gymData.name,
      location: {
        address: gymData.location.address || '',
        city: gymData.location.city || '',
        state: gymData.location.state || '',
        country: gymData.location.country || '',
        zipCode: gymData.location.zipCode || '',
        // Include fallback coordinates if geocoding fails
        lat: gymData.location.lat,
        lng: gymData.location.lng
      },
      userLocation: gymData.userLocation, // User's current location for distance calc
      description: gymData.description || '',
      amenities: gymData.amenities || [],
      gymChain: gymData.gymChain || '',
      website: gymData.website || '',
      phone: gymData.phone || '',
      createdByUserId: gymData.createdByUserId,
      shouldGeocode: gymData.shouldGeocode // Whether to geocode or use provided coords
    };

    const response = await api.post('/gym-bros/gyms', requestData);
    
    return response.data;
  } catch (error) {
    throw error;
  }
}


  async associateWithGym(gymId, isPrimary = false, membershipType = 'member') {
    try {
      const response = await api.post('/gym-bros/gyms/associate', {
        gymId: gymId,
        isPrimary: isPrimary,
        membershipType: membershipType
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  isLocationComplete(locationData) {
    return !!(
      locationData &&
      locationData.lat &&
      locationData.lng &&
      locationData.city
    );
  }

  normalizeLocationData(locationData) {
    if (!locationData) return null;

    let source = 'manual';
    if (locationData.source) {
      const sourceMap = {
        'gps': 'gps',
        'ip': 'ip-geolocation', 
        'ip-geolocation': 'ip-geolocation',
        'manual': 'manual',
        'imported': 'imported',
        'auto-refresh': 'ip-geolocation',
        'fresh-gps-guest': 'gps',
        'fresh-gps': 'gps',
        'user_input': 'manual'
      };
      source = sourceMap[locationData.source] || 'manual';
    }

    let country = locationData.country || 'US';
    
    if (locationData.city) {
      const city = locationData.city.toLowerCase();
      const canadianCities = ['montreal', 'toronto', 'vancouver', 'calgary', 'ottawa', 'edmonton', 'winnipeg', 'quebec', 'hamilton', 'vaudreuil'];
      if (canadianCities.some(canadianCity => city.includes(canadianCity))) {
        country = 'CA';
      }
    }
    
    if (locationData.lat && locationData.lng) {
      const lat = parseFloat(locationData.lat);
      const lng = parseFloat(locationData.lng);
      
      if (lat >= 41.0 && lat <= 83.0 && lng >= -141.0 && lng <= -52.0) {
        country = 'CA';
      }
    }

    if (locationData.address && locationData.address.toLowerCase().includes('canada')) {
      country = 'CA';
    }

    let accuracy = locationData.accuracy;
    if (!accuracy) {
      if (source === 'gps' && locationData.lat && locationData.lng) {
        accuracy = 'high';
      } else if (source === 'ip-geolocation') {
        accuracy = 'low';
      } else {
        accuracy = 'medium';
      }
    }

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

    if (!normalized.city || normalized.city === 'Unknown City') {
      normalized.city = normalized.address || 'Unknown City';
    }
    if (!normalized.address || normalized.address === 'Unknown Address') {
      normalized.address = normalized.city || 'Unknown Address';
    }

    return normalized;
  }

  storeLocation(locationData) {
    try {
      const locationToStore = {
        ...locationData,
        timestamp: new Date().toISOString()
      };
      
      if (!locationToStore.city && locationToStore.address) {
        locationToStore.city = locationToStore.address;
      }
      if (!locationToStore.address && locationToStore.city) {
        locationToStore.address = locationToStore.city;
      }
      
      localStorage.setItem('userLocation', JSON.stringify(locationToStore));
      localStorage.setItem('gymBrosLocation', JSON.stringify(locationToStore));
    } catch (error) {}
  }

  getStoredLocation() {
    try {
      const gymBrosLocation = localStorage.getItem('gymBrosLocation');
      if (gymBrosLocation) {
        const parsed = JSON.parse(gymBrosLocation);
        if (this.isLocationFresh(parsed)) {
          return parsed;
        }
      }

      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const parsed = JSON.parse(userLocation);
        if (this.isLocationFresh(parsed)) {
          return parsed;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  isLocationFresh(locationData, maxAgeHours = 168) {
    if (!locationData || !locationData.timestamp) return false;
    
    const locationTime = new Date(locationData.timestamp).getTime();
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    return (now - locationTime) < maxAgeMs;
  }

  async getBestLocation(user = null, phone = null) {
    try {
      const stored = this.getStoredLocation();
      if (stored && this.isLocationFresh(stored)) {
        return stored;
      }

      const smartResult = await this.shouldSkipLocationStep(user, phone);
      if (smartResult.skipStep && smartResult.locationData) {
        return smartResult.locationData;
      }

      const ipLocation = await locationService.getLocationByIP();
      if (ipLocation) {
        this.storeLocation(ipLocation);
        return ipLocation;
      }

      return {
        lat: 40.7128,
        lng: -74.0060,
        city: 'New York',
        address: 'New York, NY',
        source: 'default'
      };

    } catch (error) {
      return null;
    }
  }

  startAutoLocationSync(user = null, phone = null) {
    if (this.isAutoSyncActive) {
      return;
    }

    if (this.locationCheckInterval) {
      clearInterval(this.locationCheckInterval);
    }

    this.isAutoSyncActive = true;

    if (!this.isInCooldown()) {
      this.checkForSignificantLocationChange(user, phone);
    }

    this.locationCheckInterval = setInterval(() => {
      this.checkForSignificantLocationChange(user, phone);
    }, 30 * 60 * 1000);
  }

  stopAutoLocationSync() {
    if (this.locationCheckInterval) {
      clearInterval(this.locationCheckInterval);
      this.locationCheckInterval = null;
      this.isAutoSyncActive = false;
    }
  }

  async checkForSignificantLocationChange(user = null, phone = null) {
    try {
      if (this.isInCooldown()) {
        return;
      }
      
      const currentLocation = this.getStoredLocation();
      
      if (!currentLocation || !this.isLocationComplete(currentLocation)) {
        return;
      }

      if (this.lastKnownLocation && this.isLocationComplete(this.lastKnownLocation)) {
        const distance = this.calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          this.lastKnownLocation.lat,
          this.lastKnownLocation.lng
        );
        
        if (distance < this.significantDistanceThreshold) {
          return;
        }
      }

      const normalizedLocation = this.normalizeLocationData(currentLocation);
      await this.updateLocation(normalizedLocation, user, phone);

    } catch (error) {}
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  async forceSyncNow() {
    try {
      if (typeof window !== 'undefined') {
        const { default: useAuthStore } = await import('../stores/authStore.js');
        const authState = useAuthStore.getState();
        const user = authState.user;
        
        const localLocation = this.getStoredLocation();
        
        if (localLocation && this.isLocationComplete(localLocation)) {
          const normalizedLocation = this.normalizeLocationData(localLocation);
          const result = await this.updateLocation(normalizedLocation, user, user?.phone);
          return { success: true, result };
        } else {
          return { success: false, error: 'No valid localStorage location' };
        }
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

if (typeof window !== 'undefined') {
  window.gymBrosLocationService = new GymBrosLocationService();
}

export default new GymBrosLocationService();
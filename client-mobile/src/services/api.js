// Mobile location service for handling location detection using Capacitor
import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

class LocationService {
  constructor() {
    this.defaultLocation = {
      lat: 40.7128, // New York City as fallback
      lng: -74.0060,
      city: 'New York',
      address: 'New York, NY',
      source: 'default'
    };
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Get location using IP-based geolocation (no popup)
   * This is less accurate but doesn't require user permission
   * Fallback for when GPS is not available or denied
   */
  async getLocationByIP() {
    try {
      // Using ipapi.co for IP-based location (free tier: 1000 requests/day)
      const response = await fetch('https://ipapi.co/json/', {
        headers: {
          'Accept': 'application/json'
        }
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
            accuracy: 'low', // IP-based is less accurate
            timestamp: new Date().toISOString()
          };
        }
      }
      
      throw new Error('IP geolocation failed');
    } catch (error) {
      console.warn('IP geolocation failed:', error);
      return null;
    }
  }

  /**
   * Get location using mobile GPS (requires permission)
   * This is more accurate and uses native mobile location services
   */
  async getLocationByGPS(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout for mobile
      maximumAge: 600000, // 10 minutes cache
      ...options
    };

    try {
      // Request permission first
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current position using Capacitor Geolocation
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: defaultOptions.enableHighAccuracy,
        timeout: defaultOptions.timeout
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Reverse geocode to get city name
      const cityName = await this.reverseGeocode(latitude, longitude);
      
      const locationData = {
        lat: latitude,
        lng: longitude,
        city: cityName,
        address: '',
        source: 'mobile-gps',
        accuracy: accuracy < 100 ? 'high' : 'medium', // Based on accuracy in meters
        timestamp: new Date().toISOString(),
        nativeAccuracy: accuracy
      };

      return locationData;
    } catch (error) {
      let errorMessage = 'Unable to get your location';
      
      if (error.message.includes('permission')) {
        errorMessage = 'Location permission denied. Please enable location access in your device settings.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Please ensure GPS is enabled.';
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'Location services unavailable. Please check your device settings.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Watch location changes (for real-time tracking)
   */
  async watchLocation(callback, options = {}) {
    try {
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        throw new Error('Location permission denied');
      }

      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: options.enableHighAccuracy || true,
        timeout: options.timeout || 15000
      }, async (position, error) => {
        if (error) {
          callback(null, error);
          return;
        }

        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          const cityName = await this.reverseGeocode(latitude, longitude);
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            city: cityName,
            address: '',
            source: 'mobile-gps-watch',
            accuracy: accuracy < 100 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            nativeAccuracy: accuracy
          };

          callback(locationData, null);
        } catch (geocodeError) {
          // Even if geocoding fails, we have coordinates
          callback({
            lat: latitude,
            lng: longitude,
            city: 'Unknown City',
            address: '',
            source: 'mobile-gps-watch',
            accuracy: accuracy < 100 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            nativeAccuracy: accuracy
          }, null);
        }
      });

      return watchId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear location watch
   */
  async clearLocationWatch(watchId) {
    try {
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
      }
    } catch (error) {
      console.error('Failed to clear location watch:', error);
    }
  }

  /**
   * Smart location detection: tries GPS first, then IP as fallback
   * Optimized for mobile - GPS is more reliable on mobile devices
   */
  async getLocationSmart() {
    try {
      // On mobile, try GPS first as it's more accurate and reliable
      try {
        const gpsLocation = await this.getLocationByGPS({
          timeout: 10000 // Shorter timeout for first attempt
        });
        
        if (gpsLocation) {
          return {
            location: gpsLocation,
            method: 'mobile-gps',
            requiresUserConsent: true
          };
        }
      } catch (gpsError) {
        console.warn('GPS location failed, falling back to IP:', gpsError);
        
        // If GPS fails, try IP as fallback
        const ipLocation = await this.getLocationByIP();
        
        if (ipLocation) {
          return {
            location: ipLocation,
            method: 'ip-fallback',
            requiresUserConsent: false,
            fallbackReason: gpsError.message
          };
        }
      }

      // If both fail, return default
      return {
        location: this.defaultLocation,
        method: 'default',
        requiresUserConsent: false
      };

    } catch (error) {
      console.error('Smart location detection failed:', error);
      return {
        location: this.defaultLocation,
        method: 'default',
        requiresUserConsent: false
      };
    }
  }

  /**
   * Geocode manual location input
   */
  async geocodeManualLocation(locationText) {
    try {
      const locationData = {
        lat: null,
        lng: null,
        city: locationText.trim(),
        address: locationText.trim(),
        source: 'manual',
        accuracy: 'user-provided',
        timestamp: new Date().toISOString()
      };

      // Try to enhance with coordinates if possible
      try {
        const coords = await this.searchLocationCoordinates(locationText);
        if (coords) {
          locationData.lat = coords.lat;
          locationData.lng = coords.lng;
          locationData.accuracy = 'geocoded';
        }
      } catch (geocodeError) {
        console.warn('Manual location geocoding failed:', geocodeError);
      }

      return locationData;
    } catch (error) {
      console.error('Manual location processing failed:', error);
      throw new Error('Unable to process location');
    }
  }

  /**
   * Search for coordinates of a location name (using free OpenStreetMap)
   */
  async searchLocationCoordinates(locationText) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            address: data[0].display_name
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Location search failed:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get city name
   */
  async reverseGeocode(lat, lng) {
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
      console.error('Reverse geocoding failed:', error);
      return 'Unknown City';
    }
  }

  /**
   * Store location in mobile storage (using Capacitor Preferences)
   */
  async storeLocation(locationData) {
    try {
      await Preferences.set({
        key: 'userLocation',
        value: JSON.stringify(locationData)
      });
      return true;
    } catch (error) {
      console.error('Failed to store location:', error);
      return false;
    }
  }

  /**
   * Get stored location from mobile storage
   */
  async getStoredLocation() {
    try {
      const result = await Preferences.get({ key: 'userLocation' });
      return result.value ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Failed to get stored location:', error);
      return null;
    }
  }

  /**
   * Remove stored location from mobile storage
   */
  async removeStoredLocation() {
    try {
      await Preferences.remove({ key: 'userLocation' });
      return true;
    } catch (error) {
      console.error('Failed to remove stored location:', error);
      return false;
    }
  }

  /**
   * Check if stored location is still fresh
   */
  isLocationFresh(locationData, maxAgeHours = 24) {
    if (!locationData || !locationData.timestamp) return false;
    
    const locationTime = new Date(locationData.timestamp).getTime();
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    return (now - locationTime) < maxAgeMs;
  }

  /**
   * Get the best available location with smart fallbacks
   * Optimized for mobile usage patterns
   */
  async getBestLocation() {
    try {
      // Check for fresh stored location first
      const stored = await this.getStoredLocation();
      if (stored && this.isLocationFresh(stored, 6)) { // Shorter cache time for mobile (6 hours)
        return stored;
      }

      // Try smart detection
      const smartResult = await this.getLocationSmart();
      
      if (smartResult.location && smartResult.location !== this.defaultLocation) {
        await this.storeLocation(smartResult.location);
        return smartResult.location;
      }

      // If we have old stored location, use it instead of default
      if (stored) {
        return stored;
      }

      // Return default if all else fails
      return this.defaultLocation;
    } catch (error) {
      console.error('Failed to get best location:', error);
      
      // Try to return stored location even if it's old
      try {
        const stored = await this.getStoredLocation();
        if (stored) return stored;
      } catch (storageError) {
        console.error('Failed to get stored location:', storageError);
      }
      
      return this.defaultLocation;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkLocationPermission() {
    try {
      const permissions = await Geolocation.checkPermissions();
      return {
        granted: permissions.location === 'granted',
        denied: permissions.location === 'denied',
        status: permissions.location
      };
    } catch (error) {
      console.error('Failed to check location permissions:', error);
      return {
        granted: false,
        denied: false,
        status: 'unknown'
      };
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission() {
    try {
      const permissions = await Geolocation.requestPermissions();
      return {
        granted: permissions.location === 'granted',
        denied: permissions.location === 'denied',
        status: permissions.location
      };
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return {
        granted: false,
        denied: true,
        status: 'denied'
      };
    }
  }

  /**
   * Calculate distance between two points (in kilometers)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  /**
   * Get platform information
   */
  getPlatformInfo() {
    return {
      isNative: this.isNative,
      platform: Capacitor.getPlatform(),
      isAndroid: Capacitor.getPlatform() === 'android',
      isIOS: Capacitor.getPlatform() === 'ios',
      isWeb: Capacitor.getPlatform() === 'web'
    };
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService;
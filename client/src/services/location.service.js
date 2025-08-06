// Location service for handling various location detection methods
import { toast } from 'sonner';

class LocationService {
  constructor() {
    this.defaultLocation = {
      lat: 40.7128, // New York City as fallback
      lng: -74.0060,
      city: 'New York',
      address: 'New York, NY',
      source: 'default'
    };
  }

  /**
   * Get location using IP-based geolocation (no popup)
   * This is less accurate but doesn't require user permission
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
   * Get location using browser GPS (requires permission popup)
   * This is more accurate but requires user permission
   */
  async getLocationByGPS(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 600000, // 10 minutes cache
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
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get city name
            const cityName = await this.reverseGeocode(latitude, longitude);
            
            const locationData = {
              lat: latitude,
              lng: longitude,
              city: cityName,
              address: '',
              source: 'gps',
              accuracy: 'high',
              timestamp: new Date().toISOString()
            };

            resolve(locationData);
          } catch (geocodeError) {
            // Even if geocoding fails, we have coordinates
            resolve({
              lat: latitude,
              lng: longitude,
              city: 'Unknown City',
              address: '',
              source: 'gps',
              accuracy: 'high',
              timestamp: new Date().toISOString()
            });
          }
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          
          if (error.code === 1) {
            errorMessage = 'Location access denied';
          } else if (error.code === 2) {
            errorMessage = 'Location unavailable';
          } else if (error.code === 3) {
            errorMessage = 'Location request timed out';
          }
          
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  /**
   * Smart location detection: tries IP first, then offers GPS as fallback
   */
  async getLocationSmart() {
    try {
      // First try IP-based location (no popup)
      console.log('🌐 Attempting IP-based location detection...');
      const ipLocation = await this.getLocationByIP();
      
      if (ipLocation) {
        console.log('✅ IP-based location detected:', ipLocation.city);
        return {
          location: ipLocation,
          method: 'ip',
          requiresUserConsent: false
        };
      }

      // If IP fails, return GPS option for user to choose
      console.log('⚠️ IP-based location failed, GPS option available');
      return {
        location: null,
        method: 'gps-available',
        requiresUserConsent: true
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
      // For manual input, we can use a simple approach
      // In production, you'd want to use Google Places API or similar
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
        // It's okay if geocoding fails for manual input
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
   * Store location in localStorage
   */
  storeLocation(locationData) {
    try {
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      return true;
    } catch (error) {
      console.error('Failed to store location:', error);
      return false;
    }
  }

  /**
   * Get stored location from localStorage
   */
  getStoredLocation() {
    try {
      const stored = localStorage.getItem('userLocation');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored location:', error);
      return null;
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
   */
  async getBestLocation() {
    // Check for fresh stored location first
    const stored = this.getStoredLocation();
    if (stored && this.isLocationFresh(stored)) {
      console.log('Using stored location:', stored.city);
      return stored;
    }

    // Try smart detection
    const smartResult = await this.getLocationSmart();
    
    if (smartResult.location) {
      this.storeLocation(smartResult.location);
      return smartResult.location;
    }

    // Return default if all else fails
    return this.defaultLocation;
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService;

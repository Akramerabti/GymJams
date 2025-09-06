import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
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

      const ipLocation = await this.getLocationByIP();
      
      if (ipLocation) {

        return {
          location: ipLocation,
          method: 'ip',
          requiresUserConsent: false
        };
      }


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
   * Reverse geocode coordinates to get city name with fallback options
   */
  async reverseGeocode(lat, lng) {
    try {
      // Validate coordinates
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates provided:', { lat, lng });
        return 'Unknown City';
      }

      // Use OpenStreetMap Nominatim as primary service (free and reliable)
      try {
        console.log('Making reverse geocoding request to Nominatim...');
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`;
        
        const nominatimResponse = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'GymJams App (contact@gymjams.com)'
          }
        });
        
        console.log('Nominatim response status:', nominatimResponse.status);
        
        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          console.log('Nominatim response data:', nominatimData);
          
          if (nominatimData.address) {
            const city = nominatimData.address.city || 
                        nominatimData.address.town || 
                        nominatimData.address.village || 
                        nominatimData.address.municipality ||
                        nominatimData.address.hamlet;
            if (city) {
              console.log('Successfully geocoded to city:', city);
              return city;
            }
          }
        } else {
          console.error('Nominatim API error:', {
            status: nominatimResponse.status,
            statusText: nominatimResponse.statusText
          });
        }
      } catch (nominatimError) {
        console.error('Nominatim service failed:', nominatimError);
      }

      // Fallback to BigDataCloud with correct endpoint (if IP isn't banned)
      try {
        console.log('Trying BigDataCloud fallback...');
        const url = `https://api.bigdatacloud.net/data/reverse-geocode?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
        
        const response = await fetch(url);
        
        console.log('BigDataCloud response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('BigDataCloud response data:', data);
          const city = data.city || data.locality || data.principalSubdivision;
          if (city) {
            return city;
          }
        } else if (response.status === 402 || response.status === 403) {
          console.warn('BigDataCloud API access restricted (likely IP banned). Using only Nominatim.');
        } else {
          console.error('BigDataCloud API error:', {
            status: response.status,
            statusText: response.statusText,
            url: url
          });
        }
      } catch (bigDataError) {
        console.error('BigDataCloud service failed:', bigDataError);
      }
      
      return 'Unknown City';
    } catch (error) {
      console.error('All reverse geocoding services failed:', error);
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

  /**
 * Request location permission (works for both web and native)
 */
async requestLocationPermission() {
  try {
    // Check if we're in a Capacitor native environment
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      
      try {
        const permissions = await Geolocation.requestPermissions();
        return {
          granted: permissions.location === 'granted',
          status: permissions.location
        };
      } catch (error) {
        console.error('Native location permission request failed:', error);
        return { granted: false, status: 'denied' };
      }
    } else {
      // Web browser - use the Permissions API if available
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          
          if (result.state === 'granted') {
            return { granted: true, status: 'granted' };
          } else if (result.state === 'prompt') {
            // Try to trigger the permission request by calling getCurrentPosition
            try {
              await this.getLocationByGPS({ timeout: 1000 });
              return { granted: true, status: 'granted' };
            } catch (gpsError) {
              return { granted: false, status: 'denied' };
            }
          } else {
            return { granted: false, status: result.state };
          }
        } catch (permError) {
          // Fallback to direct GPS request
          try {
            await this.getLocationByGPS({ timeout: 1000 });
            return { granted: true, status: 'granted' };
          } catch (gpsError) {
            return { granted: false, status: 'denied' };
          }
        }
      } else {
        // No Permissions API - try direct GPS request
        try {
          await this.getLocationByGPS({ timeout: 1000 });
          return { granted: true, status: 'granted' };
        } catch (error) {
          return { granted: false, status: 'denied' };
        }
      }
    }
  } catch (error) {
    console.error('Location permission request failed:', error);
    return { granted: false, status: 'error' };
  }
}

}

// Create singleton instance
const locationService = new LocationService();

export default locationService;

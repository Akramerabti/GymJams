// server/src/services/geocoding.service.js
// Enhanced geocoding service with worldwide support

import axios from 'axios';
import logger from '../utils/logger.js';

class GeocodingService {
  constructor() {
    // Nominatim is free but requires a user agent
    this.nominatimUrl = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'GymJams/1.0'; // Replace with your app name
    
    // Alternative: You can also use other free services
    // - MapBox (requires free API key): https://docs.mapbox.com/api/search/geocoding/
    // - OpenCage (requires free API key): https://opencagedata.com/api
    // - Geoapify (requires free API key): https://www.geoapify.com/geocoding-api
  }

  // Enhanced geocoding with zip code support
  async geocodeAddress(address, city, state, country = 'US', zipCode = '') {
    try {
      // Build structured query for better accuracy
      const structuredQuery = {
        street: address,
        city: city,
        state: state,
        country: country,
        postalcode: zipCode
      };
      
      // Remove empty values
      Object.keys(structuredQuery).forEach(key => {
        if (!structuredQuery[key]) {
          delete structuredQuery[key];
        }
      });
      
      // Also build a free-form query as fallback
      const queryParts = [];
      if (address && address.trim()) queryParts.push(address.trim());
      if (city && city.trim()) queryParts.push(city.trim());
      if (state && state.trim()) queryParts.push(state.trim());
      if (zipCode && zipCode.trim()) queryParts.push(zipCode.trim());
      if (country && country.trim()) queryParts.push(country.trim());
      
      const freeFormQuery = queryParts.join(', ');
      
      logger.info(`Geocoding with structured query:`, structuredQuery);
      logger.info(`Fallback free-form query: ${freeFormQuery}`);
      
      // Try structured search first (more accurate)
      let response;
      try {
        response = await axios.get(`${this.nominatimUrl}/search`, {
          params: {
            ...structuredQuery,
            format: 'json',
            limit: 1,
            addressdetails: 1,
            extratags: 1
          },
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: 5000
        });
      } catch (structuredError) {
        logger.warn('Structured search failed, trying free-form search:', structuredError.message);
        
        // Fall back to free-form search
        response = await axios.get(`${this.nominatimUrl}/search`, {
          params: {
            q: freeFormQuery,
            format: 'json',
            limit: 1,
            countrycodes: country ? country.toLowerCase() : undefined,
            addressdetails: 1
          },
          headers: {
            'User-Agent': this.userAgent
          },
          timeout: 5000
        });
      }
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        
        const coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name,
          confidence: result.importance || 0.5,
          // Include additional details
          address_details: {
            house_number: result.address?.house_number,
            road: result.address?.road,
            neighbourhood: result.address?.neighbourhood,
            suburb: result.address?.suburb,
            city: result.address?.city || result.address?.town || result.address?.village,
            state: result.address?.state || result.address?.province,
            postcode: result.address?.postcode,
            country: result.address?.country,
            country_code: result.address?.country_code?.toUpperCase()
          }
        };
        
        logger.info(`Geocoding successful: ${coordinates.lat}, ${coordinates.lng}`);
        logger.info(`Location: ${coordinates.display_name}`);
        return coordinates;
      } else {
        logger.warn(`No geocoding results found for: ${freeFormQuery}`);
        
        // Try with less specific query (just city and country)
        if (city && country) {
          logger.info('Trying with just city and country...');
          const fallbackResponse = await axios.get(`${this.nominatimUrl}/search`, {
            params: {
              q: `${city}, ${country}`,
              format: 'json',
              limit: 1
            },
            headers: {
              'User-Agent': this.userAgent
            },
            timeout: 5000
          });
          
          if (fallbackResponse.data && fallbackResponse.data.length > 0) {
            const result = fallbackResponse.data[0];
            return {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon),
              display_name: result.display_name,
              confidence: 0.3, // Lower confidence for city-level match
              approximate: true
            };
          }
        }
        
        return null;
      }
    } catch (error) {
      logger.error('Geocoding error:', error.message);
      
      // Log more details in development
      if (process.env.NODE_ENV === 'development') {
        logger.error('Full error:', error);
      }
      
      return null;
    }
  }
  
  // Reverse geocode coordinates to get address
  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          zoom: 18, // Street level detail
          addressdetails: 1
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 5000
      });
      
      if (response.data) {
        const result = response.data;
        
        return {
          address: result.display_name,
          house_number: result.address?.house_number,
          road: result.address?.road,
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state || result.address?.province,
          country: result.address?.country,
          country_code: result.address?.country_code?.toUpperCase(),
          postcode: result.address?.postcode
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Reverse geocoding error:', error.message);
      return null;
    }
  }
  
  // Calculate distance between two points (in miles)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // Calculate distance in kilometers
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  // Validate coordinates
  isValidCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
  
  // Get country code from coordinates
  async getCountryFromCoordinates(lat, lng) {
    try {
      const result = await this.reverseGeocode(lat, lng);
      return result?.country_code || null;
    } catch (error) {
      return null;
    }
  }
}

export default new GeocodingService();
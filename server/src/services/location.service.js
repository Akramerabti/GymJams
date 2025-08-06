import logger from '../utils/logger.js';

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in miles
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  try {
    // Validate coordinates
    if (!isValidCoordinate(lat1) || !isValidCoordinate(lng1) || 
        !isValidCoordinate(lat2) || !isValidCoordinate(lng2)) {
      logger.warn('Invalid coordinates in distance calculation:', { lat1, lng1, lat2, lng2 });
      return 999; // Return large distance for invalid coordinates
    }
    
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch (error) {
    logger.error('Error calculating distance:', error);
    return 999; // Return large distance on error
  }
};

/**
 * Check if coordinate is valid
 * @param {*} coord - Coordinate to validate
 * @returns {boolean} True if valid
 */
const isValidCoordinate = (coord) => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get coaches within specified radius of user location
 * @param {Object} userLocation - User's location {lat, lng}
 * @param {Array} coaches - Array of coach objects with location
 * @param {number} maxDistance - Maximum distance in miles (default: 50)
 * @returns {Array} Array of coaches with distance calculated
 */
export const getCoachesWithinRadius = (userLocation, coaches, maxDistance = 50) => {
  try {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      logger.warn('Invalid user location provided for coach radius filtering');
      return coaches; // Return all coaches if no location
    }

    return coaches
      .map(coach => {
        // Calculate distance if coach has location
        if (coach.location && coach.location.lat && coach.location.lng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            coach.location.lat,
            coach.location.lng
          );
          
          return {
            ...coach,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
            isNearby: distance <= maxDistance
          };
        }
        
        // Coach without location gets maximum distance
        return {
          ...coach,
          distance: 999,
          isNearby: false
        };
      })
      .filter(coach => coach.isNearby) // Only return coaches within radius
      .sort((a, b) => a.distance - b.distance); // Sort by distance
  } catch (error) {
    logger.error('Error filtering coaches by radius:', error);
    return coaches;
  }
};

/**
 * Calculate location compatibility score for coaching matching
 * @param {Object} userLocation - User's location
 * @param {Object} coachLocation - Coach's location
 * @param {number} maxDistance - Maximum preferred distance
 * @returns {number} Score between 0-1 (1 = perfect, 0 = too far)
 */
export const calculateLocationCompatibilityScore = (userLocation, coachLocation, maxDistance = 50) => {
  try {
    if (!userLocation || !coachLocation) return 0;
    
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      coachLocation.lat, coachLocation.lng
    );
    
    // Score decreases as distance increases
    // 0 miles = score 1, maxDistance miles = score 0
    return Math.max(0, 1 - (distance / maxDistance));
  } catch (error) {
    logger.error('Error calculating location compatibility score:', error);
    return 0;
  }
};

/**
 * Format location for display (city only, never full address)
 * @param {Object} location - Location object
 * @param {number} distance - Distance in miles (optional)
 * @returns {string} Formatted location string
 */
export const formatLocationForDisplay = (location, distance = null) => {
  try {
    if (!location) return 'Location not set';
    
    let displayText = location.city || 'Unknown city';
    
    if (distance !== null && distance !== undefined && distance < 999) {
      displayText += ` (${Math.round(distance)} mi away)`;
    }
    
    return displayText;
  } catch (error) {
    logger.error('Error formatting location for display:', error);
    return 'Location unavailable';
  }
};

/**
 * Validate location data before saving
 * @param {Object} location - Location object to validate
 * @returns {Object} Validation result {isValid, errors}
 */
export const validateLocationData = (location) => {
  const errors = [];
  
  if (!location) {
    errors.push('Location data is required');
    return { isValid: false, errors };
  }
  
  // Validate latitude
  if (typeof location.lat !== 'number' || isNaN(location.lat)) {
    errors.push('Valid latitude is required');
  } else if (location.lat < -90 || location.lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  // Validate longitude
  if (typeof location.lng !== 'number' || isNaN(location.lng)) {
    errors.push('Valid longitude is required');
  } else if (location.lng < -180 || location.lng > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  // City is required for display
  if (!location.city || location.city.trim().length === 0) {
    errors.push('City name is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  calculateDistance,
  getCoachesWithinRadius,
  calculateLocationCompatibilityScore,
  formatLocationForDisplay,
  validateLocationData
};

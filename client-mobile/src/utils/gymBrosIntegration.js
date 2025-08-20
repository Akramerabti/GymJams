// client/src/utils/gymBrosIntegration.js

/**
 * Helper functions to ensure consistency between GymBrosSettings and GymBrosFilters
 */

/**
 * Convert ageRange from [min, max] array format to {min, max} object format
 * @param {Array} ageRangeArray - Age range in array format [min, max]
 * @returns {Object} Age range in object format {min, max}
 */
export const convertAgeRangeToObject = (ageRangeArray) => {
    if (!ageRangeArray || !Array.isArray(ageRangeArray) || ageRangeArray.length !== 2) {
      return { min: 18, max: 99 }; // Default values
    }
    return {
      min: ageRangeArray[0],
      max: ageRangeArray[1]
    };
  };
  
  /**
   * Convert ageRange from {min, max} object format to [min, max] array format
   * @param {Object} ageRangeObject - Age range in object format {min, max}
   * @returns {Array} Age range in array format [min, max]
   */
  export const convertAgeRangeToArray = (ageRangeObject) => {
    if (!ageRangeObject || typeof ageRangeObject !== 'object') {
      return [18, 99]; // Default values
    }
    return [
      ageRangeObject.min || 18,
      ageRangeObject.max || 99
    ];
  };
  
  /**
   * Normalize filters to ensure consistent format between components
   * @param {Object} filters - Filters object from settings or filters component
   * @returns {Object} Normalized filters
   */
  export const normalizeFilters = (filters = {}) => {
    // Start with default values
    const normalized = {
      maxDistance: 50,
      ageRange: { min: 18, max: 99 },
      workoutTypes: [],
      experienceLevel: 'Any',
      preferredTime: 'Any',
      genderPreference: 'All'
    };
  
    // Apply provided filters
    if (filters.maxDistance) normalized.maxDistance = filters.maxDistance;
    
    // Handle age range in both array and object formats
    if (filters.ageRange) {
      if (Array.isArray(filters.ageRange)) {
        normalized.ageRange = convertAgeRangeToObject(filters.ageRange);
      } else {
        normalized.ageRange = filters.ageRange;
      }
    }
  
    if (filters.workoutTypes) normalized.workoutTypes = filters.workoutTypes;
    if (filters.experienceLevel) normalized.experienceLevel = filters.experienceLevel;
    if (filters.preferredTime) normalized.preferredTime = filters.preferredTime;
    if (filters.genderPreference) normalized.genderPreference = filters.genderPreference;
  
    return normalized;
  };
  
  /**
   * Convert settings to filters format
   * @param {Object} settings - Settings object from GymBrosSettings
   * @returns {Object} Filters compatible with GymBrosFilters
   */
  export const settingsToFilters = (settings = {}) => {
    const filters = {
      maxDistance: settings.maxDistance || 50,
      workoutTypes: settings.workoutTypes || [],
      experienceLevel: settings.experienceLevel || 'Any',
      preferredTime: settings.preferredTime || 'Any',
      genderPreference: settings.genderPreference || 'All'
    };
  
    // Convert age range from array to object if needed
    if (settings.ageRange) {
      if (Array.isArray(settings.ageRange)) {
        filters.ageRange = convertAgeRangeToObject(settings.ageRange);
      } else {
        filters.ageRange = settings.ageRange;
      }
    } else {
      filters.ageRange = { min: 18, max: 99 };
    }
  
    return filters;
  };
  
  /**
   * Convert filters to settings format
   * @param {Object} filters - Filters from GymBrosFilters
   * @returns {Object} Settings compatible with GymBrosSettings
   */
  export const filtersToSettings = (filters = {}) => {
    const settings = {
      maxDistance: filters.maxDistance || 50,
      workoutTypes: filters.workoutTypes || [],
      experienceLevel: filters.experienceLevel || 'Any',
      preferredTime: filters.preferredTime || 'Any',
      genderPreference: filters.genderPreference || 'All'
    };
  
    // Convert age range from object to array if needed
    if (filters.ageRange) {
      if (Array.isArray(filters.ageRange)) {
        settings.ageRange = filters.ageRange;
      } else {
        settings.ageRange = convertAgeRangeToArray(filters.ageRange);
      }
    } else {
      settings.ageRange = [18, 99];
    }
  
    return settings;
  };
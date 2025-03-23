export const calculateTrend = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

export const calculateCompatibility = (userProfile, matchProfile) => {
  // Debugging info
  console.log("User profile:", userProfile ? {
    workoutTypes: userProfile.workoutTypes,
    experienceLevel: userProfile.experienceLevel,
    preferredTime: userProfile.preferredTime,
    location: userProfile.location ? 
      { lat: userProfile.location.lat, lng: userProfile.location.lng } : 'missing'
  } : 'missing');
  
  console.log("Match profile:", matchProfile ? {
    workoutTypes: matchProfile.workoutTypes,
    experienceLevel: matchProfile.experienceLevel,
    preferredTime: matchProfile.preferredTime,
    location: matchProfile.location ? 
      { lat: matchProfile.location.lat, lng: matchProfile.location.lng } : 'missing'
  } : 'missing');

  if (!userProfile || !matchProfile) {
    console.log("Missing profile data, returning default values");
    return {
      overallScore: 50, // Start from 50% rather than 0% as a base
      workoutCompatibility: 'Eish...', // More positive default
      workoutCompatibilityScore: 50,
      scheduleCompatibility: 'Good',
      scheduleCompatibilityScore: 50,
      experienceCompatibility: 'Good',
      experienceCompatibilityScore: 50,
      locationCompatibility: 'Nearby',
      locationScore: 50,
      commonWorkouts: 0
    };
  }
  
  // 1. Workout Type Compatibility (30%)
  const workoutTypeScore = calculateWorkoutTypeCompatibility(
    userProfile.workoutTypes || [],
    matchProfile.workoutTypes || []
  );
  console.log("Workout type score:", workoutTypeScore);
  
  // 2. Experience Level Compatibility (20%)
  const experienceScore = calculateExperienceCompatibility(
    userProfile.experienceLevel,
    matchProfile.experienceLevel
  );
  console.log("Experience score:", experienceScore);
  
  // 3. Schedule Compatibility (25%)
  const scheduleScore = calculateScheduleCompatibility(
    userProfile.preferredTime,
    matchProfile.preferredTime
  );
  console.log("Schedule score:", scheduleScore);
  
  // 4. Location Proximity (25%)
  const locationScore = calculateLocationScore(
    userProfile.location,
    matchProfile.location
  );
  console.log("Location score:", locationScore);
  
  // Calculate overall score (weighted average) with minimum baseline of 50%
  let rawScore = (workoutTypeScore * 20 + 
                 experienceScore * 10 + 
                 scheduleScore * 35 + 
                 locationScore * 35) / 100;
  
  // Apply a more generous curve: boost scores to make them more favorable
  // Map 0-1 raw score to 50-100 display score with slight curve
  const overallScore = Math.round(50 + (rawScore * 50));
  console.log("Raw score:", rawScore, "Overall score (curved):", overallScore);
  
  // Count common workout types
  const commonWorkouts = countCommonWorkoutTypes(
    userProfile.workoutTypes || [],
    matchProfile.workoutTypes || []
  );
  console.log("Common workout types:", commonWorkouts);
  
  // Format scores as percentages (with a more positive scale)
  const workoutCompatibilityScore = Math.min(100, Math.round(25 + (workoutTypeScore * 50)));
  const experienceCompatibilityScore = Math.min(100, Math.round(50 + (experienceScore * 50)));
  const scheduleCompatibilityScore = Math.min(100, Math.round(50 + (scheduleScore * 50)));
  const locationScorePercent = Math.min(100, Math.round(50 + (locationScore * 50)));
  
  // Label compatibility levels (using more positive labels)
  const workoutCompatibility = getCompatibilityLabel(0.5 + (workoutTypeScore * 0.5));
  const scheduleCompatibility = getCompatibilityLabel(0.5 + (scheduleScore * 0.5));
  const experienceCompatibility = getCompatibilityLabel(0.5 + (experienceScore * 0.5));
  const locationCompatibility = getLocationLabel(0.5 + (locationScore * 0.5));
  
  const result = {
    overallScore,
    workoutCompatibility,
    workoutCompatibilityScore,
    scheduleCompatibility,
    scheduleCompatibilityScore,
    experienceCompatibility,
    experienceCompatibilityScore,
    locationCompatibility,
    locationScore: locationScorePercent,
    commonWorkouts
  };
  
  console.log("Final compatibility result:", result);
  return result;
};

const calculateWorkoutTypeCompatibility = (userWorkouts, matchWorkouts) => {
  if (!userWorkouts.length || !matchWorkouts.length) return 0;
  
  // Count matching workout types
  const matchingWorkouts = userWorkouts.filter(type => 
    matchWorkouts.includes(type)
  );
  
  // Calculate Jaccard similarity: intersection / union
  const union = new Set([...userWorkouts, ...matchWorkouts]);
  
  return matchingWorkouts.length / union.size;
};

/**
 * Count common workout types between two profiles
 */
const countCommonWorkoutTypes = (userWorkouts, matchWorkouts) => {
  if (!userWorkouts.length || !matchWorkouts.length) return 0;
  
  return userWorkouts.filter(type => matchWorkouts.includes(type)).length;
};

/**
 * Calculate experience level compatibility score (0-1)
 */
const calculateExperienceCompatibility = (userLevel, matchLevel) => {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  
  // If either level is missing, return neutral score
  if (!userLevel || !matchLevel) return 0.5;
  
  // If identical experience level, perfect match
  if (userLevel === matchLevel) return 1;
  
  // Calculate distance between experience levels
  const userIndex = levels.indexOf(userLevel);
  const matchIndex = levels.indexOf(matchLevel);
  
  // Handle invalid experience levels
  if (userIndex === -1 || matchIndex === -1) return 0.5;
  
  const levelDistance = Math.abs(userIndex - matchIndex);
  
  // Normalize to 0-1 (closer experience levels are better matches)
  return 1 - (levelDistance / (levels.length - 1));
};

/**
 * Calculate schedule compatibility score (0-1)
 */
const calculateScheduleCompatibility = (userTime, matchTime) => {
  // If either prefers "Flexible" or times match exactly, perfect score
  if (userTime === 'Flexible' || matchTime === 'Flexible' || userTime === matchTime) {
    return 1;
  }
  
  // Time period groupings
  const dayPeriods = ['Morning', 'Afternoon'];
  const nightPeriods = ['Evening', 'Late Night'];
  const weekendOptions = ['Weekends Only'];
  
  // Check if both times fall within compatible groups
  if (
    (dayPeriods.includes(userTime) && dayPeriods.includes(matchTime)) ||
    (nightPeriods.includes(userTime) && nightPeriods.includes(matchTime)) ||
    (weekendOptions.includes(userTime) && weekendOptions.includes(matchTime))
  ) {
    return 0.60; // Good but not perfect compatibility
  }
  
  // Otherwise, low compatibility
  return 0.25;
};

/**
 * Calculate location proximity score (0-1)
 */
const calculateLocationScore = (userLocation, matchLocation) => {
  if (!userLocation || !matchLocation || 
      !userLocation.lat || !userLocation.lng || 
      !matchLocation.lat || !matchLocation.lng) {
    return 0;
  }
  
  // Calculate distance between locations (in miles)
  const distance = calculateDistance(
    userLocation.lat, userLocation.lng,
    matchLocation.lat, matchLocation.lng
  );
  
  // Score decreases as distance increases
  // 0 miles = score 1, 50+ miles = score 0
  const maxDistance = 50; // Miles
  return Math.max(0, 1 - (distance / maxDistance));
};

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @returns {Number} Distance in miles
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validate inputs to prevent NaN results
  if (!isValidCoordinate(lat1) || !isValidCoordinate(lon1) || 
      !isValidCoordinate(lat2) || !isValidCoordinate(lon2)) {
    return 999; // Return large distance for invalid coordinates
  }
  
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isValidCoordinate = (coord) => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get a descriptive label for compatibility score
 */
const getCompatibilityLabel = (score) => {
  if (score >= 0.85) return 'Perfect';
  if (score >= 0.7) return 'High';
  if (score >= 0.5) return 'Eish...';
  if (score >= 0.3) return 'Fair';
  return 'Low';
};

/**
 * Get a descriptive label for location proximity
 */
const getLocationLabel = (score) => {
  if (score >= 0.9) return 'Very Close';
  if (score >= 0.7) return 'Close';
  if (score >= 0.5) return 'Nearby';
  if (score >= 0.3) return 'Moderate Distance';
  return 'Far';
};
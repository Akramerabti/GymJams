// server/src/services/gymBrosMatchingService.js

/**
 * Calculate match score between two users
 * Higher score indicates better compatibility
 * @param {Object} userProfile - The current user's profile
 * @param {Object} candidateProfile - The potential match's profile
 * @returns {Number} - Score between 0-100
 */
export const calculateMatchScore = (userProfile, candidateProfile) => {

  console.log(`Calculating match score between ${userProfile.userId} and ${candidateProfile.userId}`);

    // Initialize base score
    let score = 0;
    let weightSum = 0;
    
    // 1. Workout Type Compatibility (weight: 30)
    const workoutTypeScore = calculateWorkoutTypeCompatibility(
      userProfile.workoutTypes,
      candidateProfile.workoutTypes
    );
    score += workoutTypeScore * 30;
    weightSum += 30;
    
    // 2. Experience Level Compatibility (weight: 20)
    const experienceScore = calculateExperienceCompatibility(
      userProfile.experienceLevel,
      candidateProfile.experienceLevel
    );
    score += experienceScore * 20;
    weightSum += 20;
    
    // 3. Schedule Compatibility (weight: 25)
    const scheduleScore = calculateScheduleCompatibility(
      userProfile.preferredTime,
      candidateProfile.preferredTime
    );
    score += scheduleScore * 25;
    weightSum += 25;
    
    // 4. Location Proximity (weight: 25)
    const locationScore = calculateLocationScore(
      userProfile.location,
      candidateProfile.location
    );
    score += locationScore * 25;
    weightSum += 25;
    
    console.log(`Match component scores for ${candidateProfile.name}:`, {
      workoutTypeScore: workoutTypeScore.toFixed(2),
      experienceScore: experienceScore.toFixed(2),
      scheduleScore: scheduleScore.toFixed(2),
      locationScore: locationScore.toFixed(2),
      finalScore: ((score / weightSum) * 100).toFixed(2)
    });
  
    
    // Normalize the score to be between 0-100
    return (score / weightSum) * 100;
  };
  
  const calculateWorkoutTypeCompatibility = (userWorkouts, candidateWorkouts) => {
    if (!userWorkouts || !candidateWorkouts) {
      console.warn('Missing workout types in compatibility calculation');
      return 0;
    }
    
    if (!Array.isArray(userWorkouts)) userWorkouts = [];
    if (!Array.isArray(candidateWorkouts)) candidateWorkouts = [];
    
    if (!userWorkouts.length || !candidateWorkouts.length) return 0;
    
    // Count matching workout types
    const matchingWorkouts = userWorkouts.filter(type => 
      candidateWorkouts.includes(type)
    );
    
    // Calculate Jaccard similarity: intersection / union
    const union = new Set([...userWorkouts, ...candidateWorkouts]);
    
    const score = matchingWorkouts.length / union.size;
    console.log(`Workout compatibility: ${matchingWorkouts.length} matches out of ${union.size} types = ${score.toFixed(2)}`);
    return score;
  };
  
 
  const calculateExperienceCompatibility = (userLevel, candidateLevel) => {
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    
    // Handle missing data gracefully
    if (!userLevel || !candidateLevel) {
      console.warn('Missing experience levels:', { userLevel, candidateLevel });
      return 0.5; // Return neutral score when data is missing
    }
    
    // If identical experience level, perfect match
    if (userLevel === candidateLevel) return 1;
    
    // Calculate distance between experience levels
    const userIndex = levels.indexOf(userLevel);
    const candidateIndex = levels.indexOf(candidateLevel);
    
    // Handle invalid experience levels
    if (userIndex === -1 || candidateIndex === -1) {
      console.warn('Invalid experience levels:', { userLevel, candidateLevel });
      return 0.5;
    }
    
    const levelDistance = Math.abs(userIndex - candidateIndex);
    
    // Normalize to 0-1 (closer experience levels are better matches)
    return 1 - (levelDistance / (levels.length - 1));
  };

  const calculateScheduleCompatibility = (userTime, candidateTime) => {
    // If either prefers "Flexible" or times match exactly, perfect score
    if (userTime === 'Flexible' || candidateTime === 'Flexible' || userTime === candidateTime) {
      return 1;
    }
    
    // Time period groupings
    const dayPeriods = ['Morning', 'Afternoon', 'Evening'];
    const nightPeriods = ['Evening', 'Late Night'];
    const weekendOptions = ['Weekends Only'];
    
    // Check if both times fall within compatible groups
    if (
      (dayPeriods.includes(userTime) && dayPeriods.includes(candidateTime)) ||
      (nightPeriods.includes(userTime) && nightPeriods.includes(candidateTime)) ||
      (weekendOptions.includes(userTime) && weekendOptions.includes(candidateTime))
    ) {
      return 0.75; // Good but not perfect compatibility
    }
    
    // Otherwise, low compatibility
    return 0.25;
  };
  
  /**
   * Calculate score based on location proximity
   * @returns {Number} - Score between 0-1
   */
  const calculateLocationScore = (userLocation, candidateLocation) => {
    if (!userLocation || !candidateLocation) return 0;
    
    // Calculate distance between locations (in miles)
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      candidateLocation.lat, candidateLocation.lng
    );
    
    // Score decreases as distance increases
    // 0 miles = score 1, 50+ miles = score 0
    const maxDistance = 50; // Miles
    return Math.max(0, 1 - (distance / maxDistance));
  };
  

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Validate inputs to prevent NaN results
    if (!isValidCoordinate(lat1) || !isValidCoordinate(lon1) || 
        !isValidCoordinate(lat2) || !isValidCoordinate(lon2)) {
      console.warn('Invalid coordinates in distance calculation:', { lat1, lon1, lat2, lon2 });
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

  export {
    calculateDistance,
    calculateWorkoutTypeCompatibility,
    calculateExperienceCompatibility,
    calculateScheduleCompatibility,
    calculateLocationScore,
  };
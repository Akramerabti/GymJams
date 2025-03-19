// server/src/services/gymBrosRecommendationService.js
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosPreference from '../models/GymBrosPreference.js';
import logger from '../utils/logger.js';

/**
 * Calculate distance between two geographic coordinates using the Haversine formula
 * @param {Object} coords1 - First set of coordinates {lat, lng}
 * @param {Object} coords2 - Second set of coordinates {lat, lng}
 * @returns {Number} - Distance in miles
 */
const calculateDistance = (coords1, coords2) => {
  if (!coords1 || !coords2 || !coords1.lat || !coords1.lng || !coords2.lat || !coords2.lng) {
    return Infinity; // Return infinite distance if coordinates are invalid
  }
  
  const R = 3958.8; // Earth's radius in miles
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get recommended profiles for a user
 * @param {Object} userProfile - The user's GymBros profile
 * @param {Array} candidateProfiles - Array of potential matches
 * @param {Object} options - Options for recommendation algorithm
 * @returns {Array} - Sorted array of recommended profiles
 */
export const getRecommendedProfiles = async (userProfile, candidateProfiles, options = {}) => {
  try {
    console.log(`Getting recommendations for user: ${userProfile.userId}`);
    console.log(`Found ${candidateProfiles.length} initial candidate profiles`);
    console.log(`Options:`, options);
    
    if (!userProfile || !userProfile.location) {
      logger.error('User profile is missing or has no location data');
      return [];
    }
    
    // Default options
    const defaultOptions = {
      maxDistance: 50, // Default max distance in miles
      userPreferences: null,
      filters: {}
    };
    
    // Merge options with defaults
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Apply distance filter first (most efficient filter)
    const withinDistanceCandidates = candidateProfiles.filter(profile => {
      if (!profile.location) return false;
      
      const distance = calculateDistance(userProfile.location, profile.location);
      return distance <= mergedOptions.maxDistance;
    });
    
    console.log(`${withinDistanceCandidates.length} candidates after distance filtering`);
    
    // Early return if no candidates within distance
    if (withinDistanceCandidates.length === 0) {
      return [];
    }
    
    // Calculate match scores for each candidate
    const scoredCandidates = withinDistanceCandidates.map(profile => {
      console.log(`Calculating match score between ${userProfile.userId} and ${profile.userId} `);
      
      // Calculate workout type compatibility
      const userWorkoutTypes = userProfile.workoutTypes || [];
      const candidateWorkoutTypes = profile.workoutTypes || [];
      
      // Find common workout types
      const commonWorkoutTypes = userWorkoutTypes.filter(
        type => candidateWorkoutTypes.includes(type)
      );
      
      // Calculate workout compatibility score (0-1)
      const totalWorkoutTypes = new Set([...userWorkoutTypes, ...candidateWorkoutTypes]).size;
      const workoutTypeScore = totalWorkoutTypes > 0 ? 
        commonWorkoutTypes.length / Math.max(userWorkoutTypes.length, 1) : 0;
      
      console.log(`Workout compatibility: ${commonWorkoutTypes.length} matches out of ${userWorkoutTypes.length} types = ${workoutTypeScore.toFixed(2)}`);
      
      // Calculate experience level compatibility (0-1)
      // Closer experience levels get higher scores
      const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
      const userExpIndex = experienceLevels.indexOf(userProfile.experienceLevel);
      const candidateExpIndex = experienceLevels.indexOf(profile.experienceLevel);
      
      let experienceScore = 1;
      if (userExpIndex !== -1 && candidateExpIndex !== -1) {
        // Calculate normalized distance between experience levels
        const expDistance = Math.abs(userExpIndex - candidateExpIndex) / (experienceLevels.length - 1);
        experienceScore = 1 - expDistance;
      }
      
      // Calculate schedule compatibility (0-1)
      const userTime = userProfile.preferredTime;
      const candidateTime = profile.preferredTime;
      
      // Calculate direct match for preferred time
      const scheduleScore = (userTime === candidateTime || 
                            userTime === 'Flexible' || 
                            candidateTime === 'Flexible') ? 1 : 0.5;
      
      // Calculate location score based on distance (0-1)
      const distance = calculateDistance(userProfile.location, profile.location);
      const locationScore = 1 - (distance / Math.max(mergedOptions.maxDistance, 1));
      
      // Calculate final match score (0-100)
      // Weights can be adjusted based on importance of each factor
      const weights = {
        workoutType: 0.35,
        experience: 0.20,
        schedule: 0.25,
        location: 0.20
      };
      
      const finalScore = (
        workoutTypeScore * weights.workoutType +
        experienceScore * weights.experience +
        scheduleScore * weights.schedule +
        locationScore * weights.location
      ) * 100;
      
      // Log match components for debugging
      console.log(`Match component scores for ${profile.name}: {
  workoutTypeScore: '${workoutTypeScore.toFixed(2)}',
  experienceScore: '${experienceScore.toFixed(2)}',
  scheduleScore: '${scheduleScore.toFixed(2)}',
  locationScore: '${locationScore.toFixed(2)}',
  finalScore: '${finalScore.toFixed(2)}'
}`);
      
      // Apply custom filters if provided
      let passesFilters = true;
      
      if (mergedOptions.filters) {
        // Filter by workout types if specified
        if (mergedOptions.filters.workoutTypes && mergedOptions.filters.workoutTypes.length > 0) {
          const hasMatchingWorkout = profile.workoutTypes.some(type => 
            mergedOptions.filters.workoutTypes.includes(type)
          );
          passesFilters = passesFilters && hasMatchingWorkout;
        }
        
        // Filter by experience level if specified
        if (mergedOptions.filters.experienceLevel && 
            mergedOptions.filters.experienceLevel !== 'Any') {
          passesFilters = passesFilters && 
            (profile.experienceLevel === mergedOptions.filters.experienceLevel);
        }
        
        // Filter by preferred time if specified
        if (mergedOptions.filters.preferredTime && 
            mergedOptions.filters.preferredTime !== 'Any') {
          passesFilters = passesFilters && 
            (profile.preferredTime === mergedOptions.filters.preferredTime || 
             profile.preferredTime === 'Flexible');
        }
      }
      
      return {
        profile,
        score: finalScore,
        distance,
        passesFilters
      };
    });
    
    // Now sort the candidates by score (highest first) - FIX: initialize before using
    const sortedCandidates = scoredCandidates
      .filter(candidate => candidate.passesFilters)
      .sort((a, b) => b.score - a.score);
    
    // Return just the profile objects with distance added
    return sortedCandidates.map(candidate => ({
      ...candidate.profile.toObject(),
      matchScore: Math.round(candidate.score),
      location: {
        ...candidate.profile.location,
        distance: Math.round(candidate.distance * 10) / 10 // Round to 1 decimal place
      }
    }));
  } catch (error) {
    logger.error('Error in getRecommendedProfiles:', error);
    return []; // Return empty array on error
  }
};

/**
 * Process feedback from user interaction (like/dislike)
 * @param {String} userId - ID of the user giving feedback
 * @param {String} targetId - ID of the profile receiving feedback
 * @param {String} feedbackType - Type of feedback ('like' or 'dislike')
 * @param {Number} viewDuration - How long the user viewed the profile in ms
 * @returns {Boolean} - Success status
 */
export const processFeedback = async (userId, targetId, feedbackType, viewDuration = 0) => {
  try {
    // Find or create user preferences
    let preferences = await GymBrosPreference.findOne({ userId });
    
    if (!preferences) {
      preferences = new GymBrosPreference({ userId });
    }
    
    // Update appropriate array based on feedback type
    if (feedbackType === 'like') {
      // Add to liked profiles if not already there
      if (!preferences.likedProfiles.includes(targetId)) {
        preferences.likedProfiles.push(targetId);
      }
      
      // Update metrics for the target profile
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $inc: { 'metrics.likes': 1, 'metrics.views': 1 } }
      );
    } else if (feedbackType === 'dislike') {
      // Add to disliked profiles if not already there
      if (!preferences.dislikedProfiles.includes(targetId)) {
        preferences.dislikedProfiles.push(targetId);
      }
      
      // Update metrics for the target profile
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $inc: { 'metrics.dislikes': 1, 'metrics.views': 1 } }
      );
    }
    
    // Calculate popularity score for target profile
    // This helps with future recommendations
    const targetProfile = await GymBrosProfile.findOne({ userId: targetId });
    if (targetProfile && targetProfile.metrics) {
      const { likes, dislikes, views } = targetProfile.metrics;
      
      // Calculate ratio of likes to total interactions (default to 0.5 if no interactions)
      const totalInteractions = likes + dislikes;
      const likeRatio = totalInteractions > 0 ? likes / totalInteractions : 0.5;
      
      // Calculate popularity score (50-100 scale)
      const popularityScore = 50 + (likeRatio * 50);
      
      // Update popularity score
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $set: { 'metrics.popularityScore': popularityScore } }
      );
    }
    
    // Save updated preferences
    await preferences.save();
    
    return true;
  } catch (error) {
    logger.error(`Error processing ${feedbackType} feedback:`, error);
    return false;
  }
};

/**
 * Get demographic information about the user's matches
 * Useful for analytics and improving matching algorithm
 * @param {String} userId - ID of the user
 * @returns {Object} - Match demographics statistics
 */
export const getMatchDemographics = async (userId) => {
  try {
    // Get user's preferences
    const preferences = await GymBrosPreference.findOne({ userId });
    
    if (!preferences || !preferences.likedProfiles.length) {
      return null;
    }
    
    // Get profiles of matches
    const matchedProfiles = await GymBrosProfile.find({
      userId: { $in: preferences.likedProfiles }
    });
    
    // Calculate demographics
    const demographics = {
      totalMatches: matchedProfiles.length,
      experienceLevels: {},
      workoutTypes: {},
      timePreferences: {},
      averageDistance: 0
    };
    
    // Count experience levels
    matchedProfiles.forEach(profile => {
      // Experience level counts
      const expLevel = profile.experienceLevel || 'Unknown';
      demographics.experienceLevels[expLevel] = (demographics.experienceLevels[expLevel] || 0) + 1;
      
      // Workout type counts
      (profile.workoutTypes || []).forEach(type => {
        demographics.workoutTypes[type] = (demographics.workoutTypes[type] || 0) + 1;
      });
      
      // Time preference counts
      const timePreference = profile.preferredTime || 'Unknown';
      demographics.timePreferences[timePreference] = 
        (demographics.timePreferences[timePreference] || 0) + 1;
    });
    
    return demographics;
  } catch (error) {
    logger.error('Error getting match demographics:', error);
    return null;
  }
};
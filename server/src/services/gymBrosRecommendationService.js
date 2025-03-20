// server/src/services/gymBrosRecommendationService.js
// Updated to handle guest users and profiles without userId

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
    // Determine the user identifier (userId for regular users, _id for guest users)
    const userIdentifier = userProfile.userId || userProfile._id;
    console.log(`Getting recommendations for user: ${userIdentifier}, isGuest: ${!userProfile.userId}`);
    console.log(`Found ${candidateProfiles.length} initial candidate profiles`);
    
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
      
      // Filter out the user's own profile
      const profileId = profile.userId || profile._id;
      if (profileId.toString() === userIdentifier.toString()) {
        return false;
      }
      
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
      const profileIdentifier = profile.userId || profile._id;
      console.log(`Calculating match score between ${userIdentifier} and ${profileIdentifier}`);
      
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
      
      // Apply custom filters if provided
      let passesFilters = true;
      
      if (mergedOptions.filters) {
        // Filter by workout types if specified
        if (mergedOptions.filters.workoutTypes && mergedOptions.filters.workoutTypes.length > 0) {
          const hasMatchingWorkout = profile.workoutTypes?.some(type => 
            mergedOptions.filters.workoutTypes.includes(type)
          ) || false;
          
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
    
    // Sort the candidates by score (highest first)
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
 * This function now handles both registered users and guest users
 * @param {String} userIdentifier - ID of the user or profile giving feedback
 * @param {String} targetIdentifier - ID of the profile receiving feedback
 * @param {String} feedbackType - Type of feedback ('like' or 'dislike')
 * @param {Number} viewDuration - How long the user viewed the profile in ms
 * @param {Boolean} isGuest - Whether the user is a guest or registered user
 * @returns {Boolean} - Success status
 */
export const processFeedback = async (userIdentifier, targetIdentifier, feedbackType, viewDuration = 0, isGuest = false) => {
  try {
    // First, determine if the target is a user ID or profile ID
    let targetProfileQuery = { userId: targetIdentifier };
    let targetProfile = await GymBrosProfile.findOne(targetProfileQuery);
    
    // If not found by userId, try to find by _id
    if (!targetProfile) {
      targetProfile = await GymBrosProfile.findById(targetIdentifier);
      if (targetProfile) {
        targetIdentifier = targetProfile._id;
      }
    } else {
      // Target found by userId
      targetIdentifier = targetProfile.userId;
    }
    
    if (!targetProfile) {
      logger.error(`Target profile not found for ID: ${targetIdentifier}`);
      return false;
    }
    
    // Find or create preferences document based on user type
    const prefQuery = isGuest 
      ? { profileId: userIdentifier }
      : { userId: userIdentifier };
      
    let preferences = await GymBrosPreference.findOne(prefQuery);
    
    if (!preferences) {
      preferences = new GymBrosPreference({
        ...prefQuery,
        likedProfiles: [],
        dislikedProfiles: []
      });
    }
    
    // Update appropriate array based on feedback type
    if (feedbackType === 'like') {
      // Add to liked profiles if not already there
      if (!preferences.likedProfiles.includes(targetIdentifier)) {
        preferences.likedProfiles.push(targetIdentifier);
      }
      
      // Update metrics for the target profile
      await GymBrosProfile.updateOne(
        { _id: targetProfile._id },
        { $inc: { 'metrics.likes': 1, 'metrics.views': 1 } }
      );
    } else if (feedbackType === 'dislike') {
      // Add to disliked profiles if not already there
      if (!preferences.dislikedProfiles.includes(targetIdentifier)) {
        preferences.dislikedProfiles.push(targetIdentifier);
      }
      
      // Update metrics for the target profile
      await GymBrosProfile.updateOne(
        { _id: targetProfile._id },
        { $inc: { 'metrics.dislikes': 1, 'metrics.views': 1 } }
      );
    }
    
    // Calculate popularity score for target profile
    // This helps with future recommendations
    if (targetProfile && targetProfile.metrics) {
      const { likes, dislikes, views } = targetProfile.metrics;
      
      // Calculate ratio of likes to total interactions (default to 0.5 if no interactions)
      const totalInteractions = likes + dislikes;
      const likeRatio = totalInteractions > 0 ? likes / totalInteractions : 0.5;
      
      // Calculate popularity score (50-100 scale)
      const popularityScore = 50 + (likeRatio * 50);
      
      // Update popularity score
      await GymBrosProfile.updateOne(
        { _id: targetProfile._id },
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

export const checkForMatch = async (userIdentifier, targetIdentifier, isGuest = false) => {
  try {
    // First determine if target is a user ID or profile ID
    let targetProfileQuery = { userId: targetIdentifier };
    let targetProfile = await GymBrosProfile.findOne(targetProfileQuery);
    
    // If not found by userId, try to find by _id directly
    if (!targetProfile) {
      targetProfile = await GymBrosProfile.findById(targetIdentifier);
      // Update targetIdentifier to be the profile ID
      if (targetProfile) {
        targetIdentifier = targetProfile._id;
      }
    }
    
    if (!targetProfile) {
      logger.error(`Target profile not found for ID: ${targetIdentifier}`);
      return false;
    }
    
    // Get target's preferences
    const targetPrefQuery = targetProfile.userId 
      ? { userId: targetProfile.userId }
      : { profileId: targetProfile._id };
    
    const targetPreferences = await GymBrosPreference.findOne(targetPrefQuery);
    
    if (!targetPreferences) {
      logger.warn(`No preferences found for profile: ${targetIdentifier}`);
      return false;
    }
    
    // Decide if the source identifier should be treated as profile ID or user ID
    const sourceIdentifierToCheck = isGuest ? userIdentifier : userIdentifier;
    
    // Check if the target user has liked the current user
    const hasMutualLike = targetPreferences.likedProfiles.some(id => 
      id.toString() === sourceIdentifierToCheck.toString()
    );
    
    if (hasMutualLike) {
      // It's a match! Create a match record
      const newMatch = new GymBrosMatch({
        users: [userIdentifier, targetIdentifier],
        createdAt: new Date(),
        active: true
      });
      
      await newMatch.save();
      
      // Update match count for source profile
      const sourceProfile = isGuest 
        ? await GymBrosProfile.findById(userIdentifier)
        : await GymBrosProfile.findOne({ userId: userIdentifier });
      
      if (sourceProfile) {
        await GymBrosProfile.updateOne(
          { _id: sourceProfile._id },
          { $inc: { 'metrics.matches': 1 } }
        );
      }
      
      // Update match count for target profile
      await GymBrosProfile.updateOne(
        { _id: targetProfile._id },
        { $inc: { 'metrics.matches': 1 } }
      );
      
      // Return true to indicate a match was created
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking for match:', error);
    return false;
  }
};
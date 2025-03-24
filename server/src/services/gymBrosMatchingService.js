// gymBrosMatchingService.js - Consolidated matching service

import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosPreference from '../models/GymBrosPreference.js';
import GymBrosMatch from '../models/GymBrosMatch.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

export const getRecommendedProfiles = async (userProfile, filters = {}) => {
  try {
    if (!userProfile || !userProfile.location) {
      logger.error('Invalid user profile or missing location data');
      return [];
    }
    
    // Get all possible user identifiers
    const userIdentifiers = getUserIdentifiers(userProfile);
    logger.info(`Getting recommendations for user: ${userIdentifiers.join(', ')}`);
    
    console.log('User profile filters:', filters);
    // Get user's preferences
    const prefQuery = userProfile.userId 
      ? { userId: userProfile.userId }
      : { profileId: userProfile._id };
    
    const userPrefs = await GymBrosPreference.findOne(prefQuery);
    
    // Build exclusion list - profiles already interacted with
    const excludedIds = [...userIdentifiers]; // Start with user's own IDs
    
    // Add liked and disliked profiles
    if (userPrefs) {
      if (userPrefs.likedProfiles && Array.isArray(userPrefs.likedProfiles)) {
        const likedIds = userPrefs.likedProfiles.map(id => id.toString());
        excludedIds.push(...likedIds);
      }
      if (userPrefs.dislikedProfiles && Array.isArray(userPrefs.dislikedProfiles)) {
        const dislikedIds = userPrefs.dislikedProfiles.map(id => id.toString());
        excludedIds.push(...dislikedIds);
      }
    }
    
    logger.info(`Excluded ${excludedIds.length} profiles from recommendations`);
    
    // Get users who have already liked this user - CRITICAL FEATURE
    const potentialMatches = await findPotentialMatches(userIdentifiers);
    logger.info(`Found ${potentialMatches.length} users who already liked this user`);
    
    // Apply max distance filter (if provided)
    const maxDistance = filters.maxDistance || 50;
    
    // Build query for candidate profiles with improved exclusion logic
    const query = {
      $and: [
        {
          $nor: [
            { userId: { $in: excludedIds } },
            { _id: { $in: excludedIds } }
          ]
        },
        // Ensure profile has location data
        { 'location.lat': { $exists: true } },
        { 'location.lng': { $exists: true } },
      ]
    };
    
    
    // Apply workout type filter only if it's defined and has elements
    if (filters.workoutTypes && Array.isArray(filters.workoutTypes) && filters.workoutTypes.length > 0) {
      query.workoutTypes = { $in: filters.workoutTypes };
    }
    
    // Apply experience level filter only if it's defined and not 'Any'
    if (filters.experienceLevel && 
        typeof filters.experienceLevel === 'string' &&
        filters.experienceLevel.toLowerCase() !== 'any') {
      query.experienceLevel = filters.experienceLevel;
    }
    
    // Apply preferred time filter only if it's defined and not 'Any'
    if (filters.preferredTime && 
        typeof filters.preferredTime === 'string' &&
        filters.preferredTime.toLowerCase() !== 'any') {
      query.preferredTime = filters.preferredTime;
    }
    
    // Apply gender filter only if it's defined and not 'All'
    // FIXED: Added type check and convert to lowercase only if it's a string
    if (filters.genderPreference && 
        typeof filters.genderPreference === 'string' &&
        filters.genderPreference.toLowerCase() !== 'all') {
      query.gender = filters.genderPreference;
    }
    
    // Apply age filter only if ageRange is defined
    if (filters.ageRange) {
      const { min, max } = filters.ageRange;
      
      if (min !== undefined && min !== null) {
        query.age = { $gte: parseInt(min, 10) };
      }
      
      if (max !== undefined && max !== null) {
        query.age = { ...(query.age || {}), $lte: parseInt(max, 10) };
      }
    }
    
    console.log('Query for candidate profiles:', JSON.stringify(query));
    
    // Find potential candidates
    const candidateProfiles = await GymBrosProfile.find(query).limit(100);
    
    logger.info(`Found ${candidateProfiles.length} candidate profiles`);
    
    if (candidateProfiles.length === 0) {
      return [];
    }
    
    // Calculate scored matches and filter by distance
    const scoredCandidates = [];
    
    for (const candidate of candidateProfiles) {
      // First check distance to avoid unnecessary calculations
      const distance = calculateDistance(
        userProfile.location.lat,
        userProfile.location.lng,
        candidate.location.lat,
        candidate.location.lng
      );
      
      // Skip if too far away
      if (distance > maxDistance) {
        continue;
      }
      
      // Calculate match score with potential match boost
      const candidateId = candidate.userId || candidate._id;
      const hasPotentialMatch = potentialMatches.includes(candidateId.toString());
      
      // Calculate full match score - pass potential match status to influence score
      const score = calculateMatchScore(userProfile, candidate, hasPotentialMatch);
      
      scoredCandidates.push({
        profile: candidate,
        score,
        distance,
        potentialMatch: hasPotentialMatch
      });
    }
    
    // Sort by potential matches first, then by match score
    const sortedCandidates = scoredCandidates.sort((a, b) => {
      // Prioritize mutual likes first
      if (a.potentialMatch && !b.potentialMatch) return -1;
      if (!a.potentialMatch && b.potentialMatch) return 1;
      
      // Then sort by match score
      return b.score - a.score;
    });
    
    // Format for API response
    return sortedCandidates.map(candidate => {
      const profile = candidate.profile.toObject();
      return {
        ...profile,
        matchScore: Math.round(candidate.score),
        location: {
          ...profile.location,
          distance: Math.round(candidate.distance * 10) / 10 // Round to 1 decimal
        },
        potentialMatch: candidate.potentialMatch // Include flag for UI indication
      };
    });
  } catch (error) {
    logger.error('Error in getRecommendedProfiles:', error);
    return [];
  }
};

export const calculateMatchScore = (userProfile, candidateProfile, hasPotentialMatch = false) => {
  try {
    const userId = userProfile.userId || userProfile._id;
    const candidateId = candidateProfile.userId || candidateProfile._id;
    
    logger.info(`Calculating match score between ${userId} and ${candidateId}`);
    
    // Initialize base score
    let score = 0;
    let weightSum = 0;
    
    // 1. Workout Type Compatibility (weight: 30)
    const workoutTypeScore = calculateWorkoutTypeCompatibility(
      userProfile.workoutTypes || [],
      candidateProfile.workoutTypes || []
    );
    score += workoutTypeScore * 10;
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
    score += scheduleScore * 10;
    weightSum += 25;
    
    // 4. Location Proximity (weight: 25)
    const locationScore = calculateLocationScore(
      userProfile.location,
      candidateProfile.location
    );
    score += locationScore * 60;
    weightSum += 25;
    
    // Calculate base match score (0-100)
    let finalScore = (score / weightSum) * 100;
    
    // CRITICAL ENHANCEMENT: Add boost for potential matches
    if (hasPotentialMatch) {
      // Add 20% boost to score for profiles that already liked this user (max 100)
      finalScore = Math.min(100, finalScore * 1.2);
      logger.info(`Added 20% boost to match score for profile that already liked this user`);
    }
    
    // Log component scores for debugging
    const candidateName = candidateProfile.name || 'Unknown';
    logger.info(`Match component scores for ${candidateName}:`, {
      workoutTypeScore: workoutTypeScore.toFixed(2),
      experienceScore: experienceScore.toFixed(2),
      scheduleScore: scheduleScore.toFixed(2),
      locationScore: locationScore.toFixed(2),
      potentialMatch: hasPotentialMatch,
      finalScore: finalScore.toFixed(2)
    });
    
    return finalScore;
  } catch (error) {
    logger.error('Error calculating match score:', error);
    return 50; // Default medium score on error
  }
};

export const calculateWorkoutTypeCompatibility = (userWorkouts, candidateWorkouts) => {
  try {
    if (!userWorkouts || !candidateWorkouts || !Array.isArray(userWorkouts) || !Array.isArray(candidateWorkouts)) {
      logger.warn('Invalid workout types in compatibility calculation');
      return 0;
    }
    
    if (!userWorkouts.length || !candidateWorkouts.length) return 0;
    
    // Count matching workout types
    const matchingWorkouts = userWorkouts.filter(type => 
      candidateWorkouts.includes(type)
    );
    
    // Calculate Jaccard similarity: intersection / union
    const union = new Set([...userWorkouts, ...candidateWorkouts]);
    
    const score = matchingWorkouts.length / Math.max(userWorkouts.length, 1);
    logger.info(`Workout compatibility: ${matchingWorkouts.length} matches out of ${union.size} types = ${score.toFixed(2)}`);
    return score;
  } catch (error) {
    logger.error('Error calculating workout compatibility:', error);
    return 0;
  }
};

export const calculateExperienceCompatibility = (userLevel, candidateLevel) => {
  try {
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    
    // Handle missing data gracefully
    if (!userLevel || !candidateLevel) {
      logger.warn('Missing experience levels:', { userLevel, candidateLevel });
      return 0.5; // Return neutral score when data is missing
    }
    
    // If identical experience level, perfect match
    if (userLevel === candidateLevel) return 1;
    
    // Calculate distance between experience levels
    const userIndex = levels.indexOf(userLevel);
    const candidateIndex = levels.indexOf(candidateLevel);
    
    // Handle invalid experience levels
    if (userIndex === -1 || candidateIndex === -1) {
      logger.warn('Invalid experience levels:', { userLevel, candidateLevel });
      return 0.5;
    }
    
    const levelDistance = Math.abs(userIndex - candidateIndex);
    
    // Normalize to 0-1 (closer experience levels are better matches)
    return 1 - (levelDistance / (levels.length - 1));
  } catch (error) {
    logger.error('Error calculating experience compatibility:', error);
    return 0.5;
  }
};

export const calculateScheduleCompatibility = (userTime, candidateTime) => {
  try {
    // If either prefers "Flexible" or times match exactly, perfect score
    if (userTime === 'Flexible' || candidateTime === 'Flexible' || userTime === candidateTime) {
      return 1;
    }
    
    // Time period groupings
    const dayPeriods = ['Morning', 'Afternoon'];
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
  } catch (error) {
    logger.error('Error calculating schedule compatibility:', error);
    return 0.5;
  }
};

export const calculateLocationScore = (userLocation, candidateLocation) => {
  try {
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
  } catch (error) {
    logger.error('Error calculating location score:', error);
    return 0;
  }
};

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  try {
    // Validate coordinates to prevent NaN results
    if (!isValidCoordinate(lat1) || !isValidCoordinate(lng1) || 
        !isValidCoordinate(lat2) || !isValidCoordinate(lng2)) {
      
      // Log the invalid coordinates for debugging
      logger.warn('Invalid coordinates in distance calculation:', { lat1, lng1, lat2, lng2 });
      
      // Return a large distance for invalid coordinates
      return 999;
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

const isValidCoordinate = (coord) => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Helper function to get all possible identifiers for a user
const getUserIdentifiers = (user) => {
  const identifiers = [];
  
  if (user.userId) identifiers.push(user.userId.toString());
  if (user._id) identifiers.push(user._id.toString());
  
  return identifiers;
};

// Updated processFeedback function with improved interaction handling
export const processFeedback = async (userId, targetId, feedbackType, viewDuration = 0, isGuest = false) => {
  try {
    logger.info(`Processing ${feedbackType} from ${userId} to ${targetId} (duration: ${viewDuration}ms, isGuest: ${isGuest})`);

    // Find target profile to ensure it exists
    let targetProfile;
    
    // Try to find by _id first
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetProfile = await GymBrosProfile.findById(targetId);
    }
    
    // If not found, try by userId
    if (!targetProfile) {
      targetProfile = await GymBrosProfile.findOne({ userId: targetId });
    }
    
    if (!targetProfile) {
      logger.error(`Target profile not found for ID: ${targetId}`);
      return false;
    }
    
    // Find the source profile (or verify it exists)
    let sourceProfile;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      sourceProfile = await GymBrosProfile.findById(userId);
    }
    
    if (!sourceProfile && !isGuest) {
      sourceProfile = await GymBrosProfile.findOne({ userId });
    }
    
    if (!sourceProfile && !isGuest) {
      logger.error(`Source profile not found for ID: ${userId}`);
      return false;
    }
    
    // Build query for finding preferences
    // CRITICAL: For guest users, NEVER use userId; use profileId and explicitly set the guest flag
    let prefQuery;
    
    if (isGuest) {
      // For guest users, always use profileId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.error('Invalid profile ID for guest user:', userId);
        return false;
      }
      prefQuery = { profileId: userId };
    } else {
      // For regular users, we have more options
      if (sourceProfile) {
        // If we found their profile, use the _id as the profileId
        prefQuery = { userId };
      } else {
        // If we couldn't find the profile but they're still a valid user
        prefQuery = { userId };
      }
    }
    
    logger.info(`Using preference query: ${JSON.stringify(prefQuery)}`);
    
    // First, try to find existing preferences - don't use upsert yet
    let preferences = await GymBrosPreference.findOne(prefQuery);
    
    // Build document for new preferences if needed
    const newPrefsData = {
      ...prefQuery,
      likedProfiles: [],
      dislikedProfiles: []
    };
    
    // If this is a new profile and we're copying default preferences,
    // make sure to normalize any enum values to lowercase
    if (!preferences) {
      // This fixes the capitalization issue with genderPreference
      if (newPrefsData.genderPreference && typeof newPrefsData.genderPreference === 'string') {
        newPrefsData.genderPreference = newPrefsData.genderPreference.toLowerCase();
      }
    }
    
    // If preferences exist, update them
    if (preferences) {
      logger.info(`Found existing preferences for query: ${JSON.stringify(prefQuery)}`);
      
      // Check if this profile is already in the appropriate list
      const targetIdStr = targetProfile._id.toString();
      const alreadyInList = preferences[feedbackType === 'like' ? 'likedProfiles' : 'dislikedProfiles']
        .some(id => id.toString() === targetIdStr);
      
      if (!alreadyInList) {
        // Add to the appropriate list only if not already present
        preferences[feedbackType === 'like' ? 'likedProfiles' : 'dislikedProfiles'].push(targetProfile._id);
        
        // Remove from opposite list if present
        const oppositeList = feedbackType === 'like' ? 'dislikedProfiles' : 'likedProfiles';
        preferences[oppositeList] = preferences[oppositeList].filter(id => 
          id.toString() !== targetIdStr
        );
        
        // Save with error handling
        try {
          await preferences.save();
          logger.info(`Successfully saved ${feedbackType} interaction`);
        } catch (saveError) {
          // Handle specific validation errors
          if (saveError.name === 'ValidationError') {
            // Fix common issues
            if (saveError.errors.genderPreference) {
              logger.info('Fixing genderPreference capitalization issue');
              preferences.genderPreference = preferences.genderPreference.toLowerCase();
              await preferences.save();
            } else {
              throw saveError;
            }
          } else {
            throw saveError;
          }
        }
      } else {
        logger.info(`Profile ${targetIdStr} is already in ${feedbackType} list, skipping update`);
      }
    } else {
      // If no preferences exist, create new ones with the correct identifier
      // IMPORTANT: Set arrays to avoid null errors
      newPrefsData.likedProfiles = feedbackType === 'like' ? [targetProfile._id] : [];
      newPrefsData.dislikedProfiles = feedbackType === 'dislike' ? [targetProfile._id] : [];
      
      // Ensure genderPreference is lowercase if present
      if (newPrefsData.genderPreference && typeof newPrefsData.genderPreference === 'string') {
        newPrefsData.genderPreference = newPrefsData.genderPreference.toLowerCase();
      }
      
      try {
        const newPrefs = new GymBrosPreference(newPrefsData);
        await newPrefs.save();
        logger.info(`Created new preferences for ${JSON.stringify(prefQuery)}`);
      } catch (createError) {
        logger.error('Error creating preferences:', createError);
        
        // If it's a validation error, try to fix common issues
        if (createError.name === 'ValidationError') {
          if (createError.errors.genderPreference) {
            logger.info('Fixing genderPreference validation issue');
            
            // Skip setting genderPreference entirely
            delete newPrefsData.genderPreference;
            
            const fixedPrefs = new GymBrosPreference(newPrefsData);
            await fixedPrefs.save();
            logger.info('Successfully created preferences without genderPreference');
          } else {
            throw createError;
          }
        } else if (createError.code === 11000) {
          // Direct update to handle duplicate key issues
          logger.warn('Duplicate key error, using direct update');
          
          const updateOperation = feedbackType === 'like' 
            ? { $addToSet: { likedProfiles: targetProfile._id }, $pull: { dislikedProfiles: targetProfile._id } }
            : { $addToSet: { dislikedProfiles: targetProfile._id }, $pull: { likedProfiles: targetProfile._id } };
            
          const updateResult = await GymBrosPreference.updateOne(prefQuery, updateOperation);
          logger.info(`Update result: ${JSON.stringify(updateResult)}`);
        } else {
          throw createError;
        }
      }
    }
    
    // Update metrics for the target profile
    await GymBrosProfile.updateOne(
      { _id: targetProfile._id },
      { 
        $inc: feedbackType === 'like' 
          ? { 'metrics.likes': 1, 'metrics.views': 1 } 
          : { 'metrics.dislikes': 1, 'metrics.views': 1 } 
      }
    );
    
    // Update popularity score
    await updateProfilePopularityScore(targetProfile._id);
    
    // Check for match if this was a like
    if (feedbackType === 'like') {
      const isMatch = await checkForMatch(userId, targetId, isGuest);
      if (isMatch) {
        logger.info(`Match created between ${userId} and ${targetId}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error processing ${feedbackType} feedback:`, error);
    return false;
  }
};

// Helper function to update popularity score
async function updateProfilePopularityScore(profileId) {
  try {
    const profile = await GymBrosProfile.findById(profileId);
    if (!profile || !profile.metrics) return;
    
    const likes = profile.metrics.likes || 0;
    const dislikes = profile.metrics.dislikes || 0;
    const totalInteractions = likes + dislikes;
    
    // Calculate ratio (default to 0.5 if no interactions)
    const likeRatio = totalInteractions > 0 ? likes / totalInteractions : 0.5;
    const popularityScore = 50 + (likeRatio * 50); // Scale to 50-100
    
    await GymBrosProfile.updateOne(
      { _id: profileId },
      { $set: { 'metrics.popularityScore': popularityScore } }
    );
  } catch (error) {
    logger.error(`Error updating popularity score for ${profileId}:`, error);
  }
}


export const checkForMatch = async (userId, targetId, isGuest = false) => {
  try {
    // Find both profiles
    let sourceProfile, targetProfile;
    
    // Find source profile
    if (mongoose.Types.ObjectId.isValid(userId)) {
      sourceProfile = await GymBrosProfile.findById(userId);
    } else if (!isGuest) {
      sourceProfile = await GymBrosProfile.findOne({ userId });
    }
    
    // For guest users, we need to have a valid profileId
    if (isGuest && !sourceProfile) {
      logger.error(`Cannot find source profile for guest with ID: ${userId}`);
      return false;
    }
    
    // Find target profile
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      targetProfile = await GymBrosProfile.findById(targetId);
    } else {
      targetProfile = await GymBrosProfile.findOne({ userId: targetId });
    }
    
    if (!targetProfile) {
      logger.error(`Target profile not found: ${targetId}`);
      return false;
    }
    
    // Get target's preferences - first determine how to query
    let targetPrefQuery;
    
    // If target ID is an ObjectId, it's likely a profileId
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      // Check if this is a profile ID directly
      const isDirectProfile = await GymBrosProfile.findById(targetId);
      if (isDirectProfile) {
        targetPrefQuery = { profileId: targetId };
        
        // Also try by userId if the profile has one
        if (isDirectProfile.userId) {
          const userPref = await GymBrosPreference.findOne({ userId: isDirectProfile.userId });
          if (userPref) {
            targetPrefQuery = { userId: isDirectProfile.userId };
          }
        }
      } else {
        // It might be a userId
        targetPrefQuery = { userId: targetId };
      }
    } else {
      // Not an ObjectId, must be a userId
      targetPrefQuery = { userId: targetId };
    }
    
    // Query for the preferences
    const targetPreferences = await GymBrosPreference.findOne(targetPrefQuery);
    
    if (!targetPreferences || !targetPreferences.likedProfiles || targetPreferences.likedProfiles.length === 0) {
      return false;
    }
    
    // Check if the target has liked the source user
    // We need to check all possible IDs
    const userIds = [userId];
    
    // Add source profile ID if available
    if (sourceProfile) {
      userIds.push(sourceProfile._id.toString());
      
      // Also add userId if available
      if (sourceProfile.userId) {
        userIds.push(sourceProfile.userId.toString());
      }
    }
    
    // Check if any of the source user's IDs are in the target's liked profiles
    const hasMutualLike = targetPreferences.likedProfiles.some(likedId => {
      const likedIdStr = likedId.toString();
      return userIds.includes(likedIdStr);
    });
    
    if (hasMutualLike) {
      logger.info(`Found mutual like between ${userId} and ${targetId}`);
      
      // Identify the correct IDs to use for the match
      const sourceId = sourceProfile ? sourceProfile._id : userId;
      const targetProfileId = targetProfile._id; // Fix: Renamed to avoid collision
      
      // Check if match already exists
      const existingMatch = await GymBrosMatch.findOne({
        users: { $all: [sourceId, targetProfileId] } // Fix: Use the renamed variable
      });
      
      if (existingMatch) {
        logger.info(`Match already exists between ${userId} and ${targetId}`);
        return true;
      }
      
      // Create a new match
      const newMatch = new GymBrosMatch({
        users: [sourceId, targetProfileId], // Fix: Use the renamed variable
        createdAt: new Date(),
        active: true
      });
      
      await newMatch.save();
      
      // Update match metrics
      if (sourceProfile) {
        await GymBrosProfile.updateOne(
          { _id: sourceProfile._id },
          { $inc: { 'metrics.matches': 1 } }
        );
      }
      
      await GymBrosProfile.updateOne(
        { _id: targetProfile._id },
        { $inc: { 'metrics.matches': 1 } }
      );
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking for match:', error);
    return false;
  }
};

export const findPotentialMatches = async (userIdentifiers) => {
  try {
    // Find all preferences that include any of user's identifiers in likedProfiles
    const usersWhoLikedCurrent = await GymBrosPreference.find({
      likedProfiles: { $in: userIdentifiers }
    });
    
    logger.info(`Found ${usersWhoLikedCurrent.length} users who have already liked user ${userIdentifiers[0]}`);
    
    // Extract the user IDs
    return usersWhoLikedCurrent.map(pref => 
      (pref.userId || pref.profileId).toString()
    );
  } catch (error) {
    logger.error(`Error finding potential matches for ${userIdentifiers[0]}:`, error);
    return [];
  }
};


// Export all functions for use in controllers
export default {
  getRecommendedProfiles,
  calculateMatchScore,
  calculateDistance,
  processFeedback,
  checkForMatch,
  findPotentialMatches
};
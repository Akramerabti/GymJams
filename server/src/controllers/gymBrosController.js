import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosPreference from '../models/GymBrosPreference.js';
import GymBrosMatch from '../models/GymBrosMatch.js';
import User from '../models/User.js';
import { getRecommendedProfiles } from '../services/gymBrosRecommendationService.js';
import { processFeedback } from '../services/gymBrosFeedbackService.js';
import { handleError } from '../middleware/error.middleware.js';

// Check if user has a GymBros profile
export const checkGymBrosProfile = async (req, res) => {
  try {
    const { userId } = req.query; // Extract userId from query parameters
    console.log('Checking profile for user:', userId); // Debugging log

    const profile = await GymBrosProfile.findOne({ userId });

    console.log('Profile found:', profile); // Debugging log

    if (profile) {
      return res.json({ hasProfile: true, profile });
    } else {
      return res.json({ hasProfile: false, profile: null });
    }
  } catch (error) {
    console.error('Error in checkGymBrosProfile:', error); // Debugging log
    handleError(res, error);
  }
};

  export const createOrUpdateGymBrosProfile = async (req, res) => {
    try {
      const profileData = req.body;
      const { userId } = profileData.userId;
    
      console.log('Creating or updating profile for user:', userId); // Debugging log
      console.log('Profile data:', profileData); // Debugging log
  
      // Validate profile data
      if (!profileData || typeof profileData !== 'object') {
        return res.status(400).json({ message: 'Invalid profile data' });
      }
  
      let profile = await GymBrosProfile.findOne({ userId });
  
      if (profile) {
        // Update existing profile
        profile = await GymBrosProfile.findByIdAndUpdate(profile._id, profileData, { new: true });
      } else {
        // Create new profile
        profile = new GymBrosProfile({ userId, ...profileData });
        await profile.save();
      }
  
      res.status(201).json(profile);
    } catch (error) {
      console.error('Error in createOrUpdateGymBrosProfile:', error); // Debugging log
      handleError(error, req, res);
    }
  };

// Get recommended profiles for the user
export const getGymBrosProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's profile
    const userProfile = await GymBrosProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(400).json({ message: "User profile not found" });
    }
    
    // Get user's preferences
    const userPreferences = await GymBrosPreference.findOne({ userId }) || 
      new GymBrosPreference({ userId });
    
    // Get all candidate profiles (excluding already liked/disliked and the user)
    const excludedProfiles = [
      userId,
      ...userPreferences.likedProfiles || [],
      ...userPreferences.dislikedProfiles || []
    ];
    
    const candidateProfiles = await GymBrosProfile.find({
      userId: { $nin: excludedProfiles }
    });
    
    // Apply fitness and experience level filters if provided
    const { workoutTypes, experienceLevel, preferredTime, maxDistance } = req.query;
    
    // Build recommendation options
    const recommendationOptions = {
      maxDistance: maxDistance ? parseInt(maxDistance, 10) : 50,
      userPreferences,
      filters: {
        workoutTypes: workoutTypes ? workoutTypes.split(',') : undefined,
        experienceLevel: experienceLevel || undefined,
        preferredTime: preferredTime || undefined
      }
    };
    
    // Get recommended profiles
    const recommendations = await getRecommendedProfiles(
      userProfile, 
      candidateProfiles,
      recommendationOptions
    );
    
    // Return recommended profiles
    res.json(recommendations);
    
  } catch (error) {
    handleError(res, error);
  }
};

// Like a GymBros profile
export const likeGymBrosProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user.id;
    const viewDuration = req.body.viewDuration || 0;
    
    // Process the like interaction
    const result = await processFeedback(userId, profileId, 'like', viewDuration);
    
    // Check if this created a match
    const isMatch = await checkForMatch(userId, profileId);
    
    res.json({ success: result, match: isMatch });
  } catch (error) {
    handleError(res, error);
  }
};

// Dislike a GymBros profile
export const dislikeGymBrosProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user.id;
    const viewDuration = req.body.viewDuration || 0;
    
    // Process the dislike interaction
    const result = await processFeedback(userId, profileId, 'dislike', viewDuration);
    
    res.json({ success: result });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user matches
export const getGymBrosMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all matches where this user is a participant
    const matches = await GymBrosMatch.find({
      users: userId,
      active: true
    });
    
    // Get the matched user IDs (excluding current user)
    const matchedUserIds = matches.map(match => 
      match.users.find(id => id !== userId)
    );
    
    // Get profiles for matched users
    const matchedProfiles = await GymBrosProfile.find({
      userId: { $in: matchedUserIds }
    });
    
    res.json(matchedProfiles);
  } catch (error) {
    handleError(res, error);
  }
};
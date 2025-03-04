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
    const userId = req.user.id;
    console.log('Checking profile for user:', userId); 

    const profile = await GymBrosProfile.findOne({ userId });

    console.log('Profile found:', profile); 

    if (profile) {
      return res.json({ hasProfile: true, profile });
    } else {
      return res.json({ hasProfile: false, profile: null });
    }
  } catch (error) {
    console.error('Error in checkGymBrosProfile:', error); 
    handleError(error, req, res);
  }
};

// Create or update a user's GymBros profile
export const createOrUpdateGymBrosProfile = async (req, res) => {
  try {
    const profileData = req.body;
    const userId = req.user.id;
  
    console.log('Creating or updating profile for user:', userId);
    console.log('Profile data:', profileData);

    // Validate profile data
    if (!profileData || typeof profileData !== 'object') {
      return res.status(400).json({ message: 'Invalid profile data' });
    }

    let profile = await GymBrosProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile = await GymBrosProfile.findByIdAndUpdate(
        profile._id, 
        { ...profileData, userId }, 
        { new: true }
      );
    } else {
      // Create new profile
      profile = new GymBrosProfile({ ...profileData, userId });
      await profile.save();
    }

    res.status(201).json(profile);
  } catch (error) {
    console.error('Error in createOrUpdateGymBrosProfile:', error);
    handleError(error, req, res);
  }
};

// Get recommended profiles for the user
export const getGymBrosProfiles = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's profile
    const userProfile = await GymBrosProfile.findOne({ userId });
    if (!userProfile) {
      throw { status: 404, message: "User profile not found" };
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

    // Apply filters if provided
    const { workoutTypes, experienceLevel, preferredTime, maxDistance } = req.query;

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

    res.json(recommendations);
  } catch (error) {
    // Ensure the error is properly formatted before passing it to handleError
    if (!error.status) {
      error.status = 500;
    }
    next(error);
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
    handleError(error, req, res);
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
    handleError(error, req, res);
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
    handleError(error, req, res);
  }
};

// Update user preferences for GymBros
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    console.log('Updating preferences for user:', userId);
    console.log('New preferences:', preferences);

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Invalid preferences data' });
    }

    // Find or create the user's preferences
    let userPreferences = await GymBrosPreference.findOne({ userId });

    if (userPreferences) {
      // Update existing preferences
      userPreferences = await GymBrosPreference.findByIdAndUpdate(
        userPreferences._id,
        preferences,
        { new: true }
      );
    } else {
      // Create new preferences
      userPreferences = new GymBrosPreference({ userId, ...preferences });
      await userPreferences.save();
    }

    // Return updated preferences
    res.status(200).json(userPreferences);
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    handleError(error, req, res);
  }
};

// Get user settings for GymBros
export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching settings for user:', userId);

    // Find user preferences or return default settings
    let preferences = await GymBrosPreference.findOne({ userId });

    if (!preferences) {
      // Return default settings if none found
      return res.json({
        maxDistance: 50,
        ageRange: { min: 18, max: 60 },
        showMe: true,
        notifications: {
          matches: true,
          messages: true,
          profileUpdates: true,
        },
        privacy: {
          showWorkoutTypes: true,
          showExperienceLevel: true,
          showGoals: true,
          profileVisibility: 'everyone',
        }
      });
    }

    // Extract settings from preferences
    const settings = {
      maxDistance: preferences.maxDistance,
      ageRange: preferences.ageRange,
      showMe: preferences.settings?.showMe,
      notifications: preferences.settings?.notifications || {
        matches: true,
        messages: true,
        profileUpdates: true
      },
      privacy: preferences.settings?.privacy || {
        showWorkoutTypes: true,
        showExperienceLevel: true,
        showGoals: true,
        profileVisibility: 'everyone'
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    handleError(error, req, res);
  }
};

// Update user settings for GymBros
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;

    console.log('Updating settings for user:', userId);
    console.log('New settings:', settingsData);

    // Validate settings data
    if (!settingsData || typeof settingsData !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    // Extract settings fields
    const {
      maxDistance,
      ageRange,
      showMe,
      notifications,
      privacy
    } = settingsData;

    // Find or create user preferences
    let preferences = await GymBrosPreference.findOne({ userId });
    
    const updateData = {};
    
    // Update only the provided fields
    if (maxDistance !== undefined) updateData.maxDistance = maxDistance;
    if (ageRange !== undefined) updateData.ageRange = ageRange;
    
    // Build settings object
    updateData.settings = {};
    if (showMe !== undefined) updateData.settings.showMe = showMe;
    if (notifications) updateData.settings.notifications = notifications;
    if (privacy) updateData.settings.privacy = privacy;

    if (preferences) {
      // Update existing preferences
      preferences = await GymBrosPreference.findByIdAndUpdate(
        preferences._id,
        { $set: updateData },
        { new: true }
      );
    } else {
      // Create new preferences document
      preferences = new GymBrosPreference({ 
        userId,
        ...updateData
      });
      await preferences.save();
    }

    // Extract settings for response
    const responseSettings = {
      maxDistance: preferences.maxDistance,
      ageRange: preferences.ageRange,
      showMe: preferences.settings?.showMe,
      notifications: preferences.settings?.notifications,
      privacy: preferences.settings?.privacy
    };

    // Return updated settings
    res.status(200).json(responseSettings);
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    handleError(error, req, res);
  }
};

// Delete user's GymBros profile
export const deleteGymBrosProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Deleting GymBros profile for user:', userId);

    // Delete the profile
    const deleteResult = await GymBrosProfile.findOneAndDelete({ userId });
    
    if (!deleteResult) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Also delete related data
    await GymBrosPreference.findOneAndDelete({ userId });
    
    // Remove this user from active matches
    await GymBrosMatch.updateMany(
      { users: userId },
      { $set: { active: false } }
    );

    res.status(200).json({ message: 'Profile and related data deleted successfully' });
  } catch (error) {
    console.error('Error in deleteGymBrosProfile:', error);
    handleError(error, req, res);
  }
};

// Internal function to check for a match
const checkForMatch = async (userId, targetId) => {
  // Check if the target user has liked the current user
  const targetPreferences = await GymBrosPreference.findOne({ userId: targetId });
  
  if (targetPreferences && targetPreferences.likedProfiles.includes(userId)) {
    // It's a match! Create a match record
    const newMatch = new GymBrosMatch({
      users: [userId, targetId],
      createdAt: new Date(),
      active: true
    });
    
    await newMatch.save();
    
    // Update match count for both profiles
    await GymBrosProfile.updateOne(
      { userId },
      { $inc: { 'metrics.matches': 1 } }
    );
    
    await GymBrosProfile.updateOne(
      { userId: targetId },
      { $inc: { 'metrics.matches': 1 } }
    );
    
    // Return true to indicate a match was created
    return true;
  }
  
  return false;
};

// Get user preferences for GymBros
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching preferences for user:', userId);

    // Find user preferences or return default settings
    let preferences = await GymBrosPreference.findOne({ userId });

    if (!preferences) {
      // Return default preferences if none found
      return res.json({
        workoutTypes: [],
        experienceLevel: 'Any',
        preferredTime: 'Any',
        genderPreference: 'All',
        ageRange: { min: 18, max: 99 },
        maxDistance: 50
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    handleError(error, req, res);
  }
};
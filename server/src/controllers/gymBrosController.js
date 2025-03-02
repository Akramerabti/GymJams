import GymBrosProfile from '../models/GymBrosProfile.js';
import User from '../models/User.js';
import { handleError } from '../middleware/error.middleware.js';

// Check if user has a GymBros profile
export const checkGymBrosProfile = async (req, res) => {
    try {
      const { userId } = req.user;
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

// Get all GymBros profiles (excluding the current user)
export const getGymBrosProfiles = async (req, res) => {
  try {
    const { userId } = req.user;
    const profiles = await GymBrosProfile.find({ userId: { $ne: userId } });
    res.json(profiles);
  } catch (error) {
    handleError(res, error);
  }
};

// Like a GymBros profile
export const likeGymBrosProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { userId } = req.user;

    // Check if the other user has already liked the current user
    const existingMatch = await Match.findOne({
      $or: [
        { user1: userId, user2: profileId },
        { user1: profileId, user2: userId },
      ],
    });

    if (existingMatch) {
      // It's a match!
      return res.json({ match: true, matchId: existingMatch._id });
    }

    // Create a new like
    const match = new Match({ user1: userId, user2: profileId });
    await match.save();

    res.json({ match: false });
  } catch (error) {
    handleError(res, error);
  }
};

// Dislike a GymBros profile
export const dislikeGymBrosProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { userId } = req.user;

    // Remove any existing like
    await Match.deleteOne({ user1: userId, user2: profileId });

    res.json({ message: 'Profile disliked' });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user matches
export const getGymBrosMatches = async (req, res) => {
    try {
      const { userId } = req.user;
      const matches = await Match.find({
        $or: [{ user1: userId }, { user2: userId }],
      }).populate('user1 user2');
  
      res.json(matches);
    } catch (error) {
      handleError(res, error); // This is where the error occurs
    }
  };
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosPreference from '../models/GymBrosPreference.js';
import GymBrosMatch from '../models/GymBrosMatch.js';
import PhoneVerification from '../models/PhoneVerification.js';
import User from '../models/User.js';
import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getRecommendedProfiles, processFeedback, checkForMatch } from '../services/gymBrosRecommendationService.js';
import { handleError } from '../middleware/error.middleware.js';
import twilio from 'twilio';
import logger from '../utils/logger.js';


export const checkGymBrosProfile = async (req, res) => {
  try {
    // Get effective user (either authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Handle authenticated user
    if (effectiveUser.userId) {
      console.log('Checking profile for authenticated user:', effectiveUser.userId);
      
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      console.log('Profile found:', profile);
      
      if (profile) {
        return res.json({ hasProfile: true, profile });
      } else {
        return res.json({ hasProfile: false, profile: null });
      }
    } 
    // Handle guest user with profileId
    else if (effectiveUser.profileId) {
      console.log('Checking profile for guest with profileId:', effectiveUser.profileId);
      
      const profile = await GymBrosProfile.findById(effectiveUser.profileId);
      if (profile) {
        return res.json({ hasProfile: true, profile, isGuest: true });
      }
    }
    // Handle verified phone from body (may be coming from verification flow)
    else if (req.body && req.body.verifiedPhone) {
      return await handleProfileCheckByPhone(req, res);
    }
    // No authentication or phone verification
    else {
      return res.status(200).json({ 
        hasProfile: false, 
        profile: null,
        requiresVerification: true,
        message: 'Phone verification required to continue'
      });
    }
  } catch (error) {
    console.error('Error in checkGymBrosProfile:', error);
    handleError(error, req, res);
  }
};


export const checkGymBrosProfileByPhone = async (req, res) => {
  try {
    const { verifiedPhone, verificationToken } = req.body;

    console.log('Checking profile by phone:', verifiedPhone);
    
    if (!verifiedPhone || !verificationToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and verification token are required' 
      });
    }
    
    // Verify token
    try {
      const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET);
      console.log('Decoded token:', decodedToken);
      // Check if token was issued for this phone and is verified
      if (!decodedToken.phone || decodedToken.phone !== verifiedPhone || !decodedToken.verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid verification token'
        });
      }
    } catch (tokenError) {
      logger.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // STEP 1: Find user with this phone number
    const user = await User.findOne({ phone: verifiedPhone });
    
    // If user exists, handle normally
    if (user) {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
      
      // Find GymBros profile if it exists
      const profile = await GymBrosProfile.findOne({ userId: user._id });
      
      // Generate authentication token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Return everything in one response - user data, token, and profile if it exists
      return res.json({
        success: true,
        hasProfile: !!profile,
        profile: profile || null,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          points: user.points,
          hasReceivedFirstLoginBonus: user.hasReceivedFirstLoginBonus
        },
        token
      });
    }
    
    // STEP 2: If no user found, check for GymBrosProfile with this phone
    const gymBrosProfile = await GymBrosProfile.findOne({ phone: verifiedPhone });
    
    if (gymBrosProfile) {
      console.log('Found GymBros profile without user account:', gymBrosProfile._id);
      
      // Return the profile info without user data
      return res.json({
        success: true,
        hasProfile: true,
        profile: gymBrosProfile,
        user: null,
        needsRegistration: true  // Flag to indicate frontend that user registration is needed
      });
    }
    
    // STEP 3: No user and no profile found - return info that allows creating both
    return res.json({
      success: true,
      hasProfile: false,
      profile: null,
      user: null,
      needsRegistration: true,
      verifiedPhone: verifiedPhone  // Return the verified phone to use for registration
    });
    
  } catch (error) {
    logger.error('Error in checkGymBrosProfileByPhone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when checking profile by phone'
    });
  }
};

export const createOrUpdateGymBrosProfile = async (req, res) => {
  try {
    const profileData = req.body;
    const verificationToken = req.body.verificationToken;
    
    console.log('Creating/updating GymBros profile:', profileData);
    
    // Validate profile data
    if (!profileData || typeof profileData !== 'object') {
      return res.status(400).json({ message: 'Invalid profile data' });
    }

    // Get the effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Case 1: Regular authenticated user
    if (effectiveUser.userId) {
      const userId = effectiveUser.userId;
      
      // Check for existing profile for this user
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
        
        // Link profile ID to user
        await User.findByIdAndUpdate(userId, { gymBrosProfile: profile._id });
      }
      
      return res.status(201).json({ 
        success: true,
        profile,
        isGuest: false
      });
    } 
    // Case 2: Guest user with existing profile
    else if (effectiveUser.profileId) {
      // Update existing profile
      const profile = await GymBrosProfile.findByIdAndUpdate(
        effectiveUser.profileId,
        profileData,
        { new: true }
      );
      
      // Generate a guest token for future requests
      const guestToken = generateGuestToken(effectiveUser.phone);
      
      return res.status(200).json({
        success: true,
        profile,
        isGuest: true,
        guestToken
      });
    }
    // Case 3: New user with verified phone but no profile yet
    else if (verificationToken && profileData.phone) {
      try {
        // Verify the token
        const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET);
        
        // Ensure phone number matches and is verified
        if (!decodedToken.phone || 
            decodedToken.phone !== profileData.phone || 
            !decodedToken.verified) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid verification token' 
          });
        }
        
        // Create a new profile for guest user
        const profile = new GymBrosProfile({
          ...profileData,
          // Store when the profile was created as a guest
          guestCreatedAt: new Date()
        });
        
        await profile.save();
        
        // Generate a guest token for future requests
        const guestToken = generateGuestToken(profileData.phone);
        
        return res.status(201).json({
          success: true,
          profile,
          isGuest: true,
          guestToken,
          message: 'Guest profile created successfully'
        });
      } catch (tokenError) {
        logger.error('Error validating phone verification token:', tokenError);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }
    }
    // Case 4: No valid user context
    else {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication or phone verification required'
      });
    }
  } catch (error) {
    console.error('Error in createOrUpdateGymBrosProfile:', error);
    handleError(error, req, res);
  }
};

// Upload multiple profile images
export const uploadProfileImages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // If no files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    
    // Get the profile
    const profile = await GymBrosProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Check if adding these files would exceed the 6 image limit
    if (profile.images && profile.images.length + req.files.length > 6) {
      // Delete the uploaded files to clean up
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(400).json({ 
        error: 'Maximum 6 images allowed',
        message: `You can only upload ${6 - profile.images.length} more images`
      });
    }
    
    // Add the new image URLs to the profile
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const imageUrls = req.files.map(file => `${baseUrl}/uploads/gym-bros/${file.filename}`);
    
    // Update the profile with new images
    profile.images = [...(profile.images || []), ...imageUrls];
    await profile.save();
    
    res.status(201).json({ 
      success: true, 
      imageUrls,
      message: `${req.files.length} image(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading profile images:', error);
    handleError(error, req, res);
  }
};

// Delete a specific profile image
export const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const imageId = req.params.imageId;
    
    // Get the profile
    const profile = await GymBrosProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Find the image in the profile's images array
    const imagePath = profile.images.find(img => img.includes(imageId));
    if (!imagePath) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Must have at least one image
    if (!profile.images || profile.images.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete last image' });
    }
    
    // Remove image from profile
    profile.images = profile.images.filter(img => !img.includes(imageId));
    await profile.save();
    
    // Delete the file from the server
    const filename = path.basename(imagePath);
    const filePath = path.join('uploads', 'gym-bros', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    handleError(error, req, res);
  }
};

export const getGymBrosProfiles = async (req, res, next) => {
  try {
    // Get effective user (either authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    logger.info(`Fetching profiles for user: ${effectiveUser.userId || effectiveUser.profileId || 'unidentified'}`);
    logger.info(`Is guest? ${effectiveUser.isGuest}`);
    
    // No user context available
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication or verified phone required'
      });
    }
    
    // Get user's profile
    const userProfile = effectiveUser.isGuest 
      ? await GymBrosProfile.findById(effectiveUser.profileId)
      : await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    
    if (!userProfile) {
      return res.status(404).json({ 
        error: "User profile not found",
        message: "Please complete your profile setup before browsing matches" 
      });
    }

    // Get user's preferences
    const prefQuery = effectiveUser.isGuest 
      ? { profileId: effectiveUser.profileId }
      : { userId: effectiveUser.userId };
      
    const userPreferences = await GymBrosPreference.findOne(prefQuery);
    
    // If no preferences exist yet, create default ones
    const preferences = userPreferences || new GymBrosPreference(prefQuery);

    // Build list of profiles to exclude (user, likes, dislikes)
    const excludedProfiles = [
      effectiveUser.userId || effectiveUser.profileId,
      ...(preferences.likedProfiles || []),
      ...(preferences.dislikedProfiles || [])
    ];

    // Get all candidate profiles (excluding already liked/disliked and the user)
    const candidateProfiles = await GymBrosProfile.find({
      $and: [
        {
          $or: [
            { userId: { $nin: excludedProfiles } },
            { _id: { $nin: excludedProfiles } }
          ]
        },
        { 'location.lat': { $exists: true } },
        { 'location.lng': { $exists: true } }
      ]
    });

    // Apply filters if provided
    const { 
      workoutTypes, 
      experienceLevel, 
      preferredTime, 
      gender, 
      minAge, 
      maxAge,
      maxDistance
    } = req.query;

    const filterOptions = {
      maxDistance: maxDistance ? parseInt(maxDistance, 10) : preferences.maxDistance || 50,
      userPreferences: preferences,
      filters: {
        workoutTypes: workoutTypes ? workoutTypes.split(',') : undefined,
        experienceLevel: experienceLevel || undefined,
        preferredTime: preferredTime || undefined,
        gender: gender || undefined,
        ageRange: {
          min: minAge ? parseInt(minAge, 10) : preferences.ageRange?.min || 18,
          max: maxAge ? parseInt(maxAge, 10) : preferences.ageRange?.max || 99
        }
      }
    };
    
    // Get recommended profiles using enhanced service
    const recommendations = await getRecommendedProfiles(
      userProfile, 
      candidateProfiles,
      filterOptions
    );

    const potentialMatches = await findPotentialMatches(
      effectiveUser.userId || effectiveUser.profileId,
      effectiveUser.isGuest
    );
    
    const sortedRecommendations = recommendations.sort((a, b) => {
      // Prioritize users who've already liked this user
      const aId = a.userId || a._id;
      const bId = b.userId || b._id;
      
      const aLikedUser = potentialMatches.includes(aId.toString());
      const bLikedUser = potentialMatches.includes(bId.toString());
      
      if (aLikedUser && !bLikedUser) return -1;
      if (!aLikedUser && bLikedUser) return 1;
      
      // Then sort by match score
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }
      
      // Finally sort by distance
      return a.location.distance - b.location.distance;
    });

    res.json({
      recommendations: sortedRecommendations,
      isGuest: effectiveUser.isGuest
    });
  } catch (error) {
    logger.error('Error in getGymBrosProfiles:', error);
    
    // Properly formatted error response
    return res.status(500).json({ 
      error: "Failed to retrieve matches",
      message: "An unexpected error occurred while finding gym partners"
    });
  }
};

export const likeGymBrosProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const viewDuration = req.body.viewDuration || 0;
    
    // Get effective user (either authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // No user context available
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication or verified phone required'
      });
    }
    
    // Process the like interaction
    const userIdentifier = effectiveUser.userId || effectiveUser.profileId;
    const result = await processFeedback(
      userIdentifier, 
      profileId, 
      'like', 
      viewDuration, 
      effectiveUser.isGuest
    );
    
    // Check if this created a match
    const isMatch = await checkForMatch(
      userIdentifier, 
      profileId, 
      effectiveUser.isGuest
    );
    
    res.json({ 
      success: result, 
      match: isMatch,
      isGuest: effectiveUser.isGuest 
    });
  } catch (error) {
    logger.error('Error in likeGymBrosProfile:', error);
    res.status(500).json({ error: 'Failed to process like' });
  }
};

// Dislike a GymBros profile
export const dislikeGymBrosProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const viewDuration = req.body.viewDuration || 0;
    
    // Get effective user (either authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // No user context available
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication or verified phone required'
      });
    }
    
    // Process the dislike interaction
    const userIdentifier = effectiveUser.userId || effectiveUser.profileId;
    const result = await processFeedback(
      userIdentifier, 
      profileId, 
      'dislike', 
      viewDuration, 
      effectiveUser.isGuest
    );
    
    res.json({ 
      success: result,
      isGuest: effectiveUser.isGuest
    });
  } catch (error) {
    logger.error('Error in dislikeGymBrosProfile:', error);
    res.status(500).json({ error: 'Failed to process dislike' });
  }
};


export const getGymBrosMatches = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        message: 'Authentication required to view matches'
      });
    }
    
    // Determine the ID to use for finding matches
    const userIdentifier = effectiveUser.userId || effectiveUser.profileId;
    
    // Find all matches where this user is a participant
    const matches = await GymBrosMatch.find({
      users: userIdentifier,
      active: true
    });
    
    // Get the matched user IDs (excluding current user)
    const matchedUserIds = matches.map(match => 
      match.users.find(id => id !== userIdentifier)
    );
    
    // Get profiles for matched users
    const matchedProfiles = await GymBrosProfile.find({
      $or: [
        { userId: { $in: matchedUserIds } },
        { _id: { $in: matchedUserIds } }
      ]
    });
    
    res.json(matchedProfiles);
  } catch (error) {
    handleError(error, req, res);
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    const preferences = req.body;

    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        message: 'Authentication required to update preferences'
      });
    }
    
    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Invalid preferences data' });
    }
    
    const prefIdentifier = {
      [effectiveUser.isGuest ? 'profileId' : 'userId']: 
        effectiveUser.userId || effectiveUser.profileId
    };

    // Find or create the user's preferences
    let userPreferences = await GymBrosPreference.findOne(prefIdentifier);

    if (userPreferences) {
      // Update existing preferences
      userPreferences = await GymBrosPreference.findByIdAndUpdate(
        userPreferences._id,
        preferences,
        { new: true }
      );
    } else {
      // Create new preferences document
      userPreferences = new GymBrosPreference({ 
        ...prefIdentifier,
        ...preferences
      });
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

export const getUserPreferences = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        message: 'Authentication required to get preferences'
      });
    }
    
    const prefIdentifier = {
      [effectiveUser.isGuest ? 'profileId' : 'userId']: 
        effectiveUser.userId || effectiveUser.profileId
    };
    
    // Find user preferences or return default settings
    let preferences = await GymBrosPreference.findOne(prefIdentifier);

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


export const checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Check if the phone exists in User collection
    const existingUser = await User.findOne({ phone });
    
    return res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({ message: 'Error checking phone number' });
  }
};

export const sendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Validate phone format (E.164 format: +12345678900)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Please use international format (e.g., +12345678900)' 
      });
    }
    
    // Rate limiting check - prevent abuse
    const lastMinute = new Date(Date.now() - 60 * 1000);
    const recentAttempts = await PhoneVerification.countDocuments({
      phone,
      createdAt: { $gte: lastMinute }
    });
    
    if (recentAttempts >= 2) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again in a minute.'
      });
    }
    
    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in database
    await PhoneVerification.findOneAndUpdate(
      { phone },
      { 
        phone,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      },
      { upsert: true, new: true }
    );
    
    // Check if we're in production mode
    if (process.env.NODE_ENV !== 'production') {
      // Development mode: Log the code and return it in the response
      console.log(`[DEV MODE] Verification code for ${phone}: ${verificationCode}`);
      return res.json({ 
        success: true, 
        message: 'Verification code generated (check server logs)',
        devCode: verificationCode // Only in development
      });
    }
    
    // Get Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    // Check for Twilio credentials
    if (!accountSid || !authToken || !twilioPhone) {
      throw new Error('SMS service configuration missing');
    }
    
    try {
      // Initialize Twilio client
      const twilioClient = require('twilio')(accountSid, authToken);
      
      // Send the SMS
      await twilioClient.messages.create({
        body: `Your GymBros verification code is: ${verificationCode}`,
        from: twilioPhone,
        to: phone
      });
      
      console.log(`Verification SMS sent to ${phone}`);
      
      res.json({ success: true, message: 'Verification code sent' });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      
      // Provide specific error responses based on Twilio error codes
      if (twilioError.code === 21211) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid phone number format or unverified recipient' 
        });
      } else if (twilioError.code === 21608) {
        return res.status(400).json({ 
          success: false,
          message: 'This phone number is not a verified Twilio test number'
        });
      } else if (twilioError.code === 21610) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is unsubscribed from your Twilio account'
        });
      }
      
      throw twilioError;
    }
  } catch (error) {
    console.error('Error sending verification code:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to send verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and code are required' });
    }
    
    console.log('Verifying code:', code);
    console.log('For phone:', phone);
    // Find the verification record
    const verification = await PhoneVerification.findOne({ 
      phone,
      code,
      expiresAt: { $gt: new Date() } // Make sure it hasn't expired
    });

    
    if (!verification) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification code' 
      });
    }
    
    // Code is valid, create a temporary verification token
    const token = jwt.sign(
      { phone, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Clear the used verification code to prevent reuse
    await PhoneVerification.deleteOne({ _id: verification._id });
    
    res.json({ 
      success: true,
      message: 'Phone verified successfully',
      token
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying code'
    });
  }
};

export const convertGuestToUser = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    const { guestToken } = req.body;
    
    if (!guestToken) {
      return res.status(400).json({
        success: false,
        message: 'Guest token is required'
      });
    }
    
    // Verify the guest token
    let decodedToken;
    try {
      decodedToken = jwt.verify(guestToken, process.env.JWT_SECRET);
      
      // Ensure it's a valid guest token
      if (!decodedToken.phone || !decodedToken.verified || !decodedToken.isGuest) {
        return res.status(400).json({
          success: false,
          message: 'Invalid guest token'
        });
      }
    } catch (error) {
      logger.error('Error verifying guest token:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired guest token'
      });
    }
    
    // Find the guest profile using the phone from the token
    const guestProfile = await GymBrosProfile.findOne({ phone: decodedToken.phone, userId: { $exists: false } });
    
    if (!guestProfile) {
      return res.status(404).json({
        success: false,
        message: 'Guest profile not found'
      });
    }
    
    // Find any preferences associated with this guest profile
    const guestPreferences = await GymBrosPreference.findOne({ profileId: guestProfile._id });
    
    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update the guest profile with the user ID
      guestProfile.userId = userId;
      guestProfile.isGuest = false;
      await guestProfile.save({ session });
      
      // Update the user to reference this profile
      await User.findByIdAndUpdate(
        userId,
        { gymBrosProfile: guestProfile._id },
        { session }
      );
      
      // If there are preferences, update them to be associated with the user
      if (guestPreferences) {
        guestPreferences.userId = userId;
        delete guestPreferences.profileId;
        await guestPreferences.save({ session });
      }
      
      // Update any matches to reference the user ID instead of profile ID
      await GymBrosMatch.updateMany(
        { users: guestProfile._id },
        { $set: { 'users.$': userId } },
        { session }
      );
      
      // Commit the transaction
      await session.commitTransaction();
      
      return res.status(200).json({
        success: true,
        message: 'Guest profile successfully converted to user account',
        profile: guestProfile
      });
    } catch (txnError) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      logger.error('Error in convertGuestToUser transaction:', txnError);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to convert guest profile to user account'
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error('Error in convertGuestToUser:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error converting guest profile'
    });
  }
};


async function findPotentialMatches(userIdentifier, isGuest = false) {
  try {
    // Find all users who have liked this user
    const query = isGuest
      ? { likedProfiles: userIdentifier }
      : { likedProfiles: userIdentifier };
    
    const usersWhoLikedCurrent = await GymBrosPreference.find(query);
    
    return usersWhoLikedCurrent.map(pref => {
      // Return either userId or profileId based on what's available
      return (pref.userId || pref.profileId).toString();
    });
  } catch (error) {
    logger.error('Error finding potential matches:', error);
    return [];
  }
}

async function saveBrowsingSession(userId, profileIds) {
  // Implementation depends on your analytics strategy
  // This is a placeholder for future implementation
  // Could save to database, send to analytics service, etc.
}

async function handleProfileCheckByPhone(req, res) {
  const { verifiedPhone, verificationToken } = req.body;
  
  console.log('Checking profile by verified phone:', verifiedPhone);
  
  // First try to find a User with this phone number
  const user = await User.findOne({ phone: verifiedPhone });
  
  // If user exists, check for a connected profile
  if (user) {
    const profile = await GymBrosProfile.findOne({ userId: user._id });
    
    if (profile) {
      return res.json({ 
        hasProfile: true, 
        profile,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email
        }
      });
    } else {
      return res.json({ 
        hasProfile: false, 
        profile: null,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email
        }
      });
    }
  }

  const profile = await GymBrosProfile.findOne({ phone: verifiedPhone });
  
  if (profile) {
    // Generate a guest token for future requests
    const guestToken = generateGuestToken(verifiedPhone);
    
    return res.json({
      hasProfile: true,
      profile,
      user: null,
      isGuest: true,
      guestToken,
      message: 'Profile found but no user account exists'
    });
  }
  
  // Neither user nor profile exists - allow creating a new profile
  return res.json({
    hasProfile: false,
    profile: null,
    user: null,
    isGuest: true, 
    verifiedPhone,
    message: 'No profile found, you can create a new one'
  });
}
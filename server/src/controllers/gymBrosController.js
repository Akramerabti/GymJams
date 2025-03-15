import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosPreference from '../models/GymBrosPreference.js';
import GymBrosMatch from '../models/GymBrosMatch.js';
import PhoneVerification from '../models/PhoneVerification.js'; // Add this import
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken'; // Also add jwt for token generation
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

// Get recommended profiles for the user
export const getGymBrosProfiles = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching profiles for user: ${userId || 'guest'}`);
    console.log(`Query parameters:`, req.query);

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
    
    console.log('Applying filters:', recommendationOptions.filters);

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

// server/src/controllers/gymBrosController.js (add these functions)

// Check if a phone number exists in the system
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
    handleError(error, req, res);
  }
};

// Send verification code
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
    
    // Log the code during development (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Verification code for ${phone}: ${verificationCode}`);
    }
    
    // Send SMS using Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !twilioPhone) {
      // Fallback for development if Twilio credentials aren't set
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ 
          success: true, 
          message: 'Verification code generated (check server logs)',
          devCode: verificationCode // Only in development
        });
      } else {
        throw new Error('SMS service configuration missing');
      }
    }
    
    // Initialize Twilio client
    const twilioClient = require('twilio')(accountSid, authToken);
    
    // Send the SMS
    await twilioClient.messages.create({
      body: `Your GymBros verification code is: ${verificationCode}`,
      from: twilioPhone,
      to: phone
    });
    
    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    
    // Provide more specific error messages
    if (error.code === 21211) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format or unverified recipient' 
      });
    } else if (error.code === 21608) {
      return res.status(400).json({ 
        success: false,
        message: 'This phone number is not a verified Twilio test number'
      });
    }
    
    handleError(error, req, res);
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and code are required' });
    }
    
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
    
    res.json({ 
      success: true,
      message: 'Phone verified successfully',
      token
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    handleError(error, req, res);
  }
};
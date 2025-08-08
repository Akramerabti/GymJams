import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosPreference from '../models/GymBrosPreference.js';
import GymBrosMatch from '../models/GymBrosMatch.js';
import PhoneVerification from '../models/PhoneVerification.js';
import User from '../models/User.js';
import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { handleError } from '../middleware/error.middleware.js';
import twilio from 'twilio';
import logger from '../utils/logger.js';
import supabaseStorageService from '../services/supabaseStorage.service.js';
import { 
  getRecommendedProfiles,
  processFeedback,
  checkForMatch,
  findPotentialMatches
} from '../services/gymBrosMatchingService.js';
import mongoose from 'mongoose';

export const initializeGymBros = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    let responseData = {
      hasProfile: false,
      profile: null,
      profiles: [],
      matches: []
    };
    
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.json(responseData);
    }
    
    let profile;
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        profile = await GymBrosProfile.findById(effectiveUser.profileId);
      } else if (effectiveUser.phone) {
        profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
      }
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }
    
    if (profile) {
      responseData.hasProfile = true;
      responseData.profile = profile;
      
      const filters = {
        workoutTypes: [],
        experienceLevel: 'Any',
        preferredTime: 'Any',
        genderPreference: 'All',
        ageRange: { min: 18, max: 99 },
        maxDistance: 50
      };
      
      responseData.profiles = await getRecommendedProfiles(profile, filters);
      
      const userIdentifier = effectiveUser.userId || effectiveUser.profileId;
      let possibleUserIds = [userIdentifier];
      
      if (effectiveUser.userId) {
        const userProfile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
        if (userProfile) {
          possibleUserIds.push(userProfile._id.toString());
        }
      }
      
      const matches = await GymBrosMatch.find({
        users: { $in: possibleUserIds },
        active: true
      });
      
      const matchedUserIds = [];
      matches.forEach(match => {
        const otherUserIds = match.users.filter(id => 
          !possibleUserIds.includes(id.toString())
        );
        otherUserIds.forEach(id => matchedUserIds.push(id));
      });
      
      const matchedProfiles = await GymBrosProfile.find({
        $or: [
          { userId: { $in: matchedUserIds } },
          { _id: { $in: matchedUserIds } }
        ]
      });
      
      responseData.matches = matchedProfiles;
    }
    
    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
      responseData.isGuest = true;
    }
    
    res.json(responseData);
  } catch (error) {
    logger.error('Error initializing GymBros:', error);
    res.status(500).json({ 
      hasProfile: false,
      profile: null,
      profiles: [],
      matches: [],
      error: 'Failed to initialize'
    });
  }
};

export const checkGymBrosProfile = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Handle authenticated user
    if (effectiveUser.userId) {
      //('Checking profile for authenticated user:', effectiveUser.userId);
      
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      //('Profile found:', profile);
      
      if (profile) {
        return res.json({ hasProfile: true, profile });
      } else {
        return res.json({ hasProfile: false, profile: null });
      }
    } 
    // Handle guest user with profileId
    else if (effectiveUser.profileId) {
      //('Checking profile for guest with profileId:', effectiveUser.profileId);
      
      const profile = await GymBrosProfile.findById(effectiveUser.profileId);
      if (profile) {
        // Generate a fresh guest token with the profile ID
        const guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
        
        return res.json({ 
          hasProfile: true, 
          profile, 
          isGuest: true,
          guestToken
        });
      }
    }
    // Handle guest user with phone but no profileId
    else if (effectiveUser.phone) {
      //('Checking profile for guest with phone:', effectiveUser.phone);
      
      const profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
      if (profile) {
        // Generate a fresh guest token with the profile ID
        const guestToken = generateGuestToken(effectiveUser.phone, profile._id);
        
        return res.json({ 
          hasProfile: true, 
          profile, 
          isGuest: true,
          guestToken
        });
      } else {
        // No profile found yet, but we have a valid phone
        const guestToken = generateGuestToken(effectiveUser.phone);
        
        return res.json({
          hasProfile: false,
          profile: null,
          isGuest: true,
          guestToken
        });
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

    //('Checking profile by phone:', verifiedPhone);
    
    if (!verifiedPhone || !verificationToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and verification token are required' 
      });
    }
    
    // Verify token
    try {
      const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET);
      //('Decoded token:', decodedToken);
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
      //('Found GymBros profile without user account:', gymBrosProfile._id);
      
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
    let profileData = req.body;
    const verificationToken = req.body.verificationToken;
    
    //('Creating/updating GymBros profile:', profileData);
    //('Guest token from request:', req.headers['x-gymbros-guest-token'] || req.query.guestToken);
    
    // Validate profile data
    if (!profileData || typeof profileData !== 'object') {
      return res.status(400).json({ message: 'Invalid profile data' });
    }

    // IMPORTANT: Remove the _id field when updating to avoid MongoDB immutable field error
    if (profileData._id) {
      const { _id, ...dataWithoutId } = profileData;
      profileData = dataWithoutId;
    }

    // Get the effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Case 1: Regular authenticated user
    if (effectiveUser.userId) {
      const userId = effectiveUser.userId;
      
      // Check for existing profile for this user
      let profile = await GymBrosProfile.findOne({ userId });

      if (profile) {
        // Update existing profile - including new fields
        profile = await GymBrosProfile.findByIdAndUpdate(
          profile._id, 
          { 
            ...profileData,
            userId,
            // Ensure new fields are properly updated
            bio: profileData.bio,
            religion: profileData.religion,
            politicalStandpoint: profileData.politicalStandpoint,
            sexualOrientation: profileData.sexualOrientation
          }, 
          { new: true }
        );
      } else {
        // Create new profile with new fields
        profile = new GymBrosProfile({ 
          ...profileData,
          userId,
          // Include new fields explicitly
          bio: profileData.bio,
          religion: profileData.religion,
          politicalStandpoint: profileData.politicalStandpoint,
          sexualOrientation: profileData.sexualOrientation
        });
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
      // Update existing profile with new fields
      const profile = await GymBrosProfile.findByIdAndUpdate(
        effectiveUser.profileId,
        {
          ...profileData,
          // Include new fields explicitly
          bio: profileData.bio,
          religion: profileData.religion,
          politicalStandpoint: profileData.politicalStandpoint,
          sexualOrientation: profileData.sexualOrientation
        },
        { new: true }
      );
      
      // Generate a guest token for future requests
      const guestToken = generateGuestToken(effectiveUser.phone, profile._id);
      
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
        
        // Create a new profile for guest user with new fields
        const profile = new GymBrosProfile({
          ...profileData,
          // Include new fields explicitly
          bio: profileData.bio,
          religion: profileData.religion,
          politicalStandpoint: profileData.politicalStandpoint,
          sexualOrientation: profileData.sexualOrientation,
          // Store when the profile was created as a guest
          guestCreatedAt: new Date()
        });
        
        await profile.save();
        
        // Generate a guest token for future requests with the profile ID
        const guestToken = generateGuestToken(profileData.phone, profile._id);
        //(`Created guest token for profile ${profile._id}:`, guestToken);
        
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

export const uploadProfileImages = async (req, res) => {
  try {
    //('Uploading profile images:', req.files);
    // Get effective user (either authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId, profileId or phone
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required to upload images',
        requiresVerification: true
      });
    }
    
    // If no files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No images uploaded'
      });
    }
    
    // Find the profile
    let profile;
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        profile = await GymBrosProfile.findById(effectiveUser.profileId);
      } else if (effectiveUser.phone) {
        profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
      }
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }
    
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Check if adding these files would exceed the 6 image limit
    if (profile.images && profile.images.length + req.files.length > 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Maximum 6 images allowed',
        message: `You can only upload ${6 - profile.images.length} more images`
      });
    }
    
    //('Uploading images to Supabase for profile:', profile._id);
    
    try {
      // Upload files to Supabase
      const uploadResults = await supabaseStorageService.uploadMultipleFiles(
        req.files.map(file => ({
          buffer: file.buffer,
          originalname: file.originalname
        })),
        'gym-bros' // folder name
      );
      
      // Extract URLs from upload results
      const imageUrls = uploadResults.map(result => result.url);
      
      //('Successfully uploaded to Supabase, URLs:', imageUrls);
      
      // Add new images to profile
      if (!profile.images) {
        profile.images = [];
      }
      profile.images.push(...imageUrls);
      
      // Update profile image if it's the first image
      if (!profile.profileImage && imageUrls.length > 0) {
        profile.profileImage = imageUrls[0];
      }
      
      await profile.save();
      
      // For guest user, generate a new token with the updated profile ID
      let responseData = {
        success: true,
        imageUrls,
        message: `${req.files.length} image(s) uploaded successfully`
      };
      
      if (effectiveUser.isGuest) {
        const guestToken = generateGuestToken(effectiveUser.phone, profile._id);
        responseData.guestToken = guestToken;
      }
      
      res.status(201).json(responseData);
    } catch (uploadError) {
      console.error('Error uploading to Supabase:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload images to storage',
        message: uploadError.message
      });
    }
  } catch (error) {
    console.error('Error uploading profile images:', error);
    handleError(error, req, res);
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    // Get effective user (either authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId, profileId or phone
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required to delete image',
        requiresVerification: true
      });
    }
    
    const imageId = req.params.imageId;
    
    // Find the profile
    let profile;
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        profile = await GymBrosProfile.findById(effectiveUser.profileId);
      } else if (effectiveUser.phone) {
        profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
      }
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Find the image URL that contains the imageId
    const imageUrl = profile.images.find(img => img.includes(imageId));
    if (!imageUrl) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Must have at least one image
    if (!profile.images || profile.images.length <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete last image'
      });
    }
    
    try {
      // Extract file path from Supabase URL and delete from storage
      const filePath = supabaseStorageService.extractFilePathFromUrl(imageUrl);
      if (filePath) {
        await supabaseStorageService.deleteFile(filePath);
      }
    } catch (storageError) {
      console.error('Error deleting from Supabase storage:', storageError);
      // Continue with database cleanup even if storage deletion fails
    }
    
    // Remove image from profile
    profile.images = profile.images.filter(img => !img.includes(imageId));
    
    // If this was the profile image, set the first remaining image as profile image
    if (profile.profileImage && profile.profileImage.includes(imageId)) {
      profile.profileImage = profile.images.length > 0 ? profile.images[0] : null;
    }
    
    await profile.save();
    
    // Prepare response with optional guest token
    let responseData = {
      success: true,
      message: 'Image deleted successfully'
    };
    
    if (effectiveUser.isGuest) {
      const guestToken = generateGuestToken(effectiveUser.phone, profile._id);
      responseData.guestToken = guestToken;
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    handleError(error, req, res);
  }
};

export const getGymBrosProfiles = async (req, res, next) => {
  try {
    logger.info('Request params:', JSON.stringify(req.query));
    logger.info('Guest user on request:', JSON.stringify(req.guestUser));

    const effectiveUser = getEffectiveUser(req);
    logger.info(`Fetching profiles for user: ${effectiveUser.userId || effectiveUser.profileId || 'unidentified'}`);
    
    // No user context available
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication or verified phone required'
      });
    }
    
    // Get user's profile
    let userProfile;
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        userProfile = await GymBrosProfile.findById(effectiveUser.profileId);
      } else if (effectiveUser.phone) {
        userProfile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
      }
    } else {
      userProfile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }
    
    if (!userProfile) {
      return res.status(404).json({ 
        error: "User profile not found",
        message: "Please complete your profile setup before browsing matches" 
      });
    }

    // Update lastActive timestamp for the user profile
    try {
      userProfile.lastActive = new Date();
      await userProfile.save();
      logger.info(`Updated lastActive timestamp for user: ${effectiveUser.userId || effectiveUser.profileId}`);
    } catch (updateError) {
      // Log the error but continue with the request
      logger.error(`Error updating lastActive timestamp: ${updateError.message}`);
    }

    //('User profiles:', req.query);
    const { 
      workoutTypes, 
      experienceLevel, 
      preferredTime, 
      gender, 
      minAge, 
      maxAge,
      maxDistance
    } = req.query;

    // Format filters for the recommendation service
    const filters = {
      workoutTypes: workoutTypes ? workoutTypes.split(',') : undefined,
      experienceLevel: experienceLevel || undefined,
      preferredTime: preferredTime || undefined,
      genderPreference: gender || undefined,
      ageRange: {
        min: minAge ? parseInt(minAge, 10) : 18,
        max: maxAge ? parseInt(maxAge, 10) : 99
      },
      maxDistance: maxDistance ? parseInt(maxDistance, 10) : 50
    };

    const recommendations = await getRecommendedProfiles(userProfile, filters);
    
    // For guest users, generate and include a new token
    if (effectiveUser.isGuest) {
      const guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
      
      res.json({
        recommendations,
        isGuest: true,
        guestToken
      });
    } else {
      res.json({
        recommendations,
        isGuest: false
      });
    }
  } catch (error) {
    logger.error('Error in getGymBrosProfiles:', error);
    res.status(500).json({ 
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
    
    // Use isGuest parameter to ensure proper handling
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
    
    // Use isGuest parameter to ensure proper handling
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
    logger.debug(`getGymBrosMatches: Effective user data: ${JSON.stringify(effectiveUser)}`);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      logger.warn('getGymBrosMatches: No valid identifier found for user');
      return res.status(401).json({ 
        message: 'Authentication required to view matches',
        requiresVerification: true
      });
    }
    
    // Determine the ID to use for finding matches
    const userIdentifier = effectiveUser.userId || effectiveUser.profileId;
    logger.debug(`getGymBrosMatches: Using primary identifier: ${userIdentifier}`);
    
    // If no userIdentifier but we have a phone, try to find a profile with that phone
    let phoneProfile;
    if (!userIdentifier && effectiveUser.phone) {
      logger.debug(`getGymBrosMatches: No direct ID, trying to find profile by phone: ${effectiveUser.phone}`);
      phoneProfile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
      
      if (!phoneProfile) {
        logger.warn(`getGymBrosMatches: No profile found for phone: ${effectiveUser.phone}`);
        return res.status(404).json({ 
          message: 'No profile found for this phone number',
          requiresVerification: true
        });
      }
      
      logger.debug(`getGymBrosMatches: Found profile by phone: ${phoneProfile._id}`);
    }
    
    const actualIdentifier = userIdentifier || phoneProfile._id;
    logger.debug(`getGymBrosMatches: Final identifier to use for matches: ${actualIdentifier}`);
    
    // Find all possible IDs for this user to ensure we find all matches
    let possibleUserIds = [actualIdentifier]; 
    
    // If we have a userIdentifier, add possible profileId
    if (effectiveUser.userId) {
      const userProfile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (userProfile) {
        possibleUserIds.push(userProfile._id.toString());
        logger.debug(`getGymBrosMatches: Added profile ID ${userProfile._id} to possible IDs`);
      }
    }
    
    logger.debug(`getGymBrosMatches: Searching for matches with any of these IDs: ${possibleUserIds.join(', ')}`);
    
    // Find all matches where this user is a participant with any of their IDs
    const matches = await GymBrosMatch.find({
      users: { $in: possibleUserIds },
      active: true
    });
    
    logger.debug(`getGymBrosMatches: Found ${matches.length} matches`);
    matches.forEach((match, index) => {
      logger.debug(`getGymBrosMatches: Match ${index + 1}: ${match._id}, users: [${match.users.join(', ')}]`);
    });
    
    // Get the matched user IDs (excluding current user)
    const matchedUserIds = [];
    
    matches.forEach(match => {
      // Find IDs in users array that don't match any of our possible user IDs
      const otherUserIds = match.users.filter(id => 
        !possibleUserIds.includes(id.toString())
      );
      
      if (otherUserIds.length > 0) {
        otherUserIds.forEach(id => matchedUserIds.push(id));
        logger.debug(`getGymBrosMatches: Added other user ID from match: ${otherUserIds.join(', ')}`);
      } else {
        logger.warn(`getGymBrosMatches: Couldn't find other user ID in match ${match._id}`);
      }
    });
    
    logger.debug(`getGymBrosMatches: Final list of matched user IDs: ${matchedUserIds.join(', ')}`);
    
    // Get profiles for matched users
    const matchedProfiles = await GymBrosProfile.find({
      $or: [
        { userId: { $in: matchedUserIds } },
        { _id: { $in: matchedUserIds } }
      ]
    });
    
    logger.debug(`getGymBrosMatches: Found ${matchedProfiles.length} profiles for matched users`);
    matchedProfiles.forEach((profile, index) => {
      logger.debug(`getGymBrosMatches: Matched profile ${index + 1}: ${profile._id}, name: ${profile.name}, userId: ${profile.userId || 'N/A'}`);
    });
    
    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      const guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
      logger.debug(`getGymBrosMatches: Generated guest token for response: ${guestToken.substring(0, 20)}...`);
      
      const responseData = {
        matches: matchedProfiles,
        guestToken,
        isGuest: true
      };
      
      logger.debug(`getGymBrosMatches: Returning ${matchedProfiles.length} profiles with guest token`);
      return res.json(responseData);
    }
    
    logger.debug(`getGymBrosMatches: Returning ${matchedProfiles.length} profiles`);
    res.json(matchedProfiles);  } catch (error) {
    logger.error(`Error in getGymBrosMatches: ${error.message}`, error);
    res.status(500).json({ error: 'Failed to retrieve matches' });
  }
};

// Remove a match
export const removeMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const effectiveUser = getEffectiveUser(req);
    
    // Validate that user has valid identifier
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to remove matches'
      });
    }
    
    // Find the match
    const match = await GymBrosMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Get user identifier
    const userIdentifier = effectiveUser.userId || effectiveUser.profileId;
    
    // Check if user is part of this match
    const isUserInMatch = match.users.some(userId => 
      userId.toString() === userIdentifier.toString()
    );
    
    if (!isUserInMatch) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove this match'
      });
    }
    
    // Remove the match
    await GymBrosMatch.findByIdAndDelete(matchId);
    
    logger.info(`Match ${matchId} removed by user ${userIdentifier}`);
    
    // Prepare response
    let responseData = {
      success: true,
      message: 'Match removed successfully'
    };
    
    // Add guest token if applicable
    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
    }
    
    return res.json(responseData);
  } catch (error) {
    logger.error(`Error removing match: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove match'
    });
  }
};

// Corrected functions for server/src/controllers/gymBrosController.js
// Returns users who liked me WITHOUT existing matches

// Helper function to find all users who liked the current user, excluding matches
export const findUsersWhoLikedMe = async (effectiveUser) => {
  try {
    // Create arrays to store all possible IDs for the current user
    let userIds = [];
    let profileIds = [];

    // For logged-in users, collect both userId and profileId (if exists)
    if (effectiveUser.userId) {
      userIds.push(effectiveUser.userId);
      
      // Also get their profile ID if they have one
      const userProfile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (userProfile) {
        profileIds.push(userProfile._id);
      }
    } 
    
    // For guest users who have a profileId
    if (effectiveUser.profileId) {
      profileIds.push(effectiveUser.profileId);
    }
    
    // Convert all IDs to strings for comparison
    const allCurrentUserIds = [
      ...userIds.map(id => id.toString()),
      ...profileIds.map(id => id.toString())
    ];
    
    logger.debug(`Finding users who liked me - Current user IDs: ${allCurrentUserIds.join(', ')}`);
    
    // Find all preferences where the current user's IDs are in likedProfiles
    let whoLikedMePrefs = [];
    
    // Check for likes targeting userId
    if (userIds.length > 0) {
      const userIdLikes = await GymBrosPreference.find({
        likedProfiles: { $in: userIds }
      });
      whoLikedMePrefs = [...whoLikedMePrefs, ...userIdLikes];
    }
    
    // Check for likes targeting profileId
    if (profileIds.length > 0) {
      const profileIdLikes = await GymBrosPreference.find({
        likedProfiles: { $in: profileIds }
      });
      whoLikedMePrefs = [...whoLikedMePrefs, ...profileIdLikes];
    }
    
    // Extract all possible IDs from the preferences (both userId and profileId)
    const whoLikedMeIds = new Set();
    whoLikedMePrefs.forEach(pref => {
      if (pref.userId) whoLikedMeIds.add(pref.userId.toString());
      if (pref.profileId) whoLikedMeIds.add(pref.profileId.toString());
    });
    
    logger.debug(`Found ${whoLikedMeIds.size} users who liked current user`);
    
    // Now find existing matches to exclude them
    let existingMatches = [];
    
    // Check for matches with any of the current user's IDs
    for (const currentId of allCurrentUserIds) {
      const matches = await GymBrosMatch.find({
        users: currentId,
        active: true
      });
      existingMatches = [...existingMatches, ...matches];
    }
    
    // Extract all users who are already matched with current user
    const matchedUserIds = new Set();
    existingMatches.forEach(match => {
      match.users.forEach(matchUserId => {
        const matchUserIdStr = matchUserId.toString();
        // Only add if it's not one of the current user's IDs
        if (!allCurrentUserIds.includes(matchUserIdStr)) {
          matchedUserIds.add(matchUserIdStr);
        }
      });
    });
    
    logger.debug(`Found ${matchedUserIds.size} existing matches to exclude`);
    
    // Filter out users who are already matched
    const potentialMatches = Array.from(whoLikedMeIds).filter(id => 
      !matchedUserIds.has(id) && !allCurrentUserIds.includes(id)
    );

    //('Potential matches:', potentialMatches);
    
    return potentialMatches;
  } catch (error) {
    logger.error('Error in findUsersWhoLikedMe:', error);
    return [];
  }
};

// GET count of "Who Liked Me" profiles
export const getWhoLikedMeCount = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Get users who have liked the current user but aren't matched yet
    const potentialMatches = await findUsersWhoLikedMe(effectiveUser);
    
    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      const guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
      logger.debug(`getWhoLikedMeCount: Generated guest token for response`);
      
      return res.json({
        count: potentialMatches.length,
        guestToken,
        isGuest: true
      });
    }
    
    // For logged-in users, just return the count
    return res.json(potentialMatches.length);
  } catch (error) {
    logger.error('Error in getWhoLikedMeCount:', error);
    res.status(500).json({ error: 'Failed to retrieve who liked me count' });
  }
};

// GET profiles of "Who Liked Me" with limited information
export const getWhoLikedMeProfiles = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Get users who have liked the current user but aren't matched yet
    const potentialMatches = await findUsersWhoLikedMe(effectiveUser);
    
    if (potentialMatches.length === 0) {
      // No users have liked the current user (or they're all already matched)
      if (effectiveUser.isGuest) {
        const guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
        return res.json({
          profiles: [],
          premium: false,
          guestToken,
          isGuest: true
        });
      }
      return res.json([]);
    }
    
    // Convert string IDs to ObjectIds for database query
    const objectIdMatches = potentialMatches.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (err) {
        logger.warn(`Invalid ObjectId: ${id}`);
        return null;
      }
    }).filter(id => id !== null);
    
    // Get profiles for these users with limited information
    // Need to look up by both userId and _id (profile ID)
    const profiles = await GymBrosProfile.find({
      $or: [
        { userId: { $in: objectIdMatches } },
        { _id: { $in: objectIdMatches } }
      ]
    }).select('_id name age profileImage images'); // Only select needed fields
    
    // Check if this is a premium user or someone paying with points
    const isPremium = req.query.premium === 'true' || req.query.usedPoints === 'true';
    
    // For non-premium users, blur/limit the information
    const limitedProfiles = profiles.map(profile => {
      const profileData = profile.toObject();
      
      if (!isPremium) {
        // For non-premium users, limit the information
        return {
          _id: profileData._id,
          name: profileData.name.charAt(0) + '...',
          age: profileData.age,
          blurred: true,
          profileImage: profileData.profileImage,
          // No additional information for non-premium
        };
      }
      
      // Return full profile data for premium users
      return profileData;
    });
    
    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      const guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
      
      return res.json({
        profiles: limitedProfiles,
        premium: isPremium,
        guestToken,
        isGuest: true
      });
    }
    
    // For logged-in users
    return res.json(limitedProfiles);
  } catch (error) {
    logger.error('Error in getWhoLikedMeProfiles:', error);
    res.status(500).json({ error: 'Failed to retrieve who liked me profiles' });
  }
};
export const updateUserPreferences = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    const preferences = req.body;

    // Need either userId, profileId or phone
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        message: 'Authentication required to update preferences',
        requiresVerification: true
      });
    }
    
    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Invalid preferences data' });
    }
    
    let prefIdentifier = {};
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        prefIdentifier.profileId = effectiveUser.profileId;
      } else if (effectiveUser.phone) {
        prefIdentifier.phone = effectiveUser.phone;
      }
    } else {
      prefIdentifier.userId = effectiveUser.userId;
    }

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

    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      const responseData = userPreferences.toObject();
      responseData.guestToken = req.headers['x-gymbros-guest-token'];
      return res.json(responseData);
    }
    
    // Return updated preferences
    res.status(200).json(userPreferences);
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    handleError(error, req, res);
  }
};

export const getUserSettings = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId, profileId or phone
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        message: 'Authentication required to get settings',
        requiresVerification: true
      });
    }
    
    // Find user preferences or return default settings
    let prefIdentifier = {};
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        prefIdentifier.profileId = effectiveUser.profileId;
      } else if (effectiveUser.phone) {
        prefIdentifier.phone = effectiveUser.phone;
      }
    } else {
      prefIdentifier.userId = effectiveUser.userId;
    }
    
    let preferences = await GymBrosPreference.findOne(prefIdentifier);

    if (!preferences) {
      // Return default settings if none found
      const defaultSettings = {
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
      };
      
      // Include guest token in response if applicable
      if (effectiveUser.isGuest) {
        defaultSettings.guestToken = req.headers['x-gymbros-guest-token'];
        defaultSettings.isGuest = true;
      }
      
      return res.json(defaultSettings);
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

    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      settings.guestToken = req.headers['x-gymbros-guest-token'];
      settings.isGuest = true;
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    handleError(error, req, res);
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    const settingsData = req.body;

    // Need either userId, profileId or phone
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        message: 'Authentication required to update settings',
        requiresVerification: true
      });
    }

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
    let prefIdentifier = {};
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        prefIdentifier.profileId = effectiveUser.profileId;
      } else if (effectiveUser.phone) {
        prefIdentifier.phone = effectiveUser.phone;
      }
    } else {
      prefIdentifier.userId = effectiveUser.userId;
    }
    
    let preferences = await GymBrosPreference.findOne(prefIdentifier);
    
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
        ...prefIdentifier,
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

    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      responseSettings.guestToken = req.headers['x-gymbros-guest-token'];
      responseSettings.isGuest = true;
    }

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
    //('Deleting GymBros profile for user:', userId);

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
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
      return res.status(401).json({ 
        message: 'Authentication required to get preferences',
        requiresVerification: true
      });
    }
    
    let prefIdentifier = {};
    
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        prefIdentifier.profileId = effectiveUser.profileId;
      } else if (effectiveUser.phone) {
        prefIdentifier.phone = effectiveUser.phone;
      }
    } else {
      prefIdentifier.userId = effectiveUser.userId;
    }
    
    // Find user preferences or return default settings
    let preferences = await GymBrosPreference.findOne(prefIdentifier);

    if (!preferences) {
      // Return default preferences if none found
      const defaultPrefs = {
        workoutTypes: [],
        experienceLevel: 'any',
        preferredTime: 'any',
        genderPreference: 'all',
        ageRange: { min: 18, max: 99 },
        maxDistance: 50
      };
      
      // Add guest token to response
      const responseData = effectiveUser.isGuest ? 
        { ...defaultPrefs, guestToken: req.headers['x-gymbros-guest-token'] } : 
        defaultPrefs;
      
      return res.json(responseData);
    }

    // Include guest token in response if applicable
    if (effectiveUser.isGuest) {
      const responseData = preferences.toObject();
      responseData.guestToken = req.headers['x-gymbros-guest-token'];
      return res.json(responseData);
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
    
    // Always treat as production: send SMS via Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Enhanced debug logging
    console.info(`[GymBros] Sending verification code to ${phone} (SID: ${accountSid ? 'set' : 'missing'}, Auth: ${authToken ? 'set' : 'missing'}, From: ${twilioPhone || 'missing'})`);
    console.info(`[GymBros] Verification code: ${verificationCode}`);

    // Check for Twilio credentials
    if (!accountSid || !authToken || !twilioPhone) {
      console.error('[GymBros] SMS service configuration missing', { accountSid, authToken, twilioPhone });
      return res.status(500).json({
        success: false,
        message: 'SMS service configuration missing',
        debug: { accountSid, authToken, twilioPhone }
      });
    }

    try {
      // Import Twilio using ES modules syntax
      const twilio = await import('twilio');
      const twilioClient = twilio.default(accountSid, authToken);

      // Send the SMS
      const smsResult = await twilioClient.messages.create({
        body: `Your GymBros verification code is: ${verificationCode}`,
        from: twilioPhone,
        to: phone
      });

      console.info(`[GymBros] Verification SMS sent to ${phone}`, smsResult);

      res.json({ success: true, message: 'Verification code sent' });
    } catch (twilioError) {
      console.error('[GymBros] Twilio error:', twilioError);

      // Provide specific error responses based on Twilio error codes
      if (twilioError.code === 21211) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid phone number format or unverified recipient',
          debug: twilioError
        });
      } else if (twilioError.code === 21608) {
        return res.status(400).json({ 
          success: false,
          message: 'This phone number is not a verified Twilio test number',
          debug: twilioError
        });
      } else if (twilioError.code === 21610) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is unsubscribed from your Twilio account',
          debug: twilioError
        });
      }

      // Return full error details for debugging
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: twilioError.message,
        debug: twilioError
      });
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
      return res.status(400).json({ 
        success: false,
        message: 'Phone and code are required' 
      });
    }
    
    //('Verifying code:', code, 'for phone:', phone);
    
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
    
    // Also generate a guest token for future API calls
    const guestToken = generateGuestToken(phone);
    
    res.json({ 
      success: true,
      message: 'Phone verified successfully',
      token,
      guestToken
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

async function saveBrowsingSession(userId, profileIds) {
  // Implementation depends on your analytics strategy
  // This is a placeholder for future implementation
  // Could save to database, send to analytics service, etc.
}

async function handleProfileCheckByPhone(req, res) {
  const { verifiedPhone, verificationToken } = req.body;
  
  //('Checking profile by verified phone:', verifiedPhone);
  
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
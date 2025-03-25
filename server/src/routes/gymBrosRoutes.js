// server/src/routes/gymBrosRoutes.js

import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { handleGuestUser } from '../middleware/guestUser.middleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// Import controllers
import { 
  checkGymBrosProfile, 
  createOrUpdateGymBrosProfile,
  getGymBrosProfiles,
  likeGymBrosProfile,
  dislikeGymBrosProfile,
  getGymBrosMatches,
  updateUserPreferences,
  getUserSettings,
  updateUserSettings,
  deleteGymBrosProfile,
  getUserPreferences,
  uploadProfileImages,
  deleteProfileImage,
  checkPhoneExists,
  sendVerificationCode,
  verifyCode,
  checkGymBrosProfileByPhone,
  convertGuestToUser,
  getWhoLikedMeCount,
  getWhoLikedMeProfiles,
} from '../controllers/gymBrosController.js';

// Apply guest user middleware to all routes
router.use(handleGuestUser);

// Check if user has a GymBros profile (works for authenticated users and guests)
router.get('/profile', optionalAuthenticate, checkGymBrosProfile);

// Special route for checking profile with just phone verification
router.post('/profile/by-phone', checkGymBrosProfileByPhone); 

// Create or update GymBros profile (works for authenticated users and guests)
router.post('/profile', optionalAuthenticate, createOrUpdateGymBrosProfile);

// Update GymBros profile with automatic saving
router.put('/profile', optionalAuthenticate, createOrUpdateGymBrosProfile);

// Convert guest profile to regular user account after registration
router.post('/convert-guest', authenticate, convertGuestToUser);

// Upload profile images - supports multiple images
router.post('/profile-images', optionalAuthenticate, upload.array('images', 6), uploadProfileImages);

// Delete a specific profile image
router.delete('/profile-image/:imageId', optionalAuthenticate, deleteProfileImage);

// Delete GymBros profile
router.delete('/profile', optionalAuthenticate, deleteGymBrosProfile);

// Get recommended GymBros profiles - works with guests
router.get('/profiles', optionalAuthenticate, getGymBrosProfiles);

// Get user preferences - works with guests
router.get('/preferences', optionalAuthenticate, getUserPreferences);

// Update user preferences - works with guests
router.put('/preferences', optionalAuthenticate, updateUserPreferences);

// Get user settings - works with guests
router.get('/settings', optionalAuthenticate, getUserSettings);

// Update user settings - works with guests
router.put('/settings', optionalAuthenticate, updateUserSettings);

// Like a GymBros profile - works with guests
router.post('/like/:profileId', optionalAuthenticate, likeGymBrosProfile);

// Dislike a GymBros profile - works with guests
router.post('/dislike/:profileId', optionalAuthenticate, dislikeGymBrosProfile);

// Get user matches - works with guests
router.get('/matches', optionalAuthenticate, getGymBrosMatches);

// Get count of users who liked me
router.get('/who-liked-me/count', optionalAuthenticate, getWhoLikedMeCount);

// Get profiles of users who liked me (with limited info for non-premium)
router.get('/who-liked-me', optionalAuthenticate, getWhoLikedMeProfiles);

// Phone verification routes - no authentication required
router.post('/check-phone', checkPhoneExists);
router.post('/send-verification', sendVerificationCode);
router.post('/verify-code', verifyCode);



export default router;
import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';

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
  checkGymBrosProfileByPhone
} from '../controllers/gymBrosController.js';

import upload from '../config/multer.js';

// Check if user has a GymBros profile
router.get('/profile', authenticate, checkGymBrosProfile);

router.post('/profile/by-phone', checkGymBrosProfileByPhone); 

// Create or update GymBros profile
router.post('/profile', optionalAuthenticate, createOrUpdateGymBrosProfile);

// Update GymBros profile with automatic saving (same endpoint as create)
router.put('/profile', optionalAuthenticate, createOrUpdateGymBrosProfile);

// Upload profile images - supports multiple images
router.post('/profile-images', optionalAuthenticate, upload.array('images', 6), uploadProfileImages);

// Delete a specific profile image
router.delete('/profile-image/:imageId', optionalAuthenticate, deleteProfileImage);

// Delete GymBros profile
router.delete('/profile', optionalAuthenticate, deleteGymBrosProfile);

// Get recommended GymBros profiles
router.get('/profiles', optionalAuthenticate, getGymBrosProfiles);

// Get user preferences
router.get('/preferences', optionalAuthenticate, getUserPreferences);

// Update user preferences
router.put('/preferences', optionalAuthenticate, updateUserPreferences);

// Get user settings
router.get('/settings', optionalAuthenticate, getUserSettings);

// Update user settings
router.put('/settings', optionalAuthenticate, updateUserSettings);

// Like a GymBros profile
router.post('/like/:profileId', optionalAuthenticate, likeGymBrosProfile);

// Dislike a GymBros profile
router.post('/dislike/:profileId', optionalAuthenticate, dislikeGymBrosProfile);

// Get user matches
router.get('/matches', optionalAuthenticate, getGymBrosMatches);


router.post('/check-phone', checkPhoneExists);

router.post('/send-verification', sendVerificationCode);

router.post('/verify-code', verifyCode);

export default router;
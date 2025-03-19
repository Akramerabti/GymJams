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
router.put('/profile', authenticate, createOrUpdateGymBrosProfile);

// Upload profile images - supports multiple images
router.post('/profile-images', authenticate, upload.array('images', 6), uploadProfileImages);

// Delete a specific profile image
router.delete('/profile-image/:imageId', authenticate, deleteProfileImage);

// Delete GymBros profile
router.delete('/profile', authenticate, deleteGymBrosProfile);

// Get recommended GymBros profiles
router.get('/profiles', authenticate, getGymBrosProfiles);

// Get user preferences
router.get('/preferences', authenticate, getUserPreferences);

// Update user preferences
router.put('/preferences', authenticate, updateUserPreferences);

// Get user settings
router.get('/settings', authenticate, getUserSettings);

// Update user settings
router.put('/settings', authenticate, updateUserSettings);

// Like a GymBros profile
router.post('/like/:profileId', authenticate, likeGymBrosProfile);

// Dislike a GymBros profile
router.post('/dislike/:profileId', authenticate, dislikeGymBrosProfile);

// Get user matches
router.get('/matches', authenticate, getGymBrosMatches);


router.post('/check-phone', checkPhoneExists);

router.post('/send-verification', sendVerificationCode);

router.post('/verify-code', verifyCode);

export default router;
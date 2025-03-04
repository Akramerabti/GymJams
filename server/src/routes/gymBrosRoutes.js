import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

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
  getUserPreferences // Add this controller function
} from '../controllers/gymBrosController.js';

// Check if user has a GymBros profile
router.get('/profile', authenticate, checkGymBrosProfile);

// Create or update GymBros profile
router.post('/profile', authenticate, createOrUpdateGymBrosProfile);

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

export default router;
import express from 'express';
import {
  checkGymBrosProfile,
  createOrUpdateGymBrosProfile,
  getGymBrosProfiles,
  likeGymBrosProfile,
  dislikeGymBrosProfile,
  getGymBrosMatches,
} from '../controllers/gymBrosController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Check if user has a GymBros profile
router.get('/profile', authenticate, checkGymBrosProfile);

// Create or update GymBros profile
router.post('/profile', authenticate, createOrUpdateGymBrosProfile);

// Get all GymBros profiles (excluding the current user)
router.get('/profiles', authenticate, getGymBrosProfiles);

// Like a GymBros profile
router.post('/like/:profileId', authenticate, likeGymBrosProfile);

// Dislike a GymBros profile
router.post('/dislike/:profileId', authenticate, dislikeGymBrosProfile);

// Get user matches
router.get('/matches', authenticate, getGymBrosMatches);

export default router;
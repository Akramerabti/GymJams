// server/src/routes/gymBrosRoutes.js

import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { handleGuestUser } from '../middleware/guestUser.middleware.js';
import upload from '../config/multer.js';
import gymBrosLocationRoutes from './gymBrosLocation.routes.js';

const router = express.Router();

import { 
  checkGymBrosProfile, 
  createOrUpdateGymBrosProfile,
  getGymBrosProfiles,
  likeGymBrosProfile,
  dislikeGymBrosProfile,
  getGymBrosMatches,
  removeMatch,
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
  initializeGymBros,
  getGymBrosMapUsers
} from '../controllers/gymBrosController.js';

// Import message controllers
import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  findMatch,
} from '../controllers/gymBrosMessagesController.js';

// Add these routes to server/src/routes/gymBrosRoutes.js

import { 
  activateBoost, 
  getActiveBoosts, 
  cancelBoost,
  getBoostLimits
} from '../controllers/gymBrosBoostController.js';

import {
  sendSuperLike,
  getReceivedSuperLikes,
  markSuperLikeViewed,
  respondToSuperLike,
  getSuperLikeLimits
} from '../controllers/gymBrosSuperLikeController.js';

import {
  purchaseMembership,
  getActiveMembership,
  cancelMembership,
  getMembershipTypes,
  getMembershipHistory
} from '../controllers/gymBrosMembershipController.js';

// Apply guest user middleware to all routes
router.use(handleGuestUser);

router.get('/initialize', optionalAuthenticate, initializeGymBros);

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

router.get('/map/users', optionalAuthenticate, getGymBrosMapUsers);

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

// Remove a match - works with guests  
router.delete('/matches/:matchId', optionalAuthenticate, removeMatch);

// Get count of users who liked me
router.get('/who-liked-me/count', optionalAuthenticate, getWhoLikedMeCount);

// Get profiles of users who liked me (with limited info for non-premium)
router.get('/who-liked-me', optionalAuthenticate, getWhoLikedMeProfiles);

// Phone verification routes - no authentication required
router.post('/check-phone', checkPhoneExists);
router.post('/send-verification', sendVerificationCode);
router.post('/verify-code', verifyCode);

// New Message API Routes
router.post('/matches/:matchId/messages', optionalAuthenticate, sendMessage);
router.get('/matches/:matchId/messages', optionalAuthenticate, getMessages);
router.put('/matches/:matchId/mark-read', optionalAuthenticate, markMessagesAsRead);
router.get('/matches/find-match/:userId', optionalAuthenticate, findMatch);

// Boost management endpoints
router.post('/boosts', optionalAuthenticate, activateBoost);
router.get('/boosts', optionalAuthenticate, getActiveBoosts);
router.delete('/boosts/:boostId', optionalAuthenticate, cancelBoost);
router.get('/boost-limits', optionalAuthenticate, getBoostLimits);

// Super Like endpoints
router.post('/super-likes', optionalAuthenticate, sendSuperLike);
router.get('/super-likes/received', optionalAuthenticate, getReceivedSuperLikes);
router.put('/super-likes/:superLikeId/view', optionalAuthenticate, markSuperLikeViewed);
router.post('/super-likes/:superLikeId/respond', optionalAuthenticate, respondToSuperLike);
router.get('/super-like-limits', optionalAuthenticate, getSuperLikeLimits);

// Membership endpoints
router.post('/memberships', optionalAuthenticate, purchaseMembership);
router.get('/memberships/active', optionalAuthenticate, getActiveMembership);
router.put('/memberships/:membershipId/cancel', optionalAuthenticate, cancelMembership);
router.get('/membership-types', getMembershipTypes);
router.get('/membership-history', optionalAuthenticate, getMembershipHistory);

// Location and gym management routes
router.use('/', gymBrosLocationRoutes);

export default router;
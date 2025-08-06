import express from 'express';
import {
  getProfile,
  updateProfile,
  updateLocation,
  changePassword,
  getPoints,
  getUserDashboardData,
  getCoachDashboardData,
  updateClientStats,
  updatePoints,
  checkDailyGames, 
  completeGame,
  dailyCount,
  uploadFile,
  rateCoach,
  checkUserRating,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../config/passport.js';
import {
  validateProfileUpdate,
  validatePasswordReset,
} from '../middleware/validate.middleware.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { requirePhone, requireCompleteProfile } from '../middleware/requirePhone.middleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// All user routes BELOW are protected
router.use(authenticateJWT);
router.use(requirePhone); // Ensure users have phone numbers for all protected routes

router.post('/update-points', optionalAuthenticate, updatePoints);
router.post('/change-password',  validatePasswordReset, changePassword);
router.get('/profile', getProfile);
router.get('/points', getPoints);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/location', updateLocation);
router.post('/upload', upload.array('files'), uploadFile);
router.post('/:coachId/user-rating', authenticate, checkUserRating);
router.post('/:coachId/rate', authenticate, rateCoach);



router.get('/dashboard/user', getUserDashboardData);
router.get('/dashboard/coach', getCoachDashboardData);
router.put('/:subscriptionId/stats', updateClientStats);
router.get('/check-games', authenticate, checkDailyGames);
router.post('/complete', authenticate, completeGame);
router.get('/daily-count', authenticate, dailyCount);



export default router;
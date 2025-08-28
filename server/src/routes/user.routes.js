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
import {
  validateProfileUpdate,
  validatePasswordReset,
} from '../middleware/validate.middleware.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { requirePhone, requireCompleteProfile } from '../middleware/requirePhone.middleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// Routes that might need optional authentication (if any)
router.post('/update-points', optionalAuthenticate, updatePoints);

router.use(authenticate);
router.use(requirePhone);

// Protected routes
router.post('/change-password', validatePasswordReset, changePassword);
router.get('/profile', getProfile);
router.get('/points', getPoints);
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/location', updateLocation);
router.post('/upload', upload.array('files'), uploadFile);
router.post('/:coachId/user-rating', checkUserRating);
router.post('/:coachId/rate', rateCoach);

router.get('/dashboard/user', getUserDashboardData);
router.get('/dashboard/coach', getCoachDashboardData);
router.put('/:subscriptionId/stats', updateClientStats);
router.get('/check-games', checkDailyGames);
router.post('/complete', completeGame);
router.get('/daily-count', dailyCount);

export default router;
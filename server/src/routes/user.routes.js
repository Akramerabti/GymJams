import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPoints,
  getUserDashboardData,
  getCoachDashboardData,
  updateClientStats,
  updatePoints,
  getDailyGames,
  completeMemoryGame,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../config/passport.js';
import {
  validateProfileUpdate,
  validatePasswordReset,
} from '../middleware/validate.middleware.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes BELOW are protected
router.use(authenticateJWT);

router.post('/update-points', optionalAuthenticate, updatePoints);
router.post('/change-password',  validatePasswordReset, changePassword);
router.get('/profile', getProfile);
router.get('/points', getPoints);
router.put('/profile', validateProfileUpdate, updateProfile);


router.get('/dashboard/user', getUserDashboardData);
router.get('/dashboard/coach', getCoachDashboardData);
router.put('/:subscriptionId/stats', updateClientStats);
router.get('/daily-count', authenticate, getDailyGames);
router.post('/complete', authenticate, completeMemoryGame);


export default router;
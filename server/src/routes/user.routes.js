import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPoints,
  getUserDashboardData,
  getCoachDashboardData,
  updateClientStats,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../config/passport.js';
import {
  validateProfileUpdate,
  validatePasswordReset,
} from '../middleware/validate.middleware.js';

const router = express.Router();

// All user routes BELOW are protected
router.use(authenticateJWT);

router.get('/profile', getProfile);
router.get('/points', getPoints);
router.put('/profile', validateProfileUpdate, updateProfile);
router.post('/change-password',  validatePasswordReset, changePassword);

router.get('/dashboard/user', getUserDashboardData);
router.get('/dashboard/coach', getCoachDashboardData);
router.put('/:subscriptionId/stats', updateClientStats);

export default router;
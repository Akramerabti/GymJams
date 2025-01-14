import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPoints,
  getCoach,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../config/passport.js';
import {
  validateProfileUpdate,
  validatePasswordReset,
} from '../middleware/validate.middleware.js';

const router = express.Router();

router.get('/coach', getCoach); //Not protected

// All user routes BELOW are protected
router.use(authenticateJWT);

router.get('/profile', getProfile);
router.get('/points', getPoints);
router.put('/profile', validateProfileUpdate, updateProfile);
router.post('/change-password',  validatePasswordReset, changePassword);

export default router;
import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/user.controller.js';
import { authenticateJWT } from '../config/passport.js';
import {
  validateProfileUpdate,
  validatePasswordChange,
} from '../middleware/validate.middleware.js';

const router = express.Router();

// All user routes are protected
router.use(authenticateJWT);

router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
router.post('/change-password', validatePasswordChange, changePassword);

export default router;
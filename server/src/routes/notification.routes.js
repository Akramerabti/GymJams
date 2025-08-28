import express from 'express';
import {
  registerToken,
  unregisterToken,
  updatePreferences,
  getPreferences,
  sendToAllUsers
} from '../controllers/notificationController.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// User routes
router.post('/register-token', authenticate, registerToken);
router.post('/unregister-token', authenticate, unregisterToken);
router.put('/preferences', authenticate, updatePreferences);
router.get('/preferences', authenticate, getPreferences);

// Admin routes
router.post('/send-all', authenticate, isAdmin, sendToAllUsers);

export default router;
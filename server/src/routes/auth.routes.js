import express from 'express';
import { verifyEmail, register, login, getProfile, updateProfile, validateToken, resendVerificationEmail } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRegistration, validateLogin } from '../middleware/validate.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/verify-email/:token', verifyEmail);
router.get('/validate', authenticate, validateToken); 
router.post('/resend-verification-email', resendVerificationEmail);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
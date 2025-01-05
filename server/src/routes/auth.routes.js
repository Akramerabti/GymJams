import express from 'express';
import { verifyEmail, register, login, getProfile, updateProfile, validateToken, resendVerificationEmail, validatePhone, forgotPassword, resetPassword  } from '../controllers/auth.controller.js';
import { 
    createSubscription, 
    getSubscriptionStatus,
    cancelSubscription 
  } from '../controllers/subscription.Controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRegistration, validateLogin, validatePasswordReset } from '../middleware/validate.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/validate-phone', validatePhone);
router.get('/validate', authenticate, validateToken); 
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validatePasswordReset, resetPassword);

router.post('/subscription', createSubscription);
router.get('/subscription/:id', authenticate, getSubscriptionStatus);
router.post('/subscription/:id/cancel', authenticate, cancelSubscription);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
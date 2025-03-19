import express from 'express';
import { verifyEmail, register, login, getCoach,deleteAccount , getCoachById, getProfile, 
    updateProfile, validateToken, resendVerificationEmail, validatePhone, forgotPassword,
     resetPassword, logout, loginWithPhone, registerWithPhone} from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateRegistration, validateLogin, validatePasswordReset } from '../middleware/validate.middleware.js';
import upload from '../config/multer.js';

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
router.get('/coach', optionalAuthenticate, getCoach);
router.delete('/delete-account', authenticate, deleteAccount);
router.get('/coach/:coachId', optionalAuthenticate, getCoachById);
router.post('/phone-login', loginWithPhone);
router.post('/phone-register', registerWithPhone);

 //Not protected

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('profileImage'), updateProfile);

router.post('/logout', authenticate, logout); // Add the logout route

export default router;
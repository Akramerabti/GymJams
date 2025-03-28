import express from 'express';
import { verifyEmail, register, login, getCoach,deleteAccount , getCoachById, getProfile, 
    updateProfile, validateToken, resendVerificationEmail, validatePhone, forgotPassword,
     resetPassword, logout, loginWithPhone, registerWithPhone, loginWithTokenFORPHONE, completeOAuthProfile} from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateRegistration, validateLogin, validatePasswordReset } from '../middleware/validate.middleware.js';
import passport from '../config/passport.js';
import { generateToken } from '../utils/jwt.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/loginwithtoken', loginWithTokenFORPHONE);
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
router.post('/complete-oauth-profile', authenticate, completeOAuthProfile);

router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google-auth-failed' }),
    (req, res) => {
      // Generate JWT token
      const token = generateToken({ id: req.user._id });
      
      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
    }
  );
  
 //Not protected

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('profileImage'), updateProfile);

router.post('/logout', authenticate, logout); // Add the logout route





export default router;
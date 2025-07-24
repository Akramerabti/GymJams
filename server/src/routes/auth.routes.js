import express from 'express';
import { verifyEmail, register, login, getCoach,deleteAccount , getCoachById, getProfile, 
    updateProfile, validateToken, resendVerificationEmail, validatePhone, forgotPassword,
     resetPassword, logout, loginWithPhone, registerWithPhone, loginWithTokenFORPHONE, completeOAuthProfile, cleanupProfileImage} from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { requirePhone, requireCompleteProfile } from '../middleware/requirePhone.middleware.js';
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
router.post('/complete-oauth-profile', optionalAuthenticate, completeOAuthProfile);

router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );    router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed` }),
    (req, res) => {
      try {
        // Handle different OAuth response types
        if (req.user.requiresCompletion) {
          // User needs to complete profile - create a temporary token with OAuth data
          let tempToken;
          
          if (req.user.existingUser) {
            // Existing user with incomplete profile
            tempToken = generateToken({ 
              id: req.user.existingUser._id,
              isTemporary: true,
              requiresCompletion: true 
            });
          } else {
            // New user - store OAuth profile in temporary token
            tempToken = generateToken({ 
              oauthProfile: req.user.oauthProfile,
              isTemporary: true,
              requiresCompletion: true 
            });
          }
          
          // Redirect to profile completion page
          return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?tempToken=${tempToken}&incomplete=true`);
        } else {
          // Complete user - generate normal token
          const token = generateToken({ id: req.user._id });
          return res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth-processing-failed`);
      }
    }
  );


// Protected routes
router.get('/profile', authenticate, requirePhone, getProfile);
router.put('/profile', authenticate, requirePhone, upload.single('profileImage'), updateProfile);

router.post('/logout', authenticate, logout); // Add the logout route





export default router;
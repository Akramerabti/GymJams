import express from 'express';
import { verifyEmail, register, login, getCoach, deleteAccount, getCoachById, getProfile, 
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

// OAuth routes - Clean redirect implementation
router.get('/google', (req, res, next) => {
    // Store the return URL for after authentication
    const returnTo = req.query.returnTo || req.headers.referer || process.env.CLIENT_URL || 'http://localhost:5173';
    req.session.returnTo = returnTo;
    
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })(req, res, next);
});

router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const returnTo = req.session?.returnTo || clientUrl;
            
            // Handle authentication failure
            if (!req.user) {
                console.error('OAuth: No user returned from Google');
                return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
            }

            // Handle different OAuth response types
            if (req.user.requiresCompletion) {
                if (req.user.existingUser) {
                    // Existing user with incomplete profile - redirect to complete profile
                    const tempToken = generateToken({ 
                        id: req.user.existingUser._id,
                        isTemporary: true,
                        requiresCompletion: true 
                    });
                    
                    // Store temp token in a way that the client can access it
                    return res.redirect(`${clientUrl}/complete-profile?tempToken=${tempToken}&existingUser=true&userId=${req.user.existingUser._id}`);
                } else {
                    // New user - redirect to OAuth profile completion
                    const tempToken = generateToken({ 
                        oauthProfile: req.user.oauthProfile,
                        isTemporary: true,
                        requiresCompletion: true 
                    });
                    
                    return res.redirect(`${clientUrl}/complete-oauth-profile?tempToken=${tempToken}`);
                }
            } else {
                // Complete user - successful login
                const token = generateToken({ id: req.user._id });
                
                // Redirect with token - the frontend will handle storing it
                return res.redirect(`${returnTo}?token=${token}&loginSuccess=true`);
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('An error occurred during authentication. Please try again.')}`);
        }
    }
);

// Handle OAuth failures
router.get('/google/failure', (req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const error = req.query.error || 'Authentication failed. Please try again.';
    res.redirect(`${clientUrl}/login?error=${encodeURIComponent(error)}`);
});

// Protected routes
router.get('/profile', authenticate, requirePhone, getProfile);
router.put('/profile', authenticate, requirePhone, upload.single('profileImage'), updateProfile);
router.post('/logout', authenticate, logout);

export default router;
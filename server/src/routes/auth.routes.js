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

// OAuth Routes - Now properly handling both web and mobile

// Standard web OAuth route
router.get('/google', (req, res, next) => {
    // Store the return URL for after authentication
    const returnTo = req.query.returnTo || req.headers.referer || process.env.CLIENT_URL || 'http://localhost:5173';
    req.session.returnTo = returnTo;
    // Clear any mobile redirect URI to ensure this is treated as web
    req.session.mobileRedirectUri = null;
    
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })(req, res, next);
});

// Mobile OAuth route - specifically for mobile apps
router.get('/google/mobile', (req, res, next) => {
    // Store the mobile redirect URI for callback
    const redirectUri = req.query.redirectUri || 'com.akram.gymtonic://oauth/callback';
    req.session.mobileRedirectUri = redirectUri;
    // Clear any web return URL to ensure this is treated as mobile
    req.session.returnTo = null;
    
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })(req, res, next);
});

// Unified callback that handles both web and mobile
router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const mobileRedirectUri = req.session?.mobileRedirectUri;
            const returnTo = req.session?.returnTo || clientUrl;

            const isMobileCallback = !!mobileRedirectUri;
            
            console.log('OAuth callback - isMobile:', isMobileCallback, 'mobileRedirectUri:', mobileRedirectUri);
            
            // Handle authentication failure
            if (!req.user) {
                console.error('OAuth: No user returned from Google');
                const errorMessage = encodeURIComponent('Authentication failed. Please try again.');
                
                if (isMobileCallback) {
                    return res.redirect(`${mobileRedirectUri}?error=${errorMessage}`);
                } else {
                    return res.redirect(`${clientUrl}/login?error=${errorMessage}`);
                }
            }

            // Handle profile completion requirement
            if (req.user.requiresCompletion) {
                let tempToken;
                
                if (req.user.existingUser) {
                    // Existing user with incomplete profile
                    tempToken = generateToken({ 
                        id: req.user.existingUser._id,
                        isTemporary: true,
                        requiresCompletion: true 
                    });
                } else {
                    // New user
                    tempToken = generateToken({ 
                        oauthProfile: req.user.oauthProfile,
                        isTemporary: true,
                        requiresCompletion: true 
                    });
                }

                const existingUserParam = req.user.existingUser ? 'true' : 'false';
                
                if (isMobileCallback) {
                    // Mobile: Send to deep link
                    return res.redirect(`${mobileRedirectUri}?tempToken=${tempToken}&existingUser=${existingUserParam}`);
                } else {
                    // Web: Send to appropriate completion page
                    if (req.user.existingUser) {
                        return res.redirect(`${clientUrl}/complete-profile?tempToken=${tempToken}&existingUser=${existingUserParam}&userId=${req.user.existingUser._id}`);
                    } else {
                        return res.redirect(`${clientUrl}/complete-oauth-profile?tempToken=${tempToken}`);
                    }
                }
            }

            // Complete user - successful login
            const token = generateToken({ id: req.user._id, email: req.user.email });
            
            if (isMobileCallback) {
                // Mobile: Send to deep link
                console.log('Redirecting mobile user to:', `${mobileRedirectUri}?token=${token}&loginSuccess=true`);
                return res.redirect(`${mobileRedirectUri}?token=${token}&loginSuccess=true`);
            } else {
                // Web: Send to return URL
                console.log('Redirecting web user to:', `${returnTo}?token=${token}&loginSuccess=true`);
                return res.redirect(`${returnTo}?token=${token}&loginSuccess=true`);
            }
            
        } catch (error) {
            console.error('OAuth callback error:', error);
            const errorMessage = encodeURIComponent('An error occurred during authentication. Please try again.');
            
            const mobileRedirectUri = req.session?.mobileRedirectUri;
            if (mobileRedirectUri) {
                return res.redirect(`${mobileRedirectUri}?error=${errorMessage}`);
            } else {
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                return res.redirect(`${clientUrl}/login?error=${errorMessage}`);
            }
        } finally {
            // Clean up session
            if (req.session) {
                req.session.mobileRedirectUri = null;
                req.session.returnTo = null;
            }
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
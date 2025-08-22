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

// Helper function to generate OAuth success/error HTML
const generateOAuthResponseHTML = (data, isError = false) => {
  const messageType = isError ? 'OAUTH_ERROR' : 'OAUTH_SUCCESS';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication ${isError ? 'Error' : 'Success'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: ${isError 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                color: white;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
            }
            .container {
                max-width: 400px;
                padding: 2rem;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
                margin: 0 auto 1rem;
            }
            .icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            .error-icon { color: #ff4757; }
            .success-icon { color: #2ed573; }
            h2 { margin: 0 0 1rem 0; font-size: 1.5rem; }
            p { margin: 0; opacity: 0.9; }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            ${isError ? 
              '<div class="icon error-icon">❌</div><h2>Authentication Failed</h2>' : 
              '<div class="spinner"></div><h2>Authentication Successful!</h2>'
            }
            <p>${isError ? 'Please try again.' : 'Redirecting you back to the app...'}</p>
        </div>

        <script>
            try {
                const data = ${JSON.stringify({ type: messageType, ...data })};
                
                // For popup windows
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(data, '${clientUrl}');
                    setTimeout(() => window.close(), ${isError ? '3000' : '1500'});
                } 
                // For iframe contexts
                else if (window.parent && window.parent !== window) {
                    window.parent.postMessage(data, '${clientUrl}');
                }
                // Fallback - redirect to main app
                else {
                    setTimeout(() => {
                        ${isError ? 
                          `window.location.href = '${clientUrl}/login?error=' + encodeURIComponent(data.error);` :
                          `window.location.href = '${clientUrl}' + (data.token ? '?token=' + data.token : '');`
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                ${isError ? '' : `
                setTimeout(() => {
                    window.location.href = '${clientUrl}/login?error=oauth-callback-error';
                }, 2000);
                `}
            }
        </script>
    </body>
    </html>
  `;
};

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

// OAuth routes
router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            // Handle authentication failure
            if (!req.user) {
                return res.send(generateOAuthResponseHTML({
                    error: 'Authentication failed. Please try again.'
                }, true));
            }

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
                    
                    return res.send(generateOAuthResponseHTML({
                        tempToken,
                        requiresCompletion: true,
                        existingUser: true,
                        user: {
                            id: req.user.existingUser._id,
                            email: req.user.existingUser.email,
                            firstName: req.user.existingUser.firstName,
                            lastName: req.user.existingUser.lastName || ''
                        }
                    }));
                } else {
                    // New user - store OAuth profile in temporary token
                    tempToken = generateToken({ 
                        oauthProfile: req.user.oauthProfile,
                        isTemporary: true,
                        requiresCompletion: true 
                    });
                    
                    return res.send(generateOAuthResponseHTML({
                        tempToken,
                        requiresCompletion: true,
                        existingUser: false,
                        oauthProfile: req.user.oauthProfile
                    }));
                }
            } else {
                // Complete user - generate normal token and user data
                const token = generateToken({ id: req.user._id });
                
                return res.send(generateOAuthResponseHTML({
                    token,
                    user: {
                        id: req.user._id,
                        email: req.user.email,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        phone: req.user.phone,
                        profileImage: req.user.profileImage,
                        isEmailVerified: req.user.isEmailVerified
                    }
                }));
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            return res.send(generateOAuthResponseHTML({
                error: 'An error occurred during authentication. Please try again.'
            }, true));
        }
    }
);

// Handle OAuth failures
router.get('/google/callback', (error, req, res, next) => {
    if (error) {
        console.error('OAuth error:', error);
        return res.send(generateOAuthResponseHTML({
            error: error.message || 'Authentication failed. Please try again.'
        }, true));
    }
    next();
});

// Protected routes
router.get('/profile', authenticate, requirePhone, getProfile);
router.put('/profile', authenticate, requirePhone, upload.single('profileImage'), updateProfile);
router.post('/logout', authenticate, logout);

export default router;
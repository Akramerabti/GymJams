// config/passport.js
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

// JWT Strategy
passport.use(
  new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id).select('-password');
      
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      logger.error('Passport JWT strategy error:', error);
      return done(error, false);
    }
  })
);

// Google OAuth Strategy - Updated for clean redirect flow
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('Google OAuth Profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });
        
        // Extract profile information
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName || '';
        const nameArray = displayName.split(' ');
        const firstName = nameArray[0] || profile.name?.givenName || '';
        const lastName = nameArray.slice(1).join(' ') || profile.name?.familyName || '';
        const profileImage = profile.photos?.[0]?.value || '';
        
        if (!email) {
          logger.error('No email found in Google profile');
          return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists with this Google ID
        let existingUser = await User.findOne({ 'oauth.googleId': googleId });
        
        if (existingUser) {
          // User with this Google ID exists
          const needsPhone = !existingUser.phone || existingUser.phone === '';
          const needsLastName = !existingUser.lastName || existingUser.lastName === '';
            
          if (needsPhone || needsLastName) {
            // Existing Google user needs to complete profile
            return done(null, {
              requiresCompletion: true,
              existingUser: existingUser
            });
          } else {
            // Complete existing Google user - ready to login
            return done(null, existingUser);
          }
        }

        // Check if user exists with this email (for account linking)
        existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
          // User with this email exists - link Google account
          const needsPhone = !existingUser.phone || existingUser.phone === '';
          const needsLastName = !existingUser.lastName || existingUser.lastName === '';
          
          // Link Google ID to existing account
          existingUser.oauth = {
            ...existingUser.oauth,
            googleId: googleId,
            lastProvider: 'google'
          };
          existingUser.isEmailVerified = true; // Trust Google's email verification
          
          // Update profile image if user doesn't have one
          if (!existingUser.profileImage && profileImage) {
            existingUser.profileImage = profileImage;
          }
          
          await existingUser.save();
          
          if (needsPhone || needsLastName) {
            // Existing user needs to complete profile
            return done(null, {
              requiresCompletion: true,
              existingUser: existingUser
            });
          } else {
            // Complete existing user - ready to login
            return done(null, existingUser);
          }
        }
        
        // New user - prepare OAuth profile for completion
        const needsLastName = !lastName || lastName.trim() === '';
        const needsPhoneNumber = true; // Always need phone for new OAuth users
        
        const oauthProfile = {
          googleId,
          email: email.toLowerCase(),
          firstName,
          lastName,
          profileImage,
          provider: 'google',
          isEmailVerified: true, // Google emails are pre-verified
          needsLastName,
          needsPhoneNumber
        };
        
        // Return OAuth profile data for completion
        return done(null, {
          requiresCompletion: true,
          oauthProfile
        });
        
      } catch (error) {
        logger.error('Google OAuth Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);


// Serialize user for session (required by Passport but we're not using sessions)
passport.serializeUser((user, done) => {
  // Handle both user objects and OAuth response objects
  if (user._id) {
    done(null, user._id);
  } else if (user.existingUser?._id) {
    done(null, user.existingUser._id);
  } else {
    // For OAuth completion cases, we'll serialize the whole object
    done(null, user);
  }
});

// Deserialize user from session
passport.deserializeUser(async (data, done) => {
  try {
    // If it's a MongoDB ObjectId string, fetch the user
    if (typeof data === 'string' && data.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(data).select('-password');
      done(null, user);
    } else {
      // For OAuth completion objects, return as-is
      done(null, data);
    }
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

// Middleware to handle JWT authentication
export const authenticateJWT = passport.authenticate('jwt', { session: false });

// Handle authentication errors
export const handleAuthError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: err.message
    });
  }
  next(err);
};

export default passport;
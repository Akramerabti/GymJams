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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Fix the callback URL to remove any duplicate '/api'
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ 'oauth.googleId': profile.id });
        
        if (user) {
          // User exists - allow login if profile is complete
          if (user.phone && user.lastName) {
            return done(null, user);
          } else {
            // User exists but profile is incomplete - require completion
            return done(null, { 
              isIncomplete: true, 
              existingUser: user,
              requiresCompletion: true 
            });
          }
        }
        
        // Check if user with same email exists (for account linking)
        if (profile.emails && profile.emails.length > 0) {
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // Link Google account to existing user if they have complete profile
            if (user.phone && user.lastName) {
              user.oauth = {
                ...user.oauth,
                googleId: profile.id,
                lastProvider: 'google'
              };
              user.isEmailVerified = true; // Trust Google's email verification
              await user.save();
              return done(null, user);
            } else {
              // Existing user but incomplete profile - require completion
              return done(null, { 
                isIncomplete: true, 
                existingUser: user,
                requiresCompletion: true 
              });
            }
          }
        }
        
        // New user - DON'T create user yet, just return OAuth profile data
        const nameArray = profile.displayName ? profile.displayName.split(' ') : [];
        const firstName = nameArray[0] || profile.name?.givenName || '';
        const lastName = nameArray.slice(1).join(' ') || profile.name?.familyName || '';
        
        // Check what fields are missing
        const needsLastName = !lastName || lastName.trim() === '';
        const needsPhoneNumber = true; // Always need phone for new OAuth users
        
        // Return OAuth profile data without creating user
        return done(null, {
          isIncomplete: true,
          oauthProfile: {
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: firstName,
            lastName: lastName || '',
            profileImage: profile.photos[0]?.value || '',
            provider: 'google',
            needsLastName: needsLastName,
            needsPhoneNumber: needsPhoneNumber
          },
          requiresCompletion: true
        });
        
      } catch (error) {
        logger.error('Google strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// Required for Passport session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to handle authentication
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
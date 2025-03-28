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

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos'],
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ 'oauth.googleId': profile.id });
        
        if (!user) {
          // Check if user with same email exists
          if (profile.emails && profile.emails.length > 0) {
            user = await User.findOne({ email: profile.emails[0].value });
          }
          
          if (user) {
            // Link Google account to existing user
            user.oauth = {
              ...user.oauth,
              googleId: profile.id
            };
            user.isEmailVerified = true; // Trust Google's email verification
            await user.save();
          } else {
            // Create a new user
            const nameArray = profile.displayName.split(' ');
            const firstName = nameArray[0] || '';
            const lastName = nameArray.slice(1).join(' ') || '';
            
            user = await User.create({
              email: profile.emails[0].value,
              firstName: firstName,
              lastName: lastName,
              isEmailVerified: true,
              profileImage: profile.photos[0]?.value || '',
              phone: '', // Required field that will need to be filled later
              password: Math.random().toString(36).slice(-16), // Random password
              oauth: {
                googleId: profile.id
              }
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        logger.error('Google strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ 'oauth.facebookId': profile.id });
        
        if (!user) {
          // Check if user with same email exists
          if (profile.emails && profile.emails.length > 0) {
            user = await User.findOne({ email: profile.emails[0].value });
          }
          
          if (user) {
            // Link Facebook account to existing user
            user.oauth = {
              ...user.oauth,
              facebookId: profile.id
            };
            user.isEmailVerified = true; // Trust Facebook's email verification
            await user.save();
          } else {
            // Create a new user
            const firstName = profile.name?.givenName || '';
            const lastName = profile.name?.familyName || '';
            const email = profile.emails && profile.emails.length > 0 
              ? profile.emails[0].value 
              : `${profile.id}@facebook.com`; // Fallback email
              
            user = await User.create({
              email: email,
              firstName: firstName,
              lastName: lastName,
              isEmailVerified: true,
              profileImage: profile.photos?.[0]?.value || '',
              phone: '', // Required field that will need to be filled later
              password: Math.random().toString(36).slice(-16), // Random password
              oauth: {
                facebookId: profile.id
              }
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        logger.error('Facebook strategy error:', error);
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
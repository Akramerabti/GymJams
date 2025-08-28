// server/src/config/passport.js - Improved OAuth Profile Processing

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Enhanced profile processing function
const processOAuthProfile = (profile) => {
  const { id, emails, name, photos, provider } = profile;
  
  // Safely extract email
  const email = emails && emails.length > 0 ? emails[0].value.toLowerCase() : null;
  
  // Safely extract name components
  let firstName = '';
  let lastName = '';
  
  if (name) {
    firstName = name.givenName || '';
    lastName = name.familyName || '';
    
    // If only displayName is available, try to parse it
    if (!firstName && !lastName && name.displayName) {
      const nameParts = name.displayName.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }
  }
  
  // Extract profile picture
  const profileImage = photos && photos.length > 0 ? photos[0].value : null;
  
  return {
    providerId: id,
    provider: provider,
    email,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    profileImage,
    // Note: phone is NEVER available from Google OAuth
    phone: null
  };
};

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('Google OAuth profile received:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Process the OAuth profile
    const oauthProfile = processOAuthProfile(profile);
    
    if (!oauthProfile.email) {
      logger.error('No email found in Google OAuth profile');
      return done(new Error('Email not provided by Google'), null);
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ 
      $or: [
        { email: oauthProfile.email },
        { 'oauth.googleId': oauthProfile.providerId }
      ]
    });

    if (existingUser) {
      // User exists - check if profile is complete
      const needsPhone = !existingUser.phone || existingUser.phone === '';
      const needsLastName = !existingUser.lastName || existingUser.lastName === '';
      
      if (needsPhone || needsLastName) {
        // Existing user with incomplete profile
        await User.findByIdAndUpdate(existingUser._id, {
          'oauth.isIncomplete': true,
          'oauth.needsPhoneNumber': needsPhone,
          'oauth.needsLastName': needsLastName,
          'oauth.googleId': oauthProfile.providerId,
          // Update profile image if not set
          ...((!existingUser.profileImage && oauthProfile.profileImage) && {
            profileImage: oauthProfile.profileImage
          })
        });

        logger.info('Existing user needs profile completion:', {
          userId: existingUser._id,
          needsPhone,
          needsLastName
        });

        return done(null, {
          requiresCompletion: true,
          existingUser: existingUser
        });
      }
      
      // Complete existing user - just update OAuth info and login
      await User.findByIdAndUpdate(existingUser._id, {
        'oauth.googleId': oauthProfile.providerId,
        'oauth.lastLogin': new Date(),
        // Update profile image if not set
        ...((!existingUser.profileImage && oauthProfile.profileImage) && {
          profileImage: oauthProfile.profileImage
        })
      });

      logger.info('Existing user login successful:', { userId: existingUser._id });
      return done(null, existingUser);
    }

    // New user - check if we have enough information
    const hasFirstName = oauthProfile.firstName && oauthProfile.firstName.length > 0;
    const hasLastName = oauthProfile.lastName && oauthProfile.lastName.length > 0;

    if (!hasFirstName) {
      logger.error('No first name found in Google OAuth profile');
      return done(new Error('First name not provided by Google'), null);
    }

    // For new users, we always need phone and potentially lastName
    const needsPhone = true; // Always need phone for new OAuth users
    const needsLastName = !hasLastName;

    if (needsPhone || needsLastName) {
      // New user needs profile completion
      logger.info('New OAuth user needs profile completion:', {
        email: oauthProfile.email,
        needsPhone,
        needsLastName
      });

      return done(null, {
        requiresCompletion: true,
        oauthProfile: oauthProfile
      });
    }

    // Create complete new user (rare case where Google provides full name)
    const newUser = new User({
      email: oauthProfile.email,
      firstName: oauthProfile.firstName,
      lastName: oauthProfile.lastName,
      profileImage: oauthProfile.profileImage,
      isEmailVerified: true, // Google emails are verified
      oauth: {
        googleId: oauthProfile.providerId,
        isIncomplete: false,
        lastLogin: new Date()
      },
      points: 100, // Welcome bonus
      hasReceivedFirstLoginBonus: true
    });

    await newUser.save();
    logger.info('New complete OAuth user created:', { userId: newUser._id });
    
    return done(null, newUser);

  } catch (error) {
    logger.error('Google OAuth strategy error:', error);
    return done(error, null);
  }
}));

export default passport;
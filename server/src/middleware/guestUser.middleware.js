// server/src/middleware/guestUser.middleware.js

import GymBrosProfile from '../models/GymBrosProfile.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Middleware to handle guest users in GymBros
 * Allows users to access GymBros functionality without a full account
 * but with a verified phone number
 */
export const handleGuestUser = async (req, res, next) => {
  try {
    // If user is already authenticated through normal channels, skip this middleware
    if (req.user) {
      return next();
    }
    
    // Check for guest token in authorization header or query param
    const guestToken = 
      req.headers['x-gymbros-guest-token'] || 
      req.query.guestToken ||
      req.body.guestToken;
    
    if (!guestToken) {
      return next(); // No token, continue to next middleware
    }
    
    // Verify the guest token
    try {
      const decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
      
      // Ensure it's a valid guest token with a phone number
      if (!decoded.phone || !decoded.verified) {
        logger.warn('Invalid guest token structure', { decoded });
        return next();
      }
      
      // Find GymBrosProfile by phone number
      const guestProfile = await GymBrosProfile.findOne({ phone: decoded.phone });
      
      if (!guestProfile) {
        logger.info(`No guest profile found for phone: ${decoded.phone}`);
        return next();
      }
      
      // Set guest user context for downstream handlers
      req.guestUser = {
        phone: decoded.phone,
        profileId: guestProfile._id,
        isGuest: true
      };
      
      logger.info(`Guest user identified by phone: ${decoded.phone}`);
    } catch (error) {
      // Invalid token, just continue without guest context
      logger.error('Error processing guest token:', error);
    }
    
    next();
  } catch (error) {
    logger.error('Unexpected error in guest user middleware:', error);
    next(error);
  }
};

/**
 * Gets the effective user identifier (either logged-in user ID or guest profile ID)
 * @param {Object} req - Express request object
 * @returns {Object} User identifier info
 */
export const getEffectiveUser = (req) => {
  // Regular authenticated user
  if (req.user && req.user.id) {
    return {
      userId: req.user.id,
      isGuest: false,
      phone: req.user.phone
    };
  }
  
  // Guest user with verified phone
  if (req.guestUser && req.guestUser.profileId) {
    return {
      profileId: req.guestUser.profileId.toString(),
      isGuest: true,
      phone: req.guestUser.phone
    };
  }
  
  // No user context available
  return {
    userId: null,
    isGuest: false,
    phone: null
  };
};

/**
 * Generate a guest token for verified phone numbers
 * @param {String} phone - Verified phone number
 * @returns {String} JWT token for guest access
 */
export const generateGuestToken = (phone) => {
  return jwt.sign(
    { phone, verified: true, isGuest: true },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Longer expiration for guest tokens
  );
};
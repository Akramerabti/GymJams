// server/src/middleware/guestUser.middleware.js

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Middleware to handle guest users for GymBros
 * This allows users to access some features without being registered
 */
export const handleGuestUser = (req, res, next) => {
  try {
    // First check for guest token in header
    const guestToken = req.headers['x-gymbros-guest-token'] || req.query.guestToken;
    
    // Log for debugging
    logger.debug(`Guest token from request: ${guestToken ? 'present' : 'not found'}`);
    
    if (guestToken) {
      // Verify the token
      try {
        const decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
        
        // Check if token contains required guest fields
        if (decoded.phone && decoded.isGuest) {
          // Add guest info to request
          req.guestUser = {
            phone: decoded.phone,
            profileId: decoded.profileId || null,
            isGuest: true
          };
          
          logger.debug(`Found valid guest user with phone ${decoded.phone} and profile ID ${decoded.profileId || 'none'}`);
        }
      } catch (tokenError) {
        logger.warn(`Invalid guest token: ${tokenError.message}`);
      }
    } else {
      logger.debug('No guest token found in request');
    }
    
    next();
  } catch (error) {
    logger.error('Error in guest user middleware:', error);
    next();
  }
};

/**
 * Get the effective user (either authenticated or guest)
 * This helps unified code paths to work with both types of users
 */
export const getEffectiveUser = (req) => {
  // First check if authenticated
  if (req.user && req.user.id) {
    logger.debug(`Using authenticated user ${req.user.id}`);
    return {
      userId: req.user.id,
      isGuest: false
    };
  }
  
  // Then check for guest user
  if (req.guestUser) {
    logger.debug(`Using guest user with phone ${req.guestUser.phone} and profile ${req.guestUser.profileId || 'none'}`);
    return {
      phone: req.guestUser.phone,
      profileId: req.guestUser.profileId,
      isGuest: true
    };
  }
  
  // Lastly, check if a phone verification token is included in the body
  // This is used when creating a profile with a verified phone
  if (req.body && req.body.verificationToken && req.body.phone) {
    try {
      // Verify the token (but don't trust it fully for security-sensitive operations)
      const decoded = jwt.verify(req.body.verificationToken, process.env.JWT_SECRET);
      
      // If token matches the phone and is verified, return it as an effective user
      if (decoded.phone === req.body.phone && decoded.verified) {
        logger.debug(`Using verified phone ${decoded.phone} from token`);
        return {
          phone: decoded.phone,
          isGuest: true
        };
      }
    } catch (tokenError) {
      logger.warn(`Invalid verification token: ${tokenError.message}`);
    }
  }
  
  logger.debug('No effective user found (neither authenticated nor guest)');
  return {};
};

/**
 * Generate a token for a guest user
 * @param {string} phone - Verified phone number
 * @param {string} profileId - Optional profile ID if already created
 * @returns {string} - JWT token
 */
export const generateGuestToken = (phone, profileId = null) => {
  if (!phone) {
    logger.error('Cannot generate guest token without phone number');
    throw new Error('Phone number is required for guest token');
  }
  
  // Create a token that includes both the phone and profileId if available
  const payload = {
    phone,
    verified: true,
    isGuest: true,
    profileId,
    iat: Math.floor(Date.now() / 1000),
  };
  
  // Sign with JWT_SECRET and short expiration (24 hours is enough for a guest session)
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  logger.info(`Generated guest token for phone ${phone} and profile ${profileId || 'not yet created'}`);
  
  return token;
};
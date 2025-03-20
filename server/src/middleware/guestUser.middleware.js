// server/src/middleware/guestUser.middleware.js

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Generate a guest token for non-authenticated users
 * @param {String} phone - The verified phone number
 * @param {String} profileId - Optional profile ID
 * @returns {String} - JWT token for the guest
 */
export const generateGuestToken = (phone, profileId = null) => {
  const payload = { 
    phone, 
    verified: true,
    isGuest: true 
  };
  
  // Include profileId if provided
  if (profileId) {
    payload.profileId = profileId.toString();
  }
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Middleware to handle guest users with valid tokens
 * This middleware should be applied to all GymBros routes
 */
export const handleGuestUser = (req, res, next) => {
  try {
    // Skip if user is already authenticated
    if (req.user) {
      logger.debug('User is already authenticated, skipping guest middleware');
      return next();
    }
    
    // Look for guest token in ALL possible locations
    const guestToken = 
      req.query.guestToken || 
      req.headers['x-gymbros-guest-token'] || 
      (req.body && req.body.guestToken) ||
      (req.cookies && req.cookies.guestToken);
    
    if (!guestToken) {
      // No guest token found - log this for debugging
      logger.debug('No guest token found in request');
      return next();
    }
    
    // Verify the guest token
    try {
      logger.debug('Attempting to verify guest token');
      const decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
      
      // Add more detailed logging about what was decoded
      logger.debug('Decoded token content:', JSON.stringify(decoded));
      
      // Validate that it's a proper guest token
      if (!decoded.phone || !decoded.verified || !decoded.isGuest) {
        logger.warn('Invalid guest token structure:', decoded);
        return next();
      }
      
      // Set decoded properties on the request object
      req.guestUser = {
        phone: decoded.phone,
        verified: true,
        isGuest: true,
        // If we have a profileId in the token, include it
        profileId: decoded.profileId
      };
      
      logger.info(`Guest user request identified: ${decoded.phone}${decoded.profileId ? ` with profile ${decoded.profileId}` : ''}`);
    } catch (error) {
      // More detailed error logging
      logger.error(`Guest token verification failed: ${error.message}. Token: ${guestToken.substring(0, 10)}...`);
    }
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    // Token verification failed, but we still continue
    // This allows the route handler to decide what to do for unauthenticated requests
    logger.error(`Error in guest middleware: ${error.message}`, error.stack);
    next();
  }
};

/**
 * Helper function to get the "effective user" (authenticated or guest)
 * Routes can use this to determine the correct user context
 */
export const getEffectiveUser = (req) => {
  // Check for authenticated user first
  if (req.user && req.user.id) {
    logger.debug(`Effective user is authenticated: ${req.user.id}`);
    return {
      userId: req.user.id,
      isGuest: false
    };
  }
  
  // Check for guest user
  if (req.guestUser) {
    logger.debug(`Effective user is guest: ${req.guestUser.phone}`);
    
    // Build the response based on available data
    const response = {
      phone: req.guestUser.phone,
      isGuest: true
    };
    
    // Add profileId if available
    if (req.guestUser.profileId) {
      response.profileId = req.guestUser.profileId;
      logger.debug(`Guest has associated profile: ${req.guestUser.profileId}`);
    }
    
    return response;
  }
  
  // No user context - log this for debugging
  logger.debug('No effective user found (neither authenticated nor guest)');
  return {};
};
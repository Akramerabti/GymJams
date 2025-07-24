// server/src/middleware/guestUser.middleware.js

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Generate a guest token with the specified phone number
 * @param {String} phone - Phone number for the guest
 * @param {String} profileId - Optional profile ID if already exists
 * @returns {String} - JWT token for guest
 */
export const generateGuestToken = (phone, profileId = null) => {
  const payload = {
    phone,
    profileId,
    isGuest: true,
    verified: true,
    guestId: uuidv4(), // Unique identifier for this guest session
    iat: Math.floor(Date.now() / 1000) // Issued at timestamp
  };
  
  // Set expiration to 30 days
  const expiresIn = '30d';
  
  // Sign the token
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Middleware to handle guest user tokens
 * Attaches guest user info to the request if available
 */
export const handleGuestUser = (req, res, next) => {
  try {
    // Extract guest token from headers or query params
    const guestToken = 
      req.headers['x-gymbros-guest-token'] || 
      req.query.guestToken || 
      (req.body && req.body.guestToken);
    
    if (!guestToken) {
      // No guest token, continue without guest context
      return next();
    }
    
    // Verify the token
    try {
      const decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
      
      // Ensure this is a guest token
      if (!decoded.isGuest) {
        logger.warn('Non-guest token provided in guest token field');
        return next();
      }
      
      // Attach guest user info to the request
      req.guestUser = {
        phone: decoded.phone,
        profileId: decoded.profileId,
        guestId: decoded.guestId,
        isGuest: true,
        verified: !!decoded.verified
      };
      
      // Generate a fresh token with updated expiration
      // and send it back in the response for token renewal
      const freshToken = generateGuestToken(decoded.phone, decoded.profileId);
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Only modify successful responses
          try {
            const responseBody = res._body ? JSON.parse(res._body) : {};
            responseBody.guestToken = freshToken;
            res._body = JSON.stringify(responseBody);
          } catch (err) {
            logger.error('Error updating response with fresh guest token:', err);
          }
        }
      });
      
      logger.debug(`Guest user identified: ${decoded.phone}, profile: ${decoded.profileId || 'none'}`);
    } catch (err) {
      // Invalid token, log but don't block the request
      logger.warn(`Invalid guest token: ${err.message}`);
      
      // If token is expired, still extract profile ID if possible
      if (err.name === 'TokenExpiredError') {
        try {
          const decoded = jwt.decode(guestToken);
          if (decoded && decoded.profileId) {
            req.guestUser = {
              profileId: decoded.profileId,
              expired: true
            };
            
            logger.debug(`Using expired token data for profile: ${decoded.profileId}`);
          }
        } catch (decodeErr) {
          logger.error('Error decoding expired token:', decodeErr);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error in guest user middleware:', error);
    next();
  }
};

/**
 * Helper to get the effective user from either authenticated user or guest
 * @param {Object} req - Express request object
 * @returns {Object} User object with either userId or profileId
 */
export const getEffectiveUser = (req) => {
  // Authenticated user takes precedence
  if (req.user && req.user.id) {
    return {
      userId: req.user.id,
      isGuest: false
    };
  }
  
  // Next try guest user
  if (req.guestUser) {
    // Return both profileId (if exists) and phone
    return {
      profileId: req.guestUser.profileId || null,
      phone: req.guestUser.phone || null,
      isGuest: true
    };
  }
  
  // No user context available
  return {};
};

/**
 * Add guest token to response for consistency
 * @param {Object} res - Express response object
 * @param {Object} responseData - Response data
 * @param {Object} guestUser - Guest user info
 * @returns {Object} Updated response data with guest token
 */
export const addGuestTokenToResponse = (res, responseData, guestUser) => {
  if (guestUser && guestUser.isGuest) {
    // Generate a fresh token with updated expiration
    const freshToken = generateGuestToken(guestUser.phone, guestUser.profileId);
    
    // Add to response
    return {
      ...responseData,
      guestToken: freshToken,
      isGuest: true
    };
  }
  
  return responseData;
};
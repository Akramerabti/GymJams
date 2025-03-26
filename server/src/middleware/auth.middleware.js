// server/src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Rate limiting middleware
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Check if there's a token in the headers or query parameters
    let token = null;
    
    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check query parameters (for convenience)
    else if (req.query.token) {
      token = req.query.token;
    } 
    // Check for access token as well (for subscriptions)
    else if (req.query.accessToken) {
      // Handle direct accessToken for non-authenticated users
      // This is a special case for subscription access
      const subscription = await Subscription.findOne({
        accessToken: req.query.accessToken,
        status: 'active'
      });
      
      if (subscription) {
        req.user = { 
          id: 'guest', 
          role: 'subscriber',
          subscription: subscription._id
        };
        return next();
      }
      
      return res.status(401).json({ error: 'Invalid access token' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database, excluding password
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

// Optional authentication middleware - doesn't require authentication but will use it if provided
export const optionalAuthenticate = async (req, res, next) => {
  try {
    // Check if there's a token in the headers or query parameters
    let token = null;
    
    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check query parameters (for convenience)
    else if (req.query.token) {
      token = req.query.token;
    } 
    // Check for access token as well
    else if (req.query.accessToken) {
      // Handle access token for subscription access
      // This is similar to what we have in the authenticate middleware
      const subscription = await Subscription.findOne({
        accessToken: req.query.accessToken,
        status: 'active'
      });
      
      if (subscription) {
        req.user = { 
          id: 'guest', 
          role: 'subscriber',
          subscription: subscription._id
        };
        return next();
      }
    }

    if (!token) {
      // No token, but that's ok - continue as unauthenticated
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database, excluding password
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      // Attach user to request object if found
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Token error, but that's ok for optional authentication
    // Continue as unauthenticated
    console.log('Optional auth error (continuing):', error.message);
    next();
  }
};

// Admin role middleware
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Taskforce role middleware
export const isTaskforce = (req, res, next) => {
  if (req.user && (req.user.role === 'taskforce' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Taskforce privileges required.' });
  }
};

// Coach role middleware
export const isCoach = (req, res, next) => {
  if (req.user && (req.user.role === 'coach' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Coach privileges required.' });
  }
};
import rateLimit from 'express-rate-limit';
import { MemoryStore } from 'express-rate-limit';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';


export const authenticate = async (req, res, next) => {
  try {

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id).select('-password');


    if (!user) {
      console.error('User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // Attach user to the request object
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      req.user = user || null;
    } catch (error) {
      req.user = null;
      logger.warn('Optional auth token invalid:', error);
    }

    next();
  } catch (error) {
    req.user = null;
    logger.error('Optional authentication error:', error);
    next();
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const isTaskforce = (req, res, next) => {
  if (req.user && req.user.role === 'taskforce') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Only taskforce members can perform this action.' });
  }
};

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Add more lenient limits for specific routes
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil(windowMs / 1000 / 60) // minutes
    });
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});


export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    // Allow unauthenticated users a lower limit
    if (!req.user) return 300;

    // Admins get a higher limit
    if (req.user?.role === 'admin') return 1000;

    // Regular users get a moderate limit
    return 600;
  },
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryStore(), // Use sliding window for better burst handling
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000); // Seconds until reset
    logger.warn(`Rate limit exceeded for user: ${req.user?._id || 'unauthenticated'}, IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, please try again later',
      retryAfter: retryAfter > 0 ? retryAfter : 0,
    });
  },
});
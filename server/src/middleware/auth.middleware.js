import rateLimit from 'express-rate-limit';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';


export const authenticate = async (req, res, next) => {
  try {
    console.log('Authorization header:', req.headers.authorization); // Log the Authorization header

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Decoding token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id).select('-password');
    console.log('Found user:', user);

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

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
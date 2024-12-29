/**
 * JWT helper functions
 */
import jwt from 'jsonwebtoken';
import logger from './logger';

export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('JWT verification error:', error);
    throw error;
  }
};

// utils/helpers.js
/**
 * General helper functions
 */

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Deep clone objects
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Calculate pagination
export const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * limit;
  
  return {
    currentPage,
    totalPages,
    limit,
    skip,
    total,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// Sanitize MongoDB query
export const sanitizeQuery = (query) => {
  const sanitized = {};
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

// Handle async route
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Parse sort string
export const parseSort = (sortString) => {
  if (!sortString) return { createdAt: -1 };
  
  const [field, order] = sortString.split(':');
  return { [field]: order === 'desc' ? -1 : 1 };
};

// Generate slug
export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};
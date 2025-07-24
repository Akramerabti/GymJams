/**
 * JWT helper functions
 */
import jwt from 'jsonwebtoken';
import logger from './logger.js';

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

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

export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Create a DOM window for DOMPurify to use
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  
  // Configure DOMPurify with allowed tags and attributes
  const clean = purify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'u', 'ol', 'ul', 
      'li', 'blockquote', 'a', 'img', 'code', 'pre', 'br', 'hr', 'table', 'thead', 
      'tbody', 'tr', 'th', 'td', 'caption', 'figure', 'figcaption', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'rel', 'target', 'style', 
      'width', 'height', 'align'
    ],
    // Remove empty elements like <span></span>
    KEEP_CONTENT: true,
    // Remove attributes that have JS functionality
    FORBID_ATTRS: ['onerror', 'onload', 'onclick'],
    // Only allow http/https URLs
    ALLOW_UNKNOWN_PROTOCOLS: false
  });
  
  return clean;
};

/**
 * Calculates estimated reading time based on content length
 * @param {string} content - HTML or text content
 * @returns {number} - Reading time in minutes 
 */
export const generateReadingTime = (content) => {
  if (!content) return 1;
  
  // Strip HTML tags to get just the text
  const strippedContent = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by spaces)
  const words = strippedContent.split(/\s+/).filter(Boolean);
  
  // Average reading speed is about 200-250 words per minute
  const wordsPerMinute = 225;
  
  // Calculate minutes and round up to nearest integer
  const minutes = Math.ceil(words.length / wordsPerMinute);
  
  // Always return at least 1 minute
  return Math.max(1, minutes);
};

/**
 * Extracts a meta description from HTML content
 * @param {string} content - HTML content
 * @param {number} maxLength - Maximum description length
 * @returns {string} - Extracted description
 */
export const extractMetaDescription = (content, maxLength = 160) => {
  if (!content) return '';
  
  // Strip HTML tags
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Take first portion of content up to maxLength
  let description = textContent.substring(0, maxLength);
  
  // Don't cut off mid-word
  if (textContent.length > maxLength) {
    const lastSpaceIndex = description.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      description = description.substring(0, lastSpaceIndex);
    }
    description += '...';
  }
  
  return description;
};

/**
 * Extracts relevant tags from content based on keywords
 * @param {string} content - Content to analyze
 * @param {string} title - Article title
 * @returns {string[]} - Array of extracted tags
 */
export const extractTags = (content, title) => {
  const combinedText = (title + ' ' + content).toLowerCase();
  
  // Define keyword sets for each tag
  const tagKeywords = {
    'Strength Training': ['strength', 'weightlifting', 'weights', 'powerlifting', 'barbell'],
    'Cardio': ['cardio', 'aerobic', 'running', 'jogging', 'cycling', 'hiit'],
    'Nutrition': ['nutrition', 'diet', 'protein', 'carbs', 'food', 'eating', 'meal'],
    'Weight Loss': ['weight loss', 'fat loss', 'cutting', 'calorie deficit', 'slimming'],
    'Muscle Building': ['muscle', 'hypertrophy', 'bulking', 'gains', 'bodybuilding'],
    'Recovery': ['recovery', 'rest', 'sleep', 'stretching', 'mobility', 'flexibility'],
    'Beginners': ['beginner', 'starting', 'novice', 'first time', 'newbie'],
    'Advanced': ['advanced', 'expert', 'experienced', 'professional', 'elite'],
    'Mental Health': ['mental health', 'stress', 'anxiety', 'meditation', 'mindfulness']
  };
  
  // Check content for each tag's keywords
  const matchedTags = [];
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    // Check if any keyword is in the content
    const hasKeyword = keywords.some(keyword => combinedText.includes(keyword));
    if (hasKeyword) {
      matchedTags.push(tag);
    }
  }
  
  return matchedTags;
};
import jwt from 'jsonwebtoken';
import logger from './logger.js';

export const generateToken = (payload, expiresIn = '24h') => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.error('JWT generation error:', error);
    throw error;
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('JWT verification error:', error);
    throw error;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('JWT decode error:', error);
    throw error;
  }
};

// For token refresh functionality if needed
export const refreshToken = (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    delete decoded.exp;
    delete decoded.iat;
    return generateToken(decoded);
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
};
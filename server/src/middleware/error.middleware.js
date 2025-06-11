// middleware/error.middleware.js
import logger from '../utils/logger.js';

export const handleError = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate Entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: 'File Upload Error',
      error: err.message
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Handle 404 errors
export const handleNotFound = (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
};
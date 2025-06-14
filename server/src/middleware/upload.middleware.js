import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Use memory storage instead of disk storage for Supabase
const storage = multer.memoryStorage();

// Update file filter to accept document types for applications
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Image types
    'image/jpeg', 'image/png', 'image/webp',
    // Document types for applications
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Handle file upload errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large',
        maxSize: '5MB'
      });
    }
  }

  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      message: 'Invalid file type',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
  }

  next(error);
};

// Add a default export pointing to the upload middleware
export default upload;
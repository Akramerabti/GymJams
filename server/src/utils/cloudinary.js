import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {object} options - Upload options
 * @returns {Promise} - Cloudinary upload result
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      resource_type: 'auto', // Automatically detect file type
      folder: 'gymtonic', // Organize uploads in folders
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload a video to Cloudinary with video-specific optimizations
 * @param {string} filePath - Path to the video file
 * @param {object} options - Upload options
 * @returns {Promise} - Cloudinary upload result
 */
export const uploadVideoToCloudinary = async (filePath, options = {}) => {
  try {
    const videoOptions = {
      resource_type: 'video',
      folder: 'gymtonic/videos',
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      eager: [
        { 
          width: 1280, 
          height: 720, 
          crop: 'fill', 
          quality: 'auto:good',
          format: 'mp4'
        },
        { 
          width: 854, 
          height: 480, 
          crop: 'fill', 
          quality: 'auto:good',
          format: 'mp4'
        }
      ],
      eager_async: true,
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, videoOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Type of resource ('image', 'video', 'raw')
 * @returns {Promise} - Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get optimized URL for an image
 * @param {string} publicId - Public ID of the image
 * @param {object} transformations - Transformation options
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations
  });
};

/**
 * Get optimized URL for a video
 * @param {string} publicId - Public ID of the video
 * @param {object} transformations - Transformation options
 * @returns {string} - Optimized video URL
 */
export const getOptimizedVideoUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations
  });
};

export default cloudinary;

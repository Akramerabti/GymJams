// imageUtils.js - Utility functions for handling images in the GymBros application

export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const formatImageUrl = (imageUrl, fallbackUrl = "/api/placeholder/400/600") => {
  if (!imageUrl) return fallbackUrl;
  
  // If it's already a blob URL or a full URL, return as is
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // If it starts with a slash, append to the base URL
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // Otherwise, assume it's a relative path and add the full path
  return `${baseUrl}/${imageUrl}`;
};


export const getImageIdFromUrl = (url) => {
  if (!url || !(typeof url === 'string')) return null;
  
  // If it's a blob URL or not a server URL, return null
  if (url.startsWith('blob:') || !url.includes('/')) return null;
  
  // Extract the filename from the path
  return url.split('/').pop();
};


export const isServerUrl = (url) => {
  if (!url || !(typeof url === 'string')) return false;
  
  return !url.startsWith('blob:') && (
    url.startsWith('http') || 
    url.startsWith('/api/') || 
    url.startsWith('/uploads/')
  );
};

export const createImageErrorHandler = (fallbackUrl = "/api/placeholder/400/600") => {
  return (e) => {
    console.error('Image load error:', e.target.src);
    e.target.onerror = null; // Prevent infinite error loop
    e.target.src = fallbackUrl;
  };
};

const getCompleteImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a complete URL or blob URL, return it unchanged
  if (url.startsWith('blob:') || url.startsWith('http')) {
    return url;
  }
  
  // Add the API base URL for server paths
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${url}`;
};

export const blobUrlToFile = async (blobUrl, filename = `image-${Date.now()}.jpg`) => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new File([blob], filename, { 
      type: blob.type || 'image/jpeg' 
    });
  } catch (error) {
    console.error('Error converting blob URL to file:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Calculates the correct dimensions for an image to maintain aspect ratio within constraints
 * 
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {Object} - Object containing the calculated width and height
 */
export const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth;
  let height = originalHeight;
  
  // If the image is larger than the max dimensions, scale it down
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  return { width, height };
};
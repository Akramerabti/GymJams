// imageUtils.js - Utility functions for handling images and files in the application

export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create placeholder URLs that avoid double /api/ prefix
export const getPlaceholderUrl = (width = 400, height = 600) => {
  return `${baseUrl}/placeholder/${width}/${height}`;
};

export const getFallbackAvatarUrl = () => {
  return '/fallback.svg';
};

export const formatImageUrl = (imageUrl, fallbackUrl = null) => {
  if (!imageUrl) return fallbackUrl || getFallbackAvatarUrl();
  
  // If it's already a blob URL or a full URL (including Supabase), return as is
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // For legacy local files that start with a slash
  if (imageUrl.startsWith('/')) {
    // Avoid double slashes - check if baseUrl already ends with slash
    const separator = baseUrl.endsWith('/') ? '' : '';
    return `${baseUrl}${separator}${imageUrl}`;
  }
  
  // For relative paths (legacy)
  return `${baseUrl}/${imageUrl}`;
};

// Also works for any file URL, not just images
export const formatFileUrl = (fileUrl, fallbackUrl = null) => {
  if (!fileUrl) return fallbackUrl;
  
  // If it's already a blob URL or a full URL (including Supabase), return as is
  if (fileUrl.startsWith('blob:') || fileUrl.startsWith('http')) {
    return fileUrl;
  }
  
  // For legacy local files that start with a slash
  if (fileUrl.startsWith('/')) {
    // Avoid double slashes - check if baseUrl already ends with slash
    const separator = baseUrl.endsWith('/') ? '' : '';
    return `${baseUrl}${separator}${fileUrl}`;
  }
  
  // For relative paths (legacy)
  return `${baseUrl}/${fileUrl}`;
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
    url.startsWith('/uploads/') // Keep support for legacy paths
  );
};

export const createImageErrorHandler = (fallbackWidth = 400, fallbackHeight = 600) => {
  return (e) => {
    console.error('Image load error:', e.target.src);
    e.target.onerror = null; // Prevent infinite error loop
    e.target.src = getPlaceholderUrl(fallbackWidth, fallbackHeight);
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
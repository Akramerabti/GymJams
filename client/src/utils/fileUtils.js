// fileUtils.js - Utility functions for handling file URLs and downloads

export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Formats a file URL to handle both Supabase URLs and legacy local paths
 * @param {string} fileUrl - The file URL or path
 * @param {string} fallbackUrl - Optional fallback URL
 * @returns {string} - Properly formatted URL
 */
export const formatFileUrl = (fileUrl, fallbackUrl = null) => {
  if (!fileUrl) return fallbackUrl;
  
  // If it's already a full URL (including Supabase), return as is
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }
  
  // If it's a blob URL, return as is
  if (fileUrl.startsWith('blob:')) {
    return fileUrl;
  }
  
  // For legacy local files that start with a slash
  if (fileUrl.startsWith('/')) {
    // Avoid double slashes
    const separator = baseUrl.endsWith('/') ? '' : '';
    return `${baseUrl}${separator}${fileUrl}`;
  }
  
  // For relative paths (legacy)
  return `${baseUrl}/${fileUrl}`;
};

/**
 * Checks if a URL is a Supabase storage URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a Supabase URL
 */
export const isSupabaseUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('.supabase.co/storage/');
};

/**
 * Checks if a URL is a server-hosted file (either legacy or Supabase)
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a server URL
 */
export const isServerUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  return !url.startsWith('blob:') && (
    url.startsWith('http') || 
    url.startsWith('/api/') ||
    url.startsWith('/uploads/') ||
    isSupabaseUrl(url)
  );
};

/**
 * Gets the filename from a file URL or path
 * @param {string} url - The file URL or path
 * @returns {string|null} - The filename or null if not found
 */
export const getFilenameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Remove query parameters if present
  const cleanUrl = url.split('?')[0];
  
  // Extract filename from the path
  return cleanUrl.split('/').pop();
};

/**
 * Gets the file extension from a filename or URL
 * @param {string} fileUrl - The file URL or filename
 * @returns {string|null} - The file extension (with dot) or null
 */
export const getFileExtension = (fileUrl) => {
  const filename = getFilenameFromUrl(fileUrl);
  if (!filename) return null;
  
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : null;
};

/**
 * Checks if a file is an image based on its URL/filename
 * @param {string} fileUrl - The file URL or filename
 * @returns {boolean} - True if it's an image file
 */
export const isImageFile = (fileUrl) => {
  const extension = getFileExtension(fileUrl);
  if (!extension) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.includes(extension.toLowerCase());
};

/**
 * Checks if a file is a document based on its URL/filename
 * @param {string} fileUrl - The file URL or filename
 * @returns {boolean} - True if it's a document file
 */
export const isDocumentFile = (fileUrl) => {
  const extension = getFileExtension(fileUrl);
  if (!extension) return false;
  
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
  return documentExtensions.includes(extension.toLowerCase());
};

/**
 * Creates a download function for a file
 * @param {string} fileUrl - The file URL
 * @param {string} filename - Optional custom filename
 * @returns {Function} - Download function
 */
export const createDownloadHandler = (fileUrl, filename = null) => {
  return () => {
    const formattedUrl = formatFileUrl(fileUrl);
    if (!formattedUrl) return;
    
    const link = document.createElement('a');
    link.href = formattedUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    if (filename) {
      link.download = filename;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};

/**
 * Formats file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validates file type against allowed types
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes || !Array.isArray(allowedTypes)) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validates file size against maximum allowed size
 * @param {File} file - The file to validate
 * @param {number} maxSizeBytes - Maximum allowed size in bytes
 * @returns {boolean} - True if file size is within limit
 */
export const validateFileSize = (file, maxSizeBytes) => {
  if (!file || !maxSizeBytes) return false;
  return file.size <= maxSizeBytes;
};

export default {
  formatFileUrl,
  isSupabaseUrl,
  isServerUrl,
  getFilenameFromUrl,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  createDownloadHandler,
  formatFileSize,
  validateFileType,
  validateFileSize
};

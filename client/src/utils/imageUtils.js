
export const blobToFile = async (blobUrl, filename = 'image.jpg') => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch (error) {
      console.error('Error converting blob to file:', error);
      throw new Error('Failed to process image');
    }
  };
  
  /**
   * Convert a server URL or blob URL to a blob URL
   * @param {string} url - The image URL to convert
   * @returns {Promise<string>} - A blob URL pointing to the image data
   */
  export const urlToBlob = async (url) => {
    // If it's already a blob URL, return it
    if (url.startsWith('blob:')) return url;
    
    try {
      const response = await fetch(url, { 
        headers: { 'Origin': window.location.origin },
        mode: 'cors',
        cache: 'no-cache'
      });
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting URL to blob:', error);
      throw new Error('Failed to fetch image');
    }
  };
  
  /**
   * Create a thumbnail from an image
   * @param {File|Blob|string} imageSource - The source image (File, Blob, or URL)
   * @param {Object} options - Options for thumbnail generation
   * @param {number} options.maxWidth - Maximum width of the thumbnail (default: 200)
   * @param {number} options.maxHeight - Maximum height of the thumbnail (default: 200)
   * @param {string} options.format - Output format (default: 'image/jpeg')
   * @param {number} options.quality - JPEG quality from 0-1 (default: 0.8)
   * @returns {Promise<Blob>} - A Blob containing the thumbnail
   */
  export const createThumbnail = async (imageSource, options = {}) => {
    const { 
      maxWidth = 200, 
      maxHeight = 200, 
      format = 'image/jpeg', 
      quality = 0.8 
    } = options;
    
    // Convert source to URL if it's a File/Blob
    let imageUrl;
    if (typeof imageSource === 'string') {
      imageUrl = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      imageUrl = URL.createObjectURL(imageSource);
    } else {
      throw new Error('Invalid image source');
    }
    
    // Create image element
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    
    // Wait for image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
    
    // Calculate dimensions while maintaining aspect ratio
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Clean up temporary URL if we created one
    if (typeof imageSource !== 'string') {
      URL.revokeObjectURL(imageUrl);
    }
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create thumbnail'));
      }, format, quality);
    });
  };
  
  /**
   * Crop an image and return the result as a File object
   * @param {string} imageUrl - URL of the image to crop
   * @param {Object} cropArea - Object with x, y, width, height of crop area
   * @param {string} filename - Desired filename for the result
   * @returns {Promise<File>} - File object containing the cropped image
   */
  export const cropImage = async (imageUrl, cropArea, filename = 'cropped.jpg') => {
    try {
      // Create image and load it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image for cropping'));
        img.src = imageUrl;
      });
      
      // Create canvas for cropping
      const canvas = document.createElement('canvas');
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      const ctx = canvas.getContext('2d');
      
      // Calculate scale factors if needed
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      
      // Draw only the cropped portion
      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        cropArea.width,
        cropArea.height
      );
      
      // Convert to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          'image/jpeg',
          0.9
        );
      });
      
      // Create and return a File object
      return new File([blob], filename, { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error cropping image:', error);
      throw new Error('Failed to crop image');
    }
  };
  
  /**
   * Extract file extension from a filename or URL
   * @param {string} filename - The filename or URL
   * @returns {string} - The extension (without the dot)
   */
  export const getFileExtension = (filename) => {
    if (!filename) return '';
    
    // Handle URL parameters
    const withoutParams = filename.split('?')[0];
    
    // Get the extension
    const parts = withoutParams.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };
  
  /**
   * Check if a file is an image based on its type or extension
   * @param {File|string} file - File object or filename
   * @returns {boolean} - Whether the file is an image
   */
  export const isImageFile = (file) => {
    // If it's a File object, check its type
    if (file instanceof File) {
      return file.type.startsWith('image/');
    }
    
    // If it's a string (filename or URL), check extension
    if (typeof file === 'string') {
      const ext = getFileExtension(file);
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
    }
    
    return false;
  };
  
  /**
   * Create a resized image optimized for upload
   * @param {File} imageFile - The original image file
   * @param {Object} options - Resize options
   * @param {number} options.maxWidth - Maximum width (default: 1200)
   * @param {number} options.maxHeight - Maximum height (default: 1200)
   * @param {string} options.format - Output format (default: match original)
   * @param {number} options.quality - JPEG quality 0-1 (default: 0.9)
   * @returns {Promise<File>} - Resized image as a File object
   */
  export const resizeImageForUpload = async (imageFile, options = {}) => {
    const { 
      maxWidth = 1200, 
      maxHeight = 1200, 
      format, 
      quality = 0.9 
    } = options;
    
    try {
      // Create image URL
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Load the image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Calculate dimensions
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      
      // Only resize if the image is larger than the max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      } else {
        // Image is already small enough, just return the original
        URL.revokeObjectURL(imageUrl);
        return imageFile;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
      
      // Determine output format
      const outputFormat = format || imageFile.type || 'image/jpeg';
      
      // Convert canvas to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
          outputFormat,
          quality
        );
      });
      
      // Create a new file with the original name
      return new File(
        [blob], 
        imageFile.name,
        { type: outputFormat }
      );
    } catch (error) {
      console.error('Error resizing image:', error);
      // Return the original file if resizing fails
      return imageFile;
    }
  };
  
  export default {
    blobToFile,
    urlToBlob,
    createThumbnail,
    cropImage,
    getFileExtension,
    isImageFile,
    resizeImageForUpload
  };
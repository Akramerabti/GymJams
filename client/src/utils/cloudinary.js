import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';

// Initialize Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

/**
 * Get optimized image URL from Cloudinary
 * @param {string} publicId - The public ID of the image in Cloudinary
 * @param {object} options - Transformation options
 * @returns {string} - Optimized image URL
 */
export const getCloudinaryImageUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality: imageQuality = 'auto',
    format: formatType = 'auto'
  } = options;

  let image = cld.image(publicId);

  // Apply transformations
  if (width || height) {
    image = image.resize(fill().width(width).height(height));
  }
  
  image = image
    .delivery(format(formatType))
    .delivery(quality(imageQuality));

  return image.toURL();
};

/**
 * Get optimized video URL from Cloudinary
 * @param {string} publicId - The public ID of the video in Cloudinary
 * @param {object} options - Transformation options
 * @returns {string} - Optimized video URL
 */
export const getCloudinaryVideoUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    quality: videoQuality = 'auto',
    format: formatType = 'auto'
  } = options;

  // Use the full path including folder structure from Cloudinary
  const fullPublicId = publicId.includes('/') ? publicId : `gymtonic/videos/${publicId}`;
  let video = cld.video(fullPublicId);

  // Apply transformations
  if (width || height) {
    video = video.resize(fill().width(width).height(height));
  }

  video = video
    .delivery(format(formatType))
    .delivery(quality(videoQuality));

  return video.toURL();
};

/**
 * Get video poster/thumbnail URL from Cloudinary
 * @param {string} publicId - The public ID of the video in Cloudinary
 * @param {object} options - Transformation options
 * @returns {string} - Video poster URL
 */
export const getCloudinaryVideoPoster = (publicId, options = {}) => {
  const {
    width = 800,
    height = 450,
    quality: imageQuality = 'auto'
  } = options;

  // Use the full path including folder structure from Cloudinary
  const fullPublicId = publicId.includes('/') ? publicId : `gymtonic/videos/${publicId}`;
  const image = cld.image(fullPublicId)
    .resize(fill().width(width).height(height))
    .delivery(format('auto'))
    .delivery(quality(imageQuality));

  return image.toURL();
};

export default cld;

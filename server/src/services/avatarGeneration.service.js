// server/src/services/avatarGeneration.service.js
import sharp from 'sharp';
import supabaseStorageService from './supabaseStorage.service.js';
import logger from '../utils/logger.js';

class AvatarGenerationService {
 constructor() {
    this.assetsBasePath = 'avatar-assets';
    this.imageCache = new Map();
    this.defaultSize = 256;
  }

  /**
   * Generate avatar using pre-clothed character images
   * @param {Object} avatarConfig - Simple avatar configuration
   * @param {string} userGender - User's gender from GymBrosProfile
   * @param {number} size - Output image size
   * @returns {Promise<{url: string, path: string}>}
   */
  async generateAvatar(avatarConfig, userGender, size = this.defaultSize) {
    try {
      logger.info('Generating simple avatar for config:', avatarConfig, 'Gender:', userGender);

      // If user has custom avatar, return it
      if (avatarConfig.customAvatarUrl) {
        return { url: avatarConfig.customAvatarUrl, path: null };
      }

      // Get the base character image (already clothed) based on user's gender
      const characterImage = await this.getCharacterImage(avatarConfig, userGender, size);
      
      if (!characterImage) {
        return this.getFallbackAvatar(avatarConfig, userGender);
      }

      // Apply fur color if needed
      let finalImage = characterImage;
      if (avatarConfig.furColor && avatarConfig.furColor !== '#8B4513') {
        finalImage = await this.applyFurColor(characterImage, avatarConfig.furColor);
      }

      // Upload the final avatar to Supabase
      const timestamp = Date.now();
      const filename = `simple-avatar-${avatarConfig.version || 1}-${timestamp}.png`;
      
      const uploadResult = await supabaseStorageService.uploadFile(
        finalImage,
        filename,
        'generated-avatars'
      );

      logger.info('Simple avatar generated and uploaded:', uploadResult.url);
      return uploadResult;

    } catch (error) {
      logger.error('Error generating simple avatar:', error);
      return this.getFallbackAvatar(avatarConfig, userGender);
    }
  }

  /**
   * Get base character image with pose, mood, and gender
   * @param {Object} config - Avatar configuration
   * @param {string} userGender - User's gender from profile
   * @param {number} size - Image size
   * @returns {Promise<Buffer>} Character image buffer
   */
  async getCharacterImage(config, userGender, size) {
    try {
      const characterType = config.baseCharacter || 'gym_mouse';
      const mood = config.mood || 'happy';
      const pose = config.pose || 'standing';
      
      // Convert user gender to image folder name
      const genderFolder = this.getGenderFolder(userGender);
      
      // Try different fallback paths based on gender
      const imagePaths = [
        // Most specific: mouse/male/gym_mouse/happy_standing.png
        `characters/mouse/${genderFolder}/${characterType}/${mood}_${pose}.png`,
        // Fallback to mood only: mouse/male/gym_mouse/happy.png
        `characters/mouse/${genderFolder}/${characterType}/${mood}.png`,
        // Fallback to default pose: mouse/male/gym_mouse/default.png
        `characters/mouse/${genderFolder}/${characterType}/default.png`,
        // Fallback to unisex version: mouse/gym_mouse/happy_standing.png
        `characters/mouse/${characterType}/${mood}_${pose}.png`,
        // Final fallback: mouse/default/happy_standing.png
        `characters/mouse/default/happy_standing.png`
      ];

      // Try each path until we find an image
      for (const imagePath of imagePaths) {
        const characterImage = await this.getAssetImage(imagePath, size);
        if (characterImage) {
          logger.info(`Using avatar image: ${imagePath}`);
          return characterImage;
        }
      }

      logger.warn('No character image found for any fallback path');
      return null;

    } catch (error) {
      logger.error('Error getting character image:', error);
      return null;
    }
  }

  /**
   * Convert user gender to folder name
   * @param {string} userGender - User's gender from profile
   * @returns {string} Folder name for assets
   */
  getGenderFolder(userGender) {
    switch (userGender?.toLowerCase()) {
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      case 'other':
        return 'other';
      default:
        return 'male'; // Default fallback
    }
  }

  /**
   * Get asset image from Supabase storage with caching
   * @param {string} path - Image path
   * @param {number} size - Desired size
   * @returns {Promise<Buffer>} Image buffer
   */
  async getAssetImage(path, size) {
    const fullPath = `${this.assetsBasePath}/${path}`;
    const cacheKey = `${fullPath}_${size}`;

    // Check cache first
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }

    try {
      // Get public URL and fetch image
      const publicUrl = supabaseStorageService.getPublicUrl(fullPath);
      
      const response = await fetch(publicUrl);
      if (!response.ok) {
        logger.warn(`Asset not found: ${fullPath}`);
        return null;
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      // Resize to desired size
      const resizedBuffer = await sharp(imageBuffer)
        .resize(size, size, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 } 
        })
        .png()
        .toBuffer();

      // Cache the result
      this.imageCache.set(cacheKey, resizedBuffer);

      return resizedBuffer;

    } catch (error) {
      logger.error(`Error fetching asset image ${fullPath}:`, error);
      return null;
    }
  }

  /**
   * Apply fur color tint to character image
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} hexColor - Hex color to apply
   * @returns {Promise<Buffer>} Tinted image buffer
   */
  async applyFurColor(imageBuffer, hexColor) {
    try {
      // Convert hex to RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      // Apply a subtle tint (not full color replacement)
      return await sharp(imageBuffer)
        .modulate({
          hue: this.getHueFromRGB(r, g, b),
          saturation: 1.2 // Slightly increase saturation
        })
        .png()
        .toBuffer();

    } catch (error) {
      logger.error('Error applying fur color:', error);
      return imageBuffer; // Return original if tinting fails
    }
  }

  /**
   * Convert RGB to hue for modulation
   * @param {number} r - Red value
   * @param {number} g - Green value
   * @param {number} b - Blue value
   * @returns {number} Hue value
   */
  getHueFromRGB(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    if (diff === 0) return 0;

    let hue;
    switch (max) {
      case r:
        hue = ((g - b) / diff) % 6;
        break;
      case g:
        hue = (b - r) / diff + 2;
        break;
      case b:
        hue = (r - g) / diff + 4;
        break;
    }

    return Math.round(hue * 60);
  }

  /**
   * Generate map avatar (smaller size)
   * @param {Object} avatarConfig - Avatar configuration
   * @param {string} userGender - User's gender
   * @param {number} size - Size for map icon (default: 40)
   * @returns {Promise<{url: string, path: string}>}
   */
  async generateMapAvatar(avatarConfig, userGender, size = 40) {
    try {
      // For map avatars, always use default pose for consistency
      const mapConfig = {
        ...avatarConfig,
        pose: 'standing',
        mood: 'happy'
      };

      const characterImage = await this.getCharacterImage(mapConfig, userGender, size);
      
      if (!characterImage) {
        return this.getFallbackAvatar(avatarConfig, userGender);
      }

      // Apply fur color
      let finalImage = characterImage;
      if (avatarConfig.furColor && avatarConfig.furColor !== '#8B4513') {
        finalImage = await this.applyFurColor(characterImage, avatarConfig.furColor);
      }

      // Upload to map-avatars folder
      const filename = `map-avatar-${avatarConfig.version}-${size}-${Date.now()}.png`;
      const uploadResult = await supabaseStorageService.uploadFile(
        finalImage,
        filename,
        'map-avatars'
      );

      return uploadResult;

    } catch (error) {
      logger.error('Error generating map avatar:', error);
      return this.getFallbackAvatar(avatarConfig, userGender);
    }
  }

  /**
   * Get fallback avatar URL based on gender
   * @param {Object} config - Avatar config
   * @param {string} userGender - User's gender
   * @returns {Object} Fallback avatar info
   */
  getFallbackAvatar(config, userGender) {
    const genderFolder = this.getGenderFolder(userGender);
    const fallbackUrl = supabaseStorageService.getPublicUrl(
      `${this.assetsBasePath}/fallback/default_mouse_${genderFolder}.png`
    );
    
    return {
      url: fallbackUrl,
      path: null,
      isFallback: true
    };
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.imageCache.clear();
    logger.info('Simple avatar cache cleared');
  }

  /**
   * Get available options for the simplified system
   */
  async getAvailableOptions() {
    return {
      furColors: [
        { name: 'Brown', value: '#8B4513' },
        { name: 'Gray', value: '#6B7280' },
        { name: 'White', value: '#F3F4F6' },
        { name: 'Black', value: '#1F2937' },
        { name: 'Golden', value: '#D97706' },
        { name: 'Cream', value: '#FEF3C7' },
        { name: 'Pink', value: '#FFC0CB' },
        { name: 'Blue', value: '#93C5FD' }
      ],
      moods: [
        { name: 'Happy', value: 'happy' },
        { name: 'Excited', value: 'excited' },
        { name: 'Determined', value: 'determined' },
        { name: 'Cool', value: 'cool' },
        { name: 'Pumped', value: 'pumped' }
      ],
      poses: [
        { name: 'Standing', value: 'standing' },
        { name: 'Flexing', value: 'flexing' },
        { name: 'Running', value: 'running' },
        { name: 'Lifting', value: 'lifting' },
        { name: 'Waving', value: 'waving' }
      ],
      characterTypes: [
        { name: 'Gym Mouse', value: 'gym_mouse' },
        { name: 'Buff Mouse', value: 'buff_mouse' },
        { name: 'Cute Mouse', value: 'cute_mouse' }
      ]
    };
  }
}

export default new AvatarGenerationService();
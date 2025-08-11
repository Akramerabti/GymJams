// server/src/controllers/simpleAvatarController.js
import simpleAvatarGenerationService from '../services/simpleAvatarGeneration.service.js';
import supabaseStorageService from '../services/supabaseStorage.service.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import logger from '../utils/logger.js';
import { getEffectiveUser } from '../utils/auth.js';

class AvatarController {
  
  /**
   * Generate avatar preview (temporary, not saved)
   */
  async generatePreview(req, res) {
    try {
      const { avatarConfig, size = 256, userGender = 'Male' } = req.body;
      
      if (!avatarConfig) {
        return res.status(400).json({
          success: false,
          error: 'Avatar configuration is required'
        });
      }

      const result = await simpleAvatarGenerationService.generateAvatar(
        avatarConfig, 
        userGender, 
        size
      );
      
      res.json({
        success: true,
        url: result.url,
        path: result.path,
        isFallback: result.isFallback || false
      });

    } catch (error) {
      logger.error('Error generating avatar preview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate avatar preview'
      });
    }
  }

  /**
   * Generate final avatar and save to user profile
   */
  async generateAvatar(req, res) {
    try {
      const effectiveUser = getEffectiveUser(req);
      const { avatarConfig } = req.body;
      
      if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!avatarConfig) {
        return res.status(400).json({
          success: false,
          error: 'Avatar configuration is required'
        });
      }

      // Find user profile
      let profile;
      if (effectiveUser.isGuest) {
        if (effectiveUser.profileId) {
          profile = await GymBrosProfile.findById(effectiveUser.profileId);
        } else if (effectiveUser.phone) {
          profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
        }
      } else {
        profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      }

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Get user's gender from profile - THIS IS THE KEY PART
      const userGender = profile.gender || 'Male';

      // Delete old generated avatar if exists
      if (profile.avatar?.generatedImageUrl && !profile.avatar.customAvatarUrl) {
        try {
          const oldPath = supabaseStorageService.extractFilePathFromUrl(profile.avatar.generatedImageUrl);
          if (oldPath) {
            await supabaseStorageService.deleteFile(oldPath);
          }
        } catch (deleteError) {
          logger.warn('Failed to delete old avatar:', deleteError);
        }
      }

      // Generate new avatar using the user's gender
      const result = await simpleAvatarGenerationService.generateAvatar(
        avatarConfig, 
        userGender, 
        256
      );
      
      // Update profile with new avatar
      profile.avatar = {
        ...avatarConfig,
        generatedImageUrl: result.url,
        lastGenerated: new Date(),
        version: (profile.avatar?.version || 0) + 1
      };

      await profile.save();

      res.json({
        success: true,
        url: result.url,
        path: result.path,
        avatar: profile.avatar,
        userGender: userGender
      });

    } catch (error) {
      logger.error('Error generating final avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate avatar'
      });
    }
  }

  /**
   * Generate map avatar (smaller, optimized for map display)
   */
  async generateMapAvatar(req, res) {
    try {
      const { avatarConfig, userGender = 'Male', size = 40 } = req.body;
      
      if (!avatarConfig) {
        return res.status(400).json({
          success: false,
          error: 'Avatar configuration is required'
        });
      }

      const result = await simpleAvatarGenerationService.generateMapAvatar(
        avatarConfig, 
        userGender, 
        size
      );
      
      res.json({
        success: true,
        url: result.url,
        path: result.path
      });

    } catch (error) {
      logger.error('Error generating map avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate map avatar'
      });
    }
  }

  /**
   * Upload custom avatar image
   */
  async uploadCustomAvatar(req, res) {
    try {
      const effectiveUser = getEffectiveUser(req);
      
      if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Find user profile
      let profile;
      if (effectiveUser.isGuest) {
        if (effectiveUser.profileId) {
          profile = await GymBrosProfile.findById(effectiveUser.profileId);
        } else if (effectiveUser.phone) {
          profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
        }
      } else {
        profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      }

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      // Upload custom avatar to Supabase
      const uploadResult = await supabaseStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'custom-avatars'
      );

      // Delete old custom avatar if exists
      if (profile.avatar?.customAvatarUrl) {
        try {
          const oldPath = supabaseStorageService.extractFilePathFromUrl(profile.avatar.customAvatarUrl);
          if (oldPath) {
            await supabaseStorageService.deleteFile(oldPath);
          }
        } catch (deleteError) {
          logger.warn('Failed to delete old custom avatar:', deleteError);
        }
      }

      // Update profile
      if (!profile.avatar) {
        profile.avatar = {};
      }
      
      profile.avatar.customAvatarUrl = uploadResult.url;
      profile.avatar.generatedImageUrl = null; // Clear generated avatar
      profile.avatar.lastGenerated = new Date();
      profile.avatar.version = (profile.avatar.version || 0) + 1;

      await profile.save();

      res.json({
        success: true,
        url: uploadResult.url,
        path: uploadResult.path
      });

    } catch (error) {
      logger.error('Error uploading custom avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload custom avatar'
      });
    }
  }

  /**
   * Get available avatar options
   */
  async getOptions(req, res) {
    try {
      const options = await simpleAvatarGenerationService.getAvailableOptions();
      
      res.json({
        success: true,
        ...options
      });

    } catch (error) {
      logger.error('Error getting avatar options:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get avatar options'
      });
    }
  }

  /**
   * Get fallback avatar based on gender
   */
  async getFallback(req, res) {
    try {
      const { gender = 'male' } = req.params;
      
      // Serve fallback avatar from assets based on gender
      const genderFolder = gender.toLowerCase();
      const fallbackUrl = supabaseStorageService.getPublicUrl(
        `avatar-assets/fallback/default_mouse_${genderFolder}.png`
      );
      
      res.redirect(fallbackUrl);

    } catch (error) {
      logger.error('Error getting fallback avatar:', error);
      res.status(404).json({
        success: false,
        error: 'Fallback avatar not found'
      });
    }
  }

  /**
   * Delete custom avatar
   */
  async deleteCustomAvatar(req, res) {
    try {
      const effectiveUser = getEffectiveUser(req);
      
      if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Find user profile
      let profile;
      if (effectiveUser.isGuest) {
        if (effectiveUser.profileId) {
          profile = await GymBrosProfile.findById(effectiveUser.profileId);
        } else if (effectiveUser.phone) {
          profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
        }
      } else {
        profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      }

      if (!profile || !profile.avatar?.customAvatarUrl) {
        return res.status(404).json({
          success: false,
          error: 'Custom avatar not found'
        });
      }

      // Delete from Supabase storage
      try {
        const filePath = supabaseStorageService.extractFilePathFromUrl(profile.avatar.customAvatarUrl);
        if (filePath) {
          await supabaseStorageService.deleteFile(filePath);
        }
      } catch (deleteError) {
        logger.warn('Failed to delete custom avatar from storage:', deleteError);
      }

      // Clear from profile
      profile.avatar.customAvatarUrl = null;
      profile.avatar.version = (profile.avatar.version || 0) + 1;
      
      await profile.save();

      res.json({
        success: true,
        message: 'Custom avatar deleted'
      });

    } catch (error) {
      logger.error('Error deleting custom avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete custom avatar'
      });
    }
  }

  /**
   * Regenerate avatar if needed (uses profile gender automatically)
   */
  async regenerateIfNeeded(req, res) {
    try {
      const effectiveUser = getEffectiveUser(req);
      
      if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Find user profile
      let profile;
      if (effectiveUser.isGuest) {
        if (effectiveUser.profileId) {
          profile = await GymBrosProfile.findById(effectiveUser.profileId);
        } else if (effectiveUser.phone) {
          profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
        }
      } else {
        profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      }

      if (!profile || !profile.avatar) {
        return res.status(404).json({
          success: false,
          error: 'Profile or avatar not found'
        });
      }

      // Check if regeneration is needed
      const needsRegeneration = !profile.avatar.generatedImageUrl || 
                               !profile.avatar.lastGenerated ||
                               (profile.avatar.lastModified && 
                                new Date(profile.avatar.lastModified) > new Date(profile.avatar.lastGenerated));

      if (!needsRegeneration) {
        return res.json({
          success: true,
          message: 'Avatar is up to date',
          url: profile.avatar.generatedImageUrl || profile.avatar.customAvatarUrl,
          regenerated: false,
          userGender: profile.gender
        });
      }

      // Regenerate avatar using user's gender from profile
      const userGender = profile.gender || 'Male';
      const result = await simpleAvatarGenerationService.generateAvatar(
        profile.avatar, 
        userGender, 
        256
      );
      
      // Update profile
      profile.avatar.generatedImageUrl = result.url;
      profile.avatar.lastGenerated = new Date();
      
      await profile.save();

      res.json({
        success: true,
        message: 'Avatar regenerated',
        url: result.url,
        regenerated: true,
        userGender: userGender
      });

    } catch (error) {
      logger.error('Error regenerating avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate avatar'
      });
    }
  }

  /**
   * Clear avatar cache
   */
  async clearCache(req, res) {
    try {
      simpleAvatarGenerationService.clearCache();
      
      res.json({
        success: true,
        message: 'Avatar cache cleared'
      });

    } catch (error) {
      logger.error('Error clearing avatar cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }

  /**
   * Get current user's avatar info with gender
   */
  async getCurrentAvatar(req, res) {
    try {
      const effectiveUser = getEffectiveUser(req);
      
      if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Find user profile
      let profile;
      if (effectiveUser.isGuest) {
        if (effectiveUser.profileId) {
          profile = await GymBrosProfile.findById(effectiveUser.profileId);
        } else if (effectiveUser.phone) {
          profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
        }
      } else {
        profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      }

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
      }

      res.json({
        success: true,
        avatar: profile.avatar || {},
        userGender: profile.gender || 'Male',
        hasCustomAvatar: !!profile.avatar?.customAvatarUrl,
        hasGeneratedAvatar: !!profile.avatar?.generatedImageUrl
      });

    } catch (error) {
      logger.error('Error getting current avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get current avatar'
      });
    }
  }
}

export default new AvatarController();
// services/avatarService.js
import { toast } from 'sonner';

class AvatarService {
  static getSupabaseBaseUrl() {
    return 'https://qqfdpetawucteqzrlzyn.supabase.co/storage/v1/object/public/uploads';
  }

  /**
   * Get the best avatar URL for a user
   * Priority: Custom Upload > Generated > Default Fallback
   */
  static getAvatarUrl(avatar, userGender = 'Male', size = 256) {
    // 1. Custom uploaded avatar (highest priority)
    if (avatar?.customAvatarUrl) {
      return avatar.customAvatarUrl;
    }

    // 2. Generated avatar image from mouse customization
    if (avatar?.generatedImageUrl) {
      return avatar.generatedImageUrl;
    }
    
    // 3. Fallback to default avatar based on gender
    return this.getDefaultAvatar(userGender, size);
  }

  /**
   * Get default avatar based on user gender
   */
  static getDefaultAvatar(userGender = 'Male', size = 256) {
    const genderFolder = userGender.toLowerCase();
    const baseUrl = this.getSupabaseBaseUrl();
    return `${baseUrl}/gym-bros/avatar-assets/fallback/default_mouse_${genderFolder}.png`;
  }

  /**
   * Upload a custom avatar image
   */
  static async uploadCustomAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Add auth headers if needed
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      return {
        success: true,
        url: result.url,
        path: result.path
      };

    } catch (error) {
      console.error('Error uploading custom avatar:', error);
      throw error;
    }
  }

  /**
   * Generate avatar from mouse customization
   */
  static async generateAvatarFromConfig(avatarConfig, userGender = 'Male') {
    try {
      const response = await fetch('/api/avatar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarConfig,
          userGender
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate avatar');
      }

      return {
        success: true,
        url: result.url,
        avatar: result.avatar
      };

    } catch (error) {
      console.error('Error generating avatar:', error);
      throw error;
    }
  }

  /**
   * Save avatar configuration to profile
   */
  static async saveAvatarConfig(avatarConfig) {
    try {
      const response = await fetch('/api/gym-bros/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: avatarConfig
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save avatar configuration');
      }

      return result;

    } catch (error) {
      console.error('Error saving avatar config:', error);
      throw error;
    }
  }

  /**
   * Delete custom avatar
   */
  static async deleteCustomAvatar() {
    try {
      const response = await fetch('/api/avatar/custom', {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete custom avatar');
      }

      return result;

    } catch (error) {
      console.error('Error deleting custom avatar:', error);
      throw error;
    }
  }
}

export default AvatarService;
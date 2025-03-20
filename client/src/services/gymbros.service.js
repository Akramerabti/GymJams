// services/gymbros.service.js
import api from './api';

const gymbrosService = {
  /**
   * Check if phone number already exists in the system
   */
  async checkPhoneExists(phone) {
    try {
      const response = await api.post('/gym-bros/check-phone', { phone });
      return response.data.exists;
    } catch (error) {
      console.error('Error checking if phone exists:', error);
      throw error;
    }
  },

  async sendVerificationCode(phone) {
    try {
      const response = await api.post('/gym-bros/send-verification', { phone });
      return response.data;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  },

  async verifyCode(phone, code) {
    try {

  
      // Send the phone number without the country code to the backend
      const response = await api.post('/gym-bros/verify-code', { 
        phone, 
        code 
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  },

  async loginWithPhone(phone, verificationToken) {
    try {
      const response = await api.post('/auth/phone-login', { 
        phone, 
        verificationToken 
      });
  
      // If login is successful, update the authorization header
      if (response.data.success && response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Set the default Authorization header for all future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error logging in with phone:', error);
      throw error;
    }
  },

async checkProfileWithVerifiedPhone(phone, verificationToken) {
  try {
    console.log('Checking profile with verified phone:', phone);
    
    // Call the endpoint that does everything in one step
    const response = await api.post('/gym-bros/profile/by-phone', {
      verifiedPhone: phone, 
      verificationToken
    });
    
    console.log('Profile by phone response:', response.data);
    
    // If the request was successful and we got a token
    if (response.data.success && response.data.token) {
      // Set the token in localStorage and update API headers
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      console.log('Auth token set:', response.data.token);
      
      // Clean up any temporary storage
      localStorage.removeItem('verifiedPhone');
      localStorage.removeItem('verificationToken');
      
      // Return the complete response
      return response.data;
    } else {
      console.warn('Profile by phone request failed:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error checking profile with verified phone:', error);
    throw error;
  }
},

 
  async registerWithPhone(phone, verificationToken, userData) {
    try {
      const response = await api.post('/auth/phone-register', {
        phone,
        verificationToken,
        userData
      });
      return response.data;
    } catch (error) {
      console.error('Error registering with phone:', error);
      throw error;
    }
  },

  /**
   * Get user's GymBros profile or check if one exists
   */
  async getGymBrosProfile() {
    try {
      const response = await api.get('/gym-bros/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching GymBros profile:', error);
      throw error;
    }
  },

  /**
   * Create or update a GymBros profile
   */
  async createOrUpdateProfile(profileData) {
    console.log('Creating/updating GymBros profile:', profileData);
    try {
      const response = await api.post('/gym-bros/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating GymBros profile:', error);
      throw error;
    }
  },

  /**
   * Get recommended GymBros profiles based on filters
   */
  async getRecommendedProfiles(filters = {}) {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.workoutTypes?.length > 0) {
        queryParams.append('workoutTypes', filters.workoutTypes.join(','));
      }
      
      if (filters.experienceLevel && filters.experienceLevel !== 'Any') {
        queryParams.append('experienceLevel', filters.experienceLevel);
      }
      
      if (filters.preferredTime && filters.preferredTime !== 'Any') {
        queryParams.append('preferredTime', filters.preferredTime);
      }
      
      if (filters.genderPreference && filters.genderPreference !== 'All') {
        queryParams.append('gender', filters.genderPreference);
      }
      
      if (filters.ageRange) {
        queryParams.append('minAge', filters.ageRange.min || 18);
        queryParams.append('maxAge', filters.ageRange.max || 99);
      }
      
      queryParams.append('maxDistance', filters.maxDistance || 50);
      
      // Add timestamp to prevent caching
      queryParams.append('_t', Date.now());
      
      const response = await api.get(`/gym-bros/profiles?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended profiles:', error);
      throw error;
    }
  },

  /**
   * Like a GymBros profile
   */
  async likeProfile(profileId, viewDuration = 0) {
    try {
      const response = await api.post(`/gym-bros/like/${profileId}`, { viewDuration });
      return response.data;
    } catch (error) {
      console.error('Error liking profile:', error);
      throw error;
    }
  },

  /**
   * Dislike a GymBros profile
   */
  async dislikeProfile(profileId, viewDuration = 0) {
    try {
      const response = await api.post(`/gym-bros/dislike/${profileId}`, { viewDuration });
      return response.data;
    } catch (error) {
      console.error('Error disliking profile:', error);
      throw error;
    }
  },

  /**
   * Get all matches for the current user
   */
  async getMatches() {
    try {
      const response = await api.get('/gym-bros/matches');
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  /**
   * Get user preferences for GymBros
   */
  async getUserPreferences() {
    try {
      const response = await api.get('/gym-bros/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  /**
   * Update user preferences for GymBros
   */
  async updateUserPreferences(preferences) {
    try {
      const response = await api.put('/gym-bros/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  /**
   * Get user settings for GymBros
   */
  async getUserSettings() {
    try {
      const response = await api.get('/gym-bros/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  /**
   * Update user settings for GymBros
   */
  async updateUserSettings(settings) {
    try {
      const response = await api.put('/gym-bros/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  /**
   * Upload profile images
   */
  async uploadProfileImages(images) {
    try {
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await api.post('/gym-bros/profile-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading profile images:', error);
      throw error;
    }
  },

  /**
   * Delete profile image
   */
  async deleteProfileImage(imageId) {
    try {
      const response = await api.delete(`/gym-bros/profile-image/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }
};

export default gymbrosService;
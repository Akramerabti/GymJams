// services/gymbros.service.js
import api from './api';

const gymbrosService = {
 
  getGuestToken() {
    return localStorage.getItem('gymbros_guest_token');
  },
  
  setGuestToken(token) {
    if (token) {
      localStorage.setItem('gymbros_guest_token', token);
      
      // Also update API headers
      api.defaults.headers.common['x-gymbros-guest-token'] = token;
    } else {
      localStorage.removeItem('gymbros_guest_token');
      delete api.defaults.headers.common['x-gymbros-guest-token'];
    }
    return token;
  },
  
  
  clearGuestState() {
    localStorage.removeItem('gymbros_guest_token');
    localStorage.removeItem('verifiedPhone');
    localStorage.removeItem('verificationToken');
    delete api.defaults.headers.common['x-gymbros-guest-token'];
  },

  
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
      const response = await api.post('/gym-bros/verify-code', { 
        phone, 
        code 
      });
      
      // If verification was successful, save the token
      if (response.data.success && response.data.token) {
        localStorage.setItem('verificationToken', response.data.token);
        localStorage.setItem('verifiedPhone', phone);
      }
      
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
        
        // Clear any guest state
        this.clearGuestState();
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
      } 
      // If we got a guest token back
      else if (response.data.guestToken) {
        // Save the guest token for future requests
        this.setGuestToken(response.data.guestToken);
        console.log('Guest token set:', response.data.guestToken);
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

  async getGymBrosProfile() {
    try {
      // Add guest token to query params if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.get('/gym-bros/profile', { params });
      
      // If we received a guest token in the response, update it
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching GymBros profile:', error);
      throw error;
    }
  },

  async createOrUpdateProfile(profileData) {
    console.log('Creating/updating GymBros profile:', profileData);
    try {
      // Check if we have verified phone data for a guest
      const verificationToken = localStorage.getItem('verificationToken');
      const verifiedPhone = localStorage.getItem('verifiedPhone');
      
      // Include verification token if available
      if (verificationToken && verifiedPhone) {
        profileData.verificationToken = verificationToken;
        
        // Make sure phone matches the verified one
        if (!profileData.phone) {
          profileData.phone = verifiedPhone;
        }
      }
      
      // Include guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.post('/gym-bros/profile', profileData, { params });
      
      // Handle guest token if received
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      // Clean up temporary verification data
      if (response.data.success) {
        localStorage.removeItem('verificationToken');
        localStorage.removeItem('verifiedPhone');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating/updating GymBros profile:', error);
      throw error;
    }
  },

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
      
      // Add guest token if available
      const guestToken = this.getGuestToken();
      if (guestToken) {
        queryParams.append('guestToken', guestToken);
      }
      
      const response = await api.get(`/gym-bros/profiles?${queryParams.toString()}`);
      
      // Return the recommendations array
      return response.data.recommendations || [];
    } catch (error) {
      console.error('Error fetching recommended profiles:', error);
      throw error;
    }
  },

  async likeProfile(profileId, viewDuration = 0) {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.post(
        `/gym-bros/like/${profileId}`, 
        { viewDuration },
        { params }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error liking profile:', error);
      throw error;
    }
  },

  async dislikeProfile(profileId, viewDuration = 0) {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.post(
        `/gym-bros/dislike/${profileId}`, 
        { viewDuration },
        { params }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error disliking profile:', error);
      throw error;
    }
  },

  async getMatches() {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.get('/gym-bros/matches', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  async getUserPreferences() {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.get('/gym-bros/preferences', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  async updateUserPreferences(preferences) {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.put('/gym-bros/preferences', preferences, { params });
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  async getUserSettings() {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.get('/gym-bros/settings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  async updateUserSettings(settings) {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.put('/gym-bros/settings', settings, { params });
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  async uploadProfileImages(images) {
    try {
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });
      
      // Add guest token if available
      const guestToken = this.getGuestToken();
      if (guestToken) {
        formData.append('guestToken', guestToken);
      }
      
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

  async deleteProfileImage(imageId) {
    try {
      // Add guest token if available
      const guestToken = this.getGuestToken();
      const params = guestToken ? { guestToken } : {};
      
      const response = await api.delete(`/gym-bros/profile-image/${imageId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  },

  async convertGuestToUser() {
    try {
      const guestToken = this.getGuestToken();
      if (!guestToken) {
        return { success: false, message: 'No guest token available' };
      }
      
      const response = await api.post('/gym-bros/convert-guest', { guestToken });
      
      if (response.data.success) {
        // Clear guest state
        this.clearGuestState();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error converting guest to user:', error);
      throw error;
    }
  }
};

export default gymbrosService;
// services/gymbros.service.js
import api from './api';

const gymbrosService = {
 
  getGuestToken() {
    return localStorage.getItem('gymbros_guest_token');
  },
  
  setGuestToken(token) {
    if (token) {
      localStorage.setItem('gymbros_guest_token', token);
      api.defaults.headers.common['x-gymbros-guest-token'] = token;
      console.log('Guest token set:', token.substring(0, 15) + '...');
    } else {
      localStorage.removeItem('gymbros_guest_token');
      delete api.defaults.headers.common['x-gymbros-guest-token'];
      console.log('Guest token cleared');
    }
    return token;
  },

  clearGuestState() {
    localStorage.removeItem('gymbros_guest_token');
    localStorage.removeItem('verifiedPhone');
    localStorage.removeItem('verificationToken');
    delete api.defaults.headers.common['x-gymbros-guest-token'];
  },

  // Helper method for requests with guest token
  configWithGuestToken(additionalConfig = {}) {
    const guestToken = this.getGuestToken();
    const config = { ...additionalConfig };
    
    if (guestToken) {
      config.headers = {
        ...(config.headers || {}),
        'x-gymbros-guest-token': guestToken
      };
      
      config.params = {
        ...(config.params || {}),
        guestToken
      };
    }
    
    return config;
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

  async deleteProfile() {
    try {
      // Set up config with guest token
      const config = this.configWithGuestToken();
      
      const response = await api.delete('/gym-bros/profile', config);
      
      return {
        success: true,
        message: response.data.message || 'Profile deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },

  // Get GymBros profile with proper handling of images
  async getGymBrosProfile() {
    try {
      // Create config with guest token explicitly added
      const config = this.configWithGuestToken();
      
      console.log('Making profile request with config:', JSON.stringify(config));
      
      const response = await api.get('/gym-bros/profile', config);
      
      // Process profile to ensure images are correctly formatted
      if (response.data.profile) {
        // Ensure images array exists
        if (!response.data.profile.images) {
          response.data.profile.images = [];
        }
        // Set profileImage correctly if not set
        if (!response.data.profile.profileImage && response.data.profile.images.length > 0) {
          response.data.profile.profileImage = response.data.profile.images[0];
        }
        
        // Also ensure photos field exists for compatibility with PhotoEditor component
        response.data.profile.photos = [...response.data.profile.images];
      }
      
      // If we received a guest token in the response, update it
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
        console.log('Updated guest token from response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching GymBros profile:', error);
      throw error;
    }
  },

  // Updated createOrUpdateProfile function for gymbros.service.js
async createOrUpdateProfile(profileData) {
  console.log('Creating/updating GymBros profile with original data:', profileData);
  try {
    // Check if we have verified phone data for a guest
    const verificationToken = localStorage.getItem('verificationToken');
    const verifiedPhone = localStorage.getItem('verifiedPhone');
    
    // Create a deep copy of the data to avoid modifying the original
    const processedData = { ...profileData };
    
    // IMPORTANT: Handle images correctly - log raw data for debugging
    console.log('Received images in profileData:', 
                profileData.images ? 
                `${Array.isArray(profileData.images) ? profileData.images.length : 'non-array'} images: ${
                  Array.isArray(profileData.images) ? JSON.stringify(profileData.images) : profileData.images
                }` : 
                'No images');
                
    // Fix images field if it's a string instead of an array (crucial)
    if (typeof profileData.images === 'string') {
      console.warn('Images field is a string, not an array! Converting to empty array.');
      processedData.images = [];
    }
    
    // Fix images field if it's not defined or not an array
    if (!profileData.images || !Array.isArray(profileData.images)) {
      console.warn('No valid images array found, checking photos field');
      
      // Try to use photos field if available
      if (profileData.photos && Array.isArray(profileData.photos)) {
        const validUrls = profileData.photos.filter(url => url && !url.startsWith('blob:'));
        console.log(`Found ${validUrls.length} valid URLs in photos field:`, validUrls);
        processedData.images = validUrls;
      } else {
        // Initialize as empty array
        processedData.images = [];
      }
    }
    
    // Cleanup: Remove any blob URLs from images array
    if (Array.isArray(processedData.images)) {
      const filtered = processedData.images.filter(url => url && !url.startsWith('blob:'));
      if (filtered.length !== processedData.images.length) {
        console.warn(`Removed ${processedData.images.length - filtered.length} blob URLs from images array`);
        processedData.images = filtered;
      }
    }
    
    // Always remove photos field before sending to server
    delete processedData.photos;
    
    // Include verification token if available
    if (verificationToken && verifiedPhone) {
      processedData.verificationToken = verificationToken;
      
      // Make sure phone matches the verified one
      if (!processedData.phone) {
        processedData.phone = verifiedPhone;
      }
    }
    
    // Log the final data being sent
    console.log('Sending processed data to server:', {
      ...processedData,
      images: processedData.images && Array.isArray(processedData.images) ? 
              `Array with ${processedData.images.length} items: ${JSON.stringify(processedData.images)}` : 
              'Invalid images field'
    });
    
    // Create request config with guest token
    const config = this.configWithGuestToken();
    
    const response = await api.post('/gym-bros/profile', processedData, config);
    
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
      const queryParams = {};
      
      if (filters.workoutTypes?.length > 0) {
        queryParams.workoutTypes = filters.workoutTypes.join(',');
      }
      
      if (filters.experienceLevel && filters.experienceLevel !== 'Any') {
        queryParams.experienceLevel = filters.experienceLevel;
      }
      
      if (filters.preferredTime && filters.preferredTime !== 'Any') {
        queryParams.preferredTime = filters.preferredTime;
      }
      
      if (filters.genderPreference && filters.genderPreference !== 'All') {
        queryParams.gender = filters.genderPreference;
      }
      
      if (filters.ageRange) {
        queryParams.minAge = filters.ageRange.min || 18;
        queryParams.maxAge = filters.ageRange.max || 99;
      }
      
      queryParams.maxDistance = filters.maxDistance || 50;
      
      // Add timestamp to prevent caching
      queryParams._t = Date.now();
      
      // Set up config with guest token
      const config = this.configWithGuestToken({
        params: queryParams
      });
      
      console.log('Making profiles request with params:', JSON.stringify(config));
      
      const response = await api.get('/gym-bros/profiles', config);
      
      // If we received a guest token in the response, update it
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
        console.log('Updated guest token from profiles response');
      }
      
      // Return the recommendations array
      return response.data.recommendations || [];
    } catch (error) {
      console.error('Error fetching recommended profiles:', error);
      throw error;
    }
  },

  async likeProfile(profileId, viewDuration = 0) {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.post(
        `/gym-bros/like/${profileId}`, 
        { viewDuration },
        config
      );
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error liking profile:', error);
      throw error;
    }
  },

  async dislikeProfile(profileId, viewDuration = 0) {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.post(
        `/gym-bros/dislike/${profileId}`, 
        { viewDuration },
        config
      );
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error disliking profile:', error);
      throw error;
    }
  },

  async getMatches() {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.get('/gym-bros/matches', config);
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  async getUserPreferences() {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.get('/gym-bros/preferences', config);
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  async updateUserPreferences(preferences) {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.put('/gym-bros/preferences', preferences, config);
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  async getUserSettings() {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.get('/gym-bros/settings', config);
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  async updateUserSettings(settings) {
    try {
      // Add guest token
      const config = this.configWithGuestToken();
      
      const response = await api.put('/gym-bros/settings', settings, config);
      
      // Update guest token if returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },


// Fixed uploadProfileImages function for gymbros.service.js
async uploadProfileImages(files) {
  try {
    console.log('=== SERVICE UPLOAD IMAGES DEBUG START ===');
    
    // Validate input
    if (!files || !files.length) {
      console.error('No files provided to uploadProfileImages');
      throw new Error('No images provided');
    }
    
    // Log what we're trying to upload to help debug
    console.log(`Attempting to upload ${files.length} files:`, 
      files.map(f => ({name: f.name, type: f.type, size: f.size})));
    
    // Create FormData for the files
    const formData = new FormData();
    
    // IMPORTANT: Use "files" instead of "images" to match server expectation
    files.forEach((file, index) => {
      // Ensure we're working with File objects
      if (!(file instanceof File)) {
        console.error(`Invalid file object at index ${index}:`, file);
        throw new Error('Invalid file type. Only File objects are accepted.');
      }
      
      // The field name MUST match what the server expects from multer (configured as "files")
      console.log(`Adding file "${file.name}" to FormData with field name "files"`);
      formData.append('files', file);
    });
    
    // Log the FormData keys to verify correct structure
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(`- ${pair[0]}: ${typeof pair[1] === 'object' ? 'File object' : pair[1]}`);
    }
    
    // Get guest token if available
    const guestToken = this.getGuestToken();
    console.log('Guest token available:', !!guestToken);
    
    // Set up config with guest token and content type
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {}
    };
    
    // Add guest token to headers and params if available
    if (guestToken) {
      config.headers['x-gymbros-guest-token'] = guestToken;
      config.params.guestToken = guestToken;
    }
    
    console.log('Upload request configuration:', {
      url: '/gym-bros/profile-images',
      method: 'POST',
      headers: {...config.headers},
      params: {...config.params}
    });
    
    // Make the API request
    console.log('Sending upload request to server...');
    const uploadStartTime = Date.now();
    const response = await api.post('/gym-bros/profile-images', formData, config);
    const uploadDuration = Date.now() - uploadStartTime;
    
    console.log(`Upload request completed in ${uploadDuration}ms with status ${response.status}`);
    console.log('Upload response data:', response.data);
    
    // Check if the response contains image URLs
    if (!response.data || !response.data.imageUrls) {
      console.error('Invalid response format:', response.data);
      throw new Error('Invalid server response format - missing imageUrls array');
    }

    // Return the image URLs exactly as they are from the server
    const imageUrls = response.data.imageUrls;
    console.log(`Received ${imageUrls.length} image URLs from server:`, imageUrls);
    
    // Update guest token if one was returned
    if (response.data.guestToken) {
      console.log('Updating guest token from response');
      this.setGuestToken(response.data.guestToken);
    }
    
    const result = {
      success: true,
      imageUrls,
      message: response.data.message || 'Images uploaded successfully'
    };
    
    console.log('Returning result:', result);
    console.log('=== SERVICE UPLOAD IMAGES DEBUG END ===');
    return result;
  } catch (error) {
    console.error('Error in uploadProfileImages:', error);
    
    // Check for network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - check server connectivity');
    }
    
    // Check for server errors
    if (error.response) {
      console.error('Server returned error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    // Provide more specific error message if available
    if (error.response?.data?.error) {
      console.error('Server error message:', error.response.data.error);
      throw new Error(error.response.data.error);
    }
    
    console.log('=== SERVICE UPLOAD IMAGES DEBUG END (WITH ERROR) ===');
    throw error;
  }
},

  async deleteProfileImage(imageId) {
    try {
      // Validate input
      if (!imageId) {
        throw new Error('No image ID provided');
      }
      
      // Set up config with guest token
      const config = this.configWithGuestToken();
      
      const response = await api.delete(`/gym-bros/profile-image/${imageId}`, config);
      
      // Update guest token if one was returned
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return {
        success: true,
        message: response.data.message || 'Image deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting profile image:', error);
      
      // Provide more specific error message if available
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw error;
    }
  },

  async blobUrlToFile(blobUrl, originalFileName = null) {
    try {
      // Generate a default name if none provided
      const defaultName = `image-${Date.now()}.jpg`;
      
      // Preserve original filename if provided
      const fileName = originalFileName || defaultName;
      
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // Create a File object with the preserved filename
      return new File([blob], fileName, { 
        type: blob.type || 'image/jpeg' 
      });
    } catch (error) {
      console.error('Error converting blob to file:', error);
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
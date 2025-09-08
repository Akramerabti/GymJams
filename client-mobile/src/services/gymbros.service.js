import api from './api';

const gymbrosService = {
  initializationCache: null,
  initializationPromise: null,
  lastInitTime: 0,
  initCacheTime: 600000,
 
  getGuestToken() {
    return localStorage.getItem('gymbros_guest_token');
  },
  
  setGuestToken(token) {
    if (token) {
      localStorage.setItem('gymbros_guest_token', token);
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

  async initializeGymBros() {
    const now = Date.now();
    
    if (this.initializationCache && (now - this.lastInitTime) < this.initCacheTime) {
      return this.initializationCache;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._doInitialize().finally(() => {
      this.initializationPromise = null;
    });
    
    return this.initializationPromise;
  },
  
  async _doInitialize() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/initialize', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      this.initializationCache = response.data;
      this.lastInitTime = Date.now();
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async checkPhoneExists(phone) {
    try {
      const response = await api.post('/gym-bros/check-phone', { phone });
      return response.data.exists;
    } catch (error) {
      throw error;
    }
  },

  async sendVerificationCode(phone) {
    try {
      const response = await api.post('/gym-bros/send-verification', { phone });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async checkGymBrosProfile() {
  try {
    const config = this.configWithGuestToken();
    const response = await api.get('/gym-bros/profile', config);
    
    if (response.data.guestToken) {
      this.setGuestToken(response.data.guestToken);
    }
    
    // Return in the expected format
    return {
      success: !!response.data.profile,
      profile: response.data.profile || null,
      ...response.data
    };
  } catch (error) {
    console.error('Error checking GymBros profile:', error);
    
    // Return consistent format even on error
    return {
      success: false,
      profile: null,
      error: error.message
    };
  }
},

  async getMapUsers(filters = {}) {
    try {
      const queryParams = {};
      if (filters.workoutTypes?.length) {
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
        if (filters.ageRange.min) queryParams.minAge = filters.ageRange.min;
        if (filters.ageRange.max) queryParams.maxAge = filters.ageRange.max;
      }
      if (filters.maxDistance) {
        queryParams.maxDistance = filters.maxDistance;
      }
      queryParams.includeRecommendations = filters.includeRecommendations !== false ? 'true' : 'false';
      // Add timestamp to avoid caching
      queryParams._t = Date.now();

      const config = this.configWithGuestToken({ params: queryParams });
      const response = await api.get('/gym-bros/map/users', config);

      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }

      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching map users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch map users');
    }
  },

  async verifyCode(phone, code) {
    try {
      const response = await api.post('/gym-bros/verify-code', { 
        phone, 
        code 
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('verificationToken', response.data.token);
        localStorage.setItem('verifiedPhone', phone);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async loginWithPhone(phone, verificationToken) {
    try {
      const response = await api.post('/auth/phone-login', { 
        phone, 
        verificationToken 
      });
  
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        this.clearGuestState();
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async checkProfileAfterVerification(phone, tempToken) {
    try {
      console.log('🔍 checkProfileAfterVerification called with:', {
        phone,
        hasTempToken: !!tempToken
      });
      
      const response = await api.post('/gym-bros/profile/after-verification', {
        phone, 
        tempToken
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        localStorage.removeItem('verifiedPhone');
        localStorage.removeItem('verificationToken');
        
        this.clearGuestState();

        return response.data;
      } 
      else if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in checkProfileAfterVerification:', error);
      throw error;
    }
  },

  async checkProfileWithVerifiedPhone(phone, verificationToken) {
    try {      
      const response = await api.post('/gym-bros/profile/by-phone', {
        verifiedPhone: phone, 
        verificationToken
      });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        localStorage.removeItem('verifiedPhone');
        localStorage.removeItem('verificationToken');
        this.clearGuestState();

        return response.data;
      } 
      else if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
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
      throw error;
    }
  },

  async deleteProfile() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.delete('/gym-bros/profile', config);
      
      return {
        success: true,
        message: response.data.message || 'Profile deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  },

  async getGymBrosProfile() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/profile', config);
      
      if (response.data.profile) {
        if (!response.data.profile.images) {
          response.data.profile.images = [];
        }
        if (!response.data.profile.profileImage && response.data.profile.images.length > 0) {
          response.data.profile.profileImage = response.data.profile.images[0];
        }
        
        response.data.profile.photos = [...response.data.profile.images];
      }
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createOrUpdateProfile(profileData) {
    try {
      const verificationToken = localStorage.getItem('verificationToken');
      const verifiedPhone = localStorage.getItem('verifiedPhone');
      
      const processedData = { ...profileData };

      if (typeof profileData.images === 'string') {
        processedData.images = [];
      }
      
      if (!profileData.images || !Array.isArray(profileData.images)) {
        if (profileData.photos && Array.isArray(profileData.photos)) {
          const validUrls = profileData.photos.filter(url => url && !url.startsWith('blob:'));
          processedData.images = validUrls;
        } else {
          processedData.images = [];
        }
      }
      
      if (Array.isArray(processedData.images)) {
        const filtered = processedData.images.filter(url => url && !url.startsWith('blob:'));
        if (filtered.length !== processedData.images.length) {
          processedData.images = filtered;
        }
      }
      
      delete processedData.photos;
      
      if (verificationToken && verifiedPhone) {
        processedData.verificationToken = verificationToken;
        
        if (!processedData.phone) {
          processedData.phone = verifiedPhone;
        }
      }
      
      const config = this.configWithGuestToken();
      const response = await api.post('/gym-bros/profile', processedData, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      if (response.data.success) {
        localStorage.removeItem('verificationToken');
        localStorage.removeItem('verifiedPhone');
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getRecommendedProfiles(filters = {}) {
    try {
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
      
      if (filters.skip) {
        queryParams.skip = filters.skip;
      }
      
      queryParams._t = Date.now();
      
      const config = this.configWithGuestToken({
        params: queryParams
      });
      
      const response = await api.get('/gym-bros/profiles', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data.recommendations || [];
    } catch (error) {
      throw error;
    }
  },

  async likeProfile(profileId, viewDuration = 0) {
    try {
      const config = this.configWithGuestToken();
      
      const response = await api.post(
        `/gym-bros/like/${profileId}`, 
        { viewDuration },
        config
      );
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async dislikeProfile(profileId, viewDuration = 0) {
    try {
      const config = this.configWithGuestToken();
      
      const response = await api.post(
        `/gym-bros/dislike/${profileId}`, 
        { viewDuration },
        config
      );
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  async getMatches() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/matches', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      let matchesData;
      
      if (Array.isArray(response.data)) {
        matchesData = response.data;
      } else if (response.data && Array.isArray(response.data.matches)) {
        matchesData = response.data.matches;
      } else {
        matchesData = [];
      }
      
      return matchesData;
    } catch (error) {
      return [];
    }
  },

  async getUserPreferences() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/preferences', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateUserPreferences(preferences) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.put('/gym-bros/preferences', preferences, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserSettings() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/settings', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateUserSettings(settings) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.put('/gym-bros/settings', settings, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async uploadProfileImages(files) {
    try {
      if (!files || !files.length) {
        throw new Error('No images provided');
      }
      
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      const guestToken = this.getGuestToken();
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {}
      };
      
      if (guestToken) {
        config.headers['x-gymbros-guest-token'] = guestToken;
        config.params.guestToken = guestToken;
      }
      
      const response = await api.post('/gym-bros/profile-images', formData, config);

      if (!response.data || !response.data.imageUrls) {
        throw new Error('Invalid server response format - missing imageUrls array');
      }

      const imageUrls = response.data.imageUrls;
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      const result = {
        success: true,
        imageUrls,
        message: response.data.message || 'Images uploaded successfully'
      };
      
      return result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw error;
    }
  },

  async deleteProfileImage(imageId) {
    try {
      if (!imageId) {
        throw new Error('No image ID provided');
      }
      
      const config = this.configWithGuestToken();
      const response = await api.delete(`/gym-bros/profile-image/${imageId}`, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return {
        success: true,
        message: response.data.message || 'Image deleted successfully'
      };
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      throw error;
    }
  },

  async blobUrlToFile(blobUrl, originalFileName = null) {
    try {
      const defaultName = `image-${Date.now()}.jpg`;
      const fileName = originalFileName || defaultName;
      
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      return new File([blob], fileName, { 
        type: blob.type || 'image/jpeg' 
      });
    } catch (error) {
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
        this.clearGuestState();
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async sendMessage(messageData) {
    try {
      const config = this.configWithGuestToken({
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await api.post(`gym-bros/matches/${messageData.matchId}/messages`, {
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        tempId: messageData.tempId,
        timestamp: messageData.timestamp
      }, config);
  
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async fetchMatchMessages(matchId, options = {}) {
    if (!matchId) {
      return [];
    }
    
    try {
      const params = {
        limit: options.limit || 50,
        offset: options.offset || 0,
        unreadOnly: options.unreadOnly ? 'true' : 'false'
      };

      const config = this.configWithGuestToken({
        params
      });

      const response = await api.get(`/gym-bros/matches/${matchId}/messages`, config);
      
      let messages = [];
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          messages = response.data.data;
        } else if (response.data.messages) {
          messages = response.data.messages;
        }
      } else if (Array.isArray(response.data)) {
        messages = response.data;
      }
      
      if (response.data && response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return messages;
    } catch (error) {
      return [];
    }
  },

  async findMatch(otherUserId) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get(`/gym-bros/matches/find-match/${otherUserId}`, config);
      
      if (response.data.success) {
        const users = Array.isArray(response.data.users) ? 
          response.data.users.map(user => typeof user === 'object' ? user._id : user) : 
          response.data.users;
          
        return {
          matchId: response.data.matchId,
          users: users
        };
      }

      return null;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          return null;
        }
        if (error.response.status === 401) {
          return 'auth-required';
        }
      }
      
      return 'error';
    }
  },

  async sendMatchMessage(matchId, content, files = []) {
    try {
      const config = this.configWithGuestToken();
      
      const messageData = {
        content: content || '',
        timestamp: new Date().toISOString(),
        files: Array.isArray(files) ? files : []
      };
      
      const response = await api.post(`/gym-bros/matches/${matchId}/messages`, messageData, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async markMatchMessagesAsRead(matchId, messageIds) {
    try {
      if (!matchId || !messageIds || !messageIds.length) {
        throw new Error('Match ID and message IDs are required');
      }
      
      const config = this.configWithGuestToken();
      
      const response = await api.put(`/gym-bros/matches/${matchId}/mark-read`, 
        { messageIds }, 
        config
      );
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMatchDetails(matchId) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get(`/gym-bros/matches/${matchId}/details`, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMatchesWithPreview() {
    try {
      const effectiveUserId = this.userId || localStorage.getItem('gymbrosUserId');
      const config = this.configWithGuestToken();
      
      const profilesResponse = await api.get('/gym-bros/matches', config);
      
      let matchedProfiles = [];
      
      if (Array.isArray(profilesResponse.data)) {
        matchedProfiles = profilesResponse.data;
      } else if (profilesResponse.data && Array.isArray(profilesResponse.data.matches)) {
        matchedProfiles = profilesResponse.data.matches;
      }
      
      if (matchedProfiles.length === 0) {
        return [];
      }
      
      const enhancedMatches = await Promise.all(matchedProfiles.map(async (profile) => {
        try {
          const targetId = profile.userId || profile._id;
          const matchData = await this.findMatch(targetId);
          
          if (!matchData?.matchId) {
            return {
              ...profile,
              messages: [],
              lastMessage: null,
              hasConversation: false,
              unreadCount: 0
            };
          }
          
          const messages = await this.fetchMatchMessages(matchData.matchId);
          
          let lastMessage = null;
          let isLastMessageFromUser = false;
          
          if (messages && messages.length > 0) {
            const sortedMessages = [...messages].sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            );
            
            const latestMsg = sortedMessages[0];
            
            isLastMessageFromUser = 
              latestMsg.sender === effectiveUserId || 
              (latestMsg.sender && latestMsg.sender._id === effectiveUserId) ||
              (typeof latestMsg.sender === 'object' && latestMsg.sender.id === effectiveUserId);
            
            lastMessage = {
              content: latestMsg.content || (latestMsg.file?.length ? "Media message" : ""),
              sender: latestMsg.sender,
              timestamp: latestMsg.timestamp,
              isYours: isLastMessageFromUser
            };
          }
          
          const unreadCount = messages.filter(msg => {
            const senderId = 
              (typeof msg.sender === 'object' && msg.sender._id) ? msg.sender._id : 
              (typeof msg.sender === 'object' && msg.sender.id) ? msg.sender.id : 
              msg.sender;
            
            return !msg.read && senderId !== effectiveUserId;
          }).length;
          
          return {
            ...profile,
            messages,
            lastMessage,
            hasConversation: messages.length > 0,
            unreadCount,
            matchId: matchData.matchId
          };
        } catch (error) {
          return {
            ...profile,
            messages: [],
            lastMessage: null,
            hasConversation: false,
            unreadCount: 0
          };
        }
      }));
      
      if (profilesResponse.data && profilesResponse.data.guestToken) {
        this.setGuestToken(profilesResponse.data.guestToken);
      }
      
      return enhancedMatches;
    } catch (error) {
      return [];
    }
  },

  async getWhoLikedMeCount() {
    try {
      const cachedCount = localStorage.getItem('gymbros_liked_me_count');
      const cachedTimestamp = localStorage.getItem('gymbros_liked_me_count_timestamp');
      const now = Date.now();
      
      if (cachedCount && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 10 * 60 * 1000) {
        return parseInt(cachedCount);
      }
      
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/who-liked-me/count', config);
      
      let count = 0;
      if (typeof response.data === 'number') {
        count = response.data;
      } else if (response.data && typeof response.data.count === 'number') {
        count = response.data.count;
      }
      
      localStorage.setItem('gymbros_liked_me_count', count.toString());
      localStorage.setItem('gymbros_liked_me_count_timestamp', now.toString());
      
      if (response.data && response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return count;
    } catch (error) {
      if (error.response?.status === 429) {
        const cachedCount = localStorage.getItem('gymbros_liked_me_count');
        if (cachedCount) {
          return parseInt(cachedCount);
        }
      }
      
      return 0;
    }
  },

  async getWhoLikedMeProfiles() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/who-liked-me', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      let profiles = [];
      
      if (Array.isArray(response.data)) {
        profiles = response.data;
      } else if (response.data && Array.isArray(response.data.profiles)) {
        profiles = response.data.profiles;
      }
      
      return profiles;
    } catch (error) {
      return [];
    }
  },

  async activateBoost(boostData) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.post('/gym-bros/boosts', boostData, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getActiveBoosts() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/boosts', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data.boosts || [];
    } catch (error) {
      return [];
    }
  },

  async cancelBoost(boostId) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.delete(`/gym-bros/boosts/${boostId}`, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getActiveBoostFactor() {
    try {
      const activeBoosts = await this.getActiveBoosts();
      
      if (!activeBoosts || activeBoosts.length === 0) {
        return 1;
      }
      
      return Math.max(...activeBoosts.map(boost => boost.boostFactor));
    } catch (error) {
      return 1;
    }
  },

  async isBoostTypeActive(boostType) {
    try {
      const activeBoosts = await this.getActiveBoosts();
      
      return activeBoosts.some(boost => boost.boostType === boostType);
    } catch (error) {
      return false;
    }
  },

  async getActiveMembership() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/memberships/active', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSuperLikeLimits() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/super-like-limits', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async purchaseMembership(membershipData) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.post('/gym-bros/memberships', membershipData, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async cancelMembership(membershipId) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.put(`/gym-bros/memberships/${membershipId}/cancel`, {}, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMembershipHistory() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/membership-history', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data.memberships || [];
    } catch (error) {
      return [];
    }
  },

  async getBoostLimits() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/boost-limits', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getGymBrosProfiles() {
    try {
      const config = this.configWithGuestToken();
      const response = await api.get('/gym-bros/profiles', config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      console.log('Fetched GymBros profiles:', response);
      return response.data.profiles || [];
    } catch (error) {
      return [];
    }

  },

  async removeMatch(matchId) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.delete(`/gym-bros/matches/${matchId}`, config);
      
      return {
        success: true,
        message: response.data.message || 'Match removed successfully'
      };
    } catch (error) {
      throw error;
    }
  },
  
  async createMatch(targetUserId) {
    try {
      const config = this.configWithGuestToken();
      const response = await api.post(`/gym-bros/matches/create`, { targetUserId }, config);
      
      if (response.data.guestToken) {
        this.setGuestToken(response.data.guestToken);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default gymbrosService;
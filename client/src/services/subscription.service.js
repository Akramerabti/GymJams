import api from './api';

const subscriptionService = {
  // Create payment intent for subscription
  async createPaymentIntent(planData) {
    try {
      const response = await api.post('/subscription/create-intent', {
        planType: planData.id,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  },

  async updateClientProgress(subscriptionId, progressData) {
    try {
      const response = await api.put(`/subscription/${subscriptionId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Failed to update client progress:', error);
      throw error;
    }
  },

  // Start subscription with payment method
  async startSubscription(paymentMethodId, planType) {
    try {
      const response = await api.post('/subscription', {
        paymentMethodId,
        planType, 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to start subscription:', error);
      throw error;
    }
  },

  async checkQuestionnaireStatus(userIdOrEmail) {
    try {
      const response = await api.get('/subscription/questionnaire-status', {
        params: { userIdOrEmail },
      });
      return response.data;
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
      throw error;
    }
  },

  // Submit the initial questionnaire
  async submitQuestionnaire(answers) {
    try {
      const response = await api.post('/subscription/submit-questionnaire', answers);
      return response.data;
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      throw error;
    }
  },

  async handleSubscriptionSuccess(planType, setupIntentId, paymentMethodId, email, promoCode = null) {
    try {
      const response = await api.post('/subscription/handle-success', {
        planType,
        setupIntentId,
        paymentMethodId,
        email,
        ...(promoCode ? { promoCode } : {})
      });
      return response.data;
    } catch (error) {
      console.error('Failed to handle subscription success:', error);
      throw error;
    }
  },

  async getCurrentSubscription(accessToken = null) {
    try {
      const response = await api.get('/subscription/current', {
        params: accessToken ? { accessToken } : undefined
      });
      //('Current subscription:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      throw error;
    }
  }, 

  async verifyAccessToken(token) {
  try {
    const response = await api.post('/subscription/access', { token });

    if (response.data.success) {
      localStorage.setItem('accessToken', token);
    }
    return response.data;
  } catch (error) {
    console.error('Failed to verify access token:', error);
    throw error;
  }
},

async checkQuestionnaireStatus(accessToken = null) {
  try {
    const response = await api.get('/subscription/questionnaire-status', {
      params: accessToken ? { accessToken } : undefined
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to check questionnaire status:', error);
    throw error;
  }
},

async submitQuestionnaire(answers, accessToken = null, isEdit = false) {
  try {
    const token = accessToken || localStorage.getItem('accessToken');
    
    const requestData = {
      answers,
      isEdit,
      ...(token && { accessToken: token })
    };
    
    const response = await api.post('/subscription/submit-questionnaire', requestData);
    return response.data;
  } catch (error) {
    console.error('Failed to submit questionnaire:', error);
    throw error;
  }
},

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await api.delete(`/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  },

  // Finish current month (remove recurring payment)
  async finishCurrentMonth(subscriptionId) {
    try {
      const response = await api.post(`/subscription/${subscriptionId}/finish-month`);
      return response.data;
    } catch (error) {
      console.error('Failed to finish current month:', error);
      throw error;
    }
  },

  // Update subscription plan
  async updateSubscription(subscriptionId, newPlanType) {
    try {
      const response = await api.put(`/subscription/${subscriptionId}`, {
        newPlanType, // Changed from subscription to newPlanType
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  },

  async getCoaches(accessToken = null, userLocation = null) {
    try {
      console.log('🔄 subscriptionService.getCoaches called with:', {
        hasAccessToken: !!accessToken,
        hasUserLocation: !!(userLocation && userLocation.lat && userLocation.lng),
        userLocation
      });
      
      // Build params with location data if available
      const params = accessToken ? { accessToken } : {};
      
      // Add user location for distance-based filtering
      if (userLocation && userLocation.lat && userLocation.lng) {
        params.userLat = userLocation.lat;
        params.userLng = userLocation.lng;
        params.maxDistance = 50; // Default 50 mile radius
      }
      
      console.log('📤 Making API request to /auth/coach with params:', params);
      const response = await api.get('/auth/coach', { params });
      
      console.log('📨 Raw API response:', {
        totalCoaches: response.data?.length,
        allCoaches: response.data?.map(coach => ({
          id: coach._id,
          name: `${coach.firstName} ${coach.lastName}`,
          payoutSetupComplete: coach.payoutSetupComplete,
          hasLocation: !!(coach.location?.city),
          location: coach.location
        }))
      });
      
      //('All coaches with location data:', response.data);
      
      // Filter coaches to ONLY include those with:
      // 1. Complete payout setup
      // 2. Valid location data (city must be present)
      const coaches = response.data.filter(coach => 
        coach.payoutSetupComplete && 
        coach.location?.city && 
        coach.location.city.trim().length > 0
      );
      
      console.log('✅ Strictly filtered coaches (payout + location required):', {
        totalFromAPI: response.data?.length,
        filteredCount: coaches.length,
        excludedCoaches: response.data?.filter(coach => 
          !coach.payoutSetupComplete || !coach.location?.city || coach.location.city.trim().length === 0
        )?.map(coach => ({
          id: coach._id,
          name: `${coach.firstName} ${coach.lastName}`,
          reason: !coach.payoutSetupComplete ? 'No payout setup' : 'No city location',
          location: coach.location
        })),
        includedCoaches: coaches.map(coach => ({
          id: coach._id,
          name: `${coach.firstName} ${coach.lastName}`,
          city: coach.location.city,
          locationDisplay: coach.locationDisplay
        }))
      });
      
      return coaches;
    } catch (error) {
      console.error('❌ Error fetching coaches:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  async assignRandomCoach() {
    try {
      // Get access token if available
      const accessToken = localStorage.getItem('accessToken');
      
      // Get user location for better matching
      const userLocation = JSON.parse(localStorage.getItem('userLocation') || 'null');
      
      // Get all available coaches with location-based filtering
      const coaches = await this.getCoaches(accessToken, userLocation);
      //('All coaches with location filtering:', coaches);
  
      if (!coaches || coaches.length === 0) {
        throw new Error('No coaches available with payout setup complete and location data');
      }
  
      // If user has location, prioritize nearby coaches
      let selectedCoach;
      if (userLocation && userLocation.lat && userLocation.lng) {
        // Sort by distance if available
        const coachesWithDistance = coaches.filter(coach => coach.distance !== undefined);
        if (coachesWithDistance.length > 0) {
          // Select randomly from the closest 3 coaches
          const nearbyCoaches = coachesWithDistance.slice(0, 3);
          const randomIndex = Math.floor(Math.random() * nearbyCoaches.length);
          selectedCoach = nearbyCoaches[randomIndex];
        } else {
          // No distance data, select randomly
          const randomIndex = Math.floor(Math.random() * coaches.length);
          selectedCoach = coaches[randomIndex];
        }
      } else {
        // No user location, select randomly
        const randomIndex = Math.floor(Math.random() * coaches.length);
        selectedCoach = coaches[randomIndex];
      }
      
      //('Selected coach:', selectedCoach);
  
      if (!selectedCoach) {
        throw new Error('Failed to select a coach');
      }
  
      // Assign the selected coach with access token
      const response = await api.post(
        '/subscription/assign-coach',
        { coachId: selectedCoach._id },
        { params: accessToken ? { accessToken } : {} }
      );
  
      return {
        coach: selectedCoach,
        assignment: response.data,
      };
    } catch (error) {
      console.error('Error assigning random coach:', error);
      throw error;
    }
  },

  // Assign specific coach with access token (only if payout setup is complete)
  async assignCoach(coachId) {
    try {
      // Get access token if available
      const accessToken = localStorage.getItem('accessToken');

      // Verify that the coach has payout setup complete
      const coachResponse = await api.get(`/auth/coach/${coachId}`);
      const coach = coachResponse.data;

      if (!coach.payoutSetupComplete) {
        throw new Error('Coach payout setup is not complete');
      }

      // Assign the selected coach with access token
      const response = await api.post('/subscription/assign-coach',
        { coachId },
        { params: accessToken ? { accessToken } : {} }
      );

      return response.data;
    } catch (error) {
      console.error('Error assigning coach:', error);
      throw error;
    }
  },

  // Function to create a Stripe account
  async createStripeAccount(formData) {
    try {
      //('Creating Stripe account:', formData);
  
      // Define the refresh and return URLs
      const refreshUrl = `${window.location.origin}/profile`; // URL to redirect if onboarding is incomplete
      const returnUrl = `${window.location.origin}/profile`; // URL to redirect after onboarding is complete
  
      // Call the backend to create the Stripe account
      const response = await api.post('/stripe/create-account', {
        ...formData,
        refreshUrl, // Pass the refresh URL
        returnUrl,  // Pass the return URL
      });
  
      return response.data;
    } catch (error) {
      console.error('Failed to create Stripe account:', error);
      throw error; // Re-throw the error for handling in the calling code
    }
  },

  async initiateVerification(accountId, refreshUrl, returnUrl) {
    try {
      // Call the backend to initiate verification
      const response = await api.post('/stripe/create-account-link', {
        accountId,
        refreshUrl,
        returnUrl,
      });
  
      return response.data;
    } catch (error) {
      console.error('Failed to initiate verification:', error);
      throw error; // Re-throw the error for handling in the calling code
    }
  },

  

  // Check if coach's payout setup is complete
  async checkPayoutSetup() {
    try {
      const response = await api.get('/stripe/check-payout-setup');
      return response.data;
    } catch (error) {
      console.error('Failed to check payout setup:', error);
      throw error;
    }
  },

  async checkVerificationStatus(verificationSessionId) {
    try {
      const response = await api.post('/stripe/check-verification-status', {
        verificationSessionId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check verification status:', error);
      throw error;
    }
  },

  async createStripeDashboardLink(accountId) {
    try {
      const response = await api.post('/stripe/create-dashboard-link', {
        accountId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create Stripe dashboard link:', error);
      throw error;
    }
  },

   // Get user dashboard data
   async getUserDashboardData(accessToken = null) {
    try {
      const response = await api.get('/user/dashboard/user', {
        params: accessToken ? { accessToken } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user dashboard data:', error);
      throw error;
    }
  },

  // Get coach dashboard data
  async getCoachDashboardData(accessToken = null) {
    try {
      const response = await api.get('/user/dashboard/coach', {
        params: accessToken ? { accessToken } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch coach dashboard data:', error);
      throw error;
    }
  },

  async updateClientStats(clientId, updatedStats) {
    try {
      const response = await api.put(`/user/${clientId}/stats`, updatedStats);
      return response.data;
    } catch (error) {
      console.error('Failed to update client stats:', error);
      throw error;
    }
  },

  async sendMessage(subscriptionId, senderId, receiverId, content, timestamp, file) {
    try {
  
      if (!subscriptionId || !senderId || !receiverId) {
        console.error('Missing required fields in sendMessage:', {
          subscriptionId, senderId, receiverId, content, timestamp, file
        });
        throw new Error('Missing required parameters for sendMessage');
      }

      console.log('Sending message with params:', {
        subscriptionId, senderId, receiverId, content, timestamp, file
      });
      // Make API request with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await api.post(`/subscription/${subscriptionId}/send-message`, {
            senderId,
            receiverId,
            content: content || '',
            timestamp: timestamp || new Date().toISOString(),
            file: Array.isArray(file) ? file : []
          });
          
          return response.data;
        } catch (error) {
          retryCount++;
          
          // If we've reached max retries, throw the error
          if (retryCount >= maxRetries) throw error;
          
          // Otherwise wait with exponential backoff
          const delay = Math.pow(2, retryCount) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },
  
  async fetchMessages(subscriptionId, options = {}) {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        if (!subscriptionId) {
          throw new Error('Subscription ID is required');
        }

        const params = {
          limit: options.limit || 100,
          offset: options.offset || 0,
          unreadOnly: options.unreadOnly || false
        };

        const response = await api.get(`/subscription/${subscriptionId}/messages`, { params });
 

        if (Array.isArray(response.data)) {
          const readMessages = response.data.filter(msg => msg.read);   
          return response.data;
        } else if (response.data && Array.isArray(response.data.messages)) {
          return response.data.messages;
        } else {
          console.warn('Unexpected response format from messages API:', response.data);
          return [];
        }
      } catch (error) {
        retryCount++;
        
        if (retryCount < MAX_RETRIES) {
          // Add exponential backoff delay between retries
          const delay = Math.pow(2, retryCount) * 500;
          //(`Retry ${retryCount}/${MAX_RETRIES} for fetchMessages after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`Failed to fetch messages after ${MAX_RETRIES} attempts:`, error);
          throw error;
        }
      }
    }
  },

  async markMessagesAsRead(subscriptionId, messageIds, readerId) {
    try {
      if (!subscriptionId || !messageIds || !messageIds.length) {
        throw new Error('Subscription ID and message IDs are required');
      }

      // Include readerId if provided (useful for guest users)
      const requestData = { messageIds };
      if (readerId) {
        requestData.readerId = readerId;
      }
      
      // Make API request with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await api.put(`/subscription/${subscriptionId}/mark-read`, requestData);
          return response.data;
        } catch (error) {
          retryCount++;
          
          // If we've reached max retries, throw the error
          if (retryCount >= maxRetries) throw error;
          
          // Otherwise wait with exponential backoff
          const delay = Math.pow(2, retryCount) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  },

  async uploadFiles(files, onProgress) {
    try {
      if (!files || !files.length) {
        return [];
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      // Add progress tracking if callback provided
      if (typeof onProgress === 'function') {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        };
      }

      // Make API request with retry for network issues (but not for validation errors)
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await api.post('/user/upload', formData, config);
          
          if (!response.data || !Array.isArray(response.data.files)) {
            console.warn('Unexpected response format from file upload API:', response.data);
            return [];
          }
          
          return response.data.files;
        } catch (error) {
          // Only retry on network errors, not on validation errors
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            throw error; // Don't retry client errors
          }
          
          retryCount++;
          
          if (retryCount >= maxRetries) throw error;
          
          const delay = Math.pow(2, retryCount) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  async getClientGoals(subscriptionId) {
    try {
      const response = await api.get(`/subscription/${subscriptionId}/goals`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client goals:', error);
      throw error;
    }
  },
  
  // Get all pending goal approvals for a coach
  async getPendingGoalApprovals() {
    try {
      const response = await api.get('/subscription/pending-goal-approvals');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending goal approvals:', error);
      throw error;
    }
  },

  async updateClientGoal(subscriptionId, goal) {
    try {
      const response = await api.put(`/subscription/${subscriptionId}/goals/${goal.id}`, goal);
      return response.data;
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  },
  
  // Add a new goal to a subscription
  async addClientGoal(subscriptionId, goal) {
    try {
      const response = await api.post(`/subscription/${subscriptionId}/goals`, goal);
      return response.data;
    } catch (error) {
      console.error('Failed to add goal:', error);
      throw error;
    }
  },
  
  // Delete a goal from a subscription
  async deleteClientGoal(subscriptionId, goalId) {
    try {
      const response = await api.delete(`/subscription/${subscriptionId}/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  },
  
  // Request goal completion (client side)
  async requestGoalCompletion(subscriptionId, goalId) {
    try {
      const response = await api.post(`/subscription/${subscriptionId}/goals/${goalId}/request-completion`);
      
      // Return the updated goal with proper status
      return response.data;
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      throw error;
    }
  },
  
  async approveGoalCompletion(subscriptionId, goalId, pointsToAward) {
    try {
      if (!subscriptionId || !goalId) {
        throw new Error('Subscription ID and goal ID are required');
      }
      
      //(`Approving goal ${goalId} for subscription ${subscriptionId} with ${pointsToAward} points`);
      
      // Make API request with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const guestToken = localStorage.getItem('guestToken');
          const accessToken = localStorage.getItem('accessToken');
          
          const response = await api.post(
            `/subscription/${subscriptionId}/goals/${goalId}/approve`, 
            { pointsAwarded: pointsToAward || 0 },
            {
              headers: {
                'Authorization': `Bearer ${accessToken || guestToken}`
              }
            }
          );
          
          // Log success
          //('Goal approval response:', response.data);
          
          if (response.data.pointsAwardedSuccess) {
            //(`Successfully awarded ${pointsToAward} points to client`);
          } else {
            console.warn('Goal approved but points may not have been awarded');
          }
          
          return response.data;
        } catch (error) {
          retryCount++;
          console.error(`Approval attempt ${retryCount} failed:`, error);
          
          // If we've reached max retries, throw the error
          if (retryCount >= maxRetries) throw error;
          
          // Otherwise wait with exponential backoff
          const delay = Math.pow(2, retryCount) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.error('Failed to approve goal completion:', error);
      throw error;
    }
  },
  
  // Reject a goal completion request (coach side)
  async rejectGoalCompletion(subscriptionId, goalId) {
    try {
      const response = await api.post(`/subscription/${subscriptionId}/goals/${goalId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Failed to reject goal completion:', error);
      throw error;
    }
  },
  
  // Save goals generated from questionnaire data
  async saveQuestionnaireDerivedGoals(subscriptionId, goals) {
    try {
      const response = await api.post(`/subscription/${subscriptionId}/questionnaire-goals`, {
        goals
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save questionnaire-derived goals:', error);
      throw error;
    }
  },

  async getSubscriptionBySubscriptionId(clientId) {
    try {
      const response = await api.get(`/subscription/by-client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscription by client ID:', error);
      throw error;
    }
  },

  async checkIfUserRatedCoach(coachId) {
    try {
      if (!coachId) {
        throw new Error('Coach ID is required');
      }
      
      // Since the API endpoint doesn't exist yet, use localStorage as a temporary solution
      const ratedCoaches = JSON.parse(localStorage.getItem('ratedCoaches') || '[]');
      return ratedCoaches.includes(coachId);
      
      /* When the API endpoint is implemented, use this instead:
      const response = await api.get(`/user/${coachId}/user-rating`);
      return response.data.hasRated;
      */
    } catch (error) {
      console.error('Error checking if user has rated coach:', error);
      
      // Fallback to localStorage if API call fails
      const ratedCoaches = JSON.parse(localStorage.getItem('ratedCoaches') || '[]');
      return ratedCoaches.includes(coachId);
    }
  },
  
  // Rate a coach
  async rateCoach(coachId, rating) {
    try {
      if (!coachId || !rating) {
        throw new Error('Coach ID and rating are required');
      }
      
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      // Call the API endpoint to rate the coach
      const response = await api.post(`/user/${coachId}/rate`, { rating });
      
      // Store in localStorage regardless of API response
      const ratedCoaches = JSON.parse(localStorage.getItem('ratedCoaches') || '[]');
      if (!ratedCoaches.includes(coachId)) {
        ratedCoaches.push(coachId);
        localStorage.setItem('ratedCoaches', JSON.stringify(ratedCoaches));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error rating coach:', error);
      
      // Even if the API fails, store in localStorage so the button stays hidden
      const ratedCoaches = JSON.parse(localStorage.getItem('ratedCoaches') || '[]');
      if (!ratedCoaches.includes(coachId)) {
        ratedCoaches.push(coachId);
        localStorage.setItem('ratedCoaches', JSON.stringify(ratedCoaches));
      }
      
      // Rethrow the error for the caller to handle      throw error;
    }
  },

  // Sync subscription from Stripe
  async syncSubscriptionFromStripe(subscriptionId) {
    try {
      const response = await api.post(`/subscription/sync/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to sync subscription:', error);
      throw error;
    }
  },

  // Sync all subscriptions
  async syncAllSubscriptions() {
    try {
      const response = await api.post('/subscription/sync-all');
      return response.data;
    } catch (error) {
      console.error('Failed to sync all subscriptions:', error);
      throw error;
    }
  },

};


export default subscriptionService;
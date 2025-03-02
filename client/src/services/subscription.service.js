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

  async handleSubscriptionSuccess(planType, setupIntentId, paymentMethodId, email) {
    try {
      const response = await api.post('/subscription/handle-success', {
        planType,
        setupIntentId,
        paymentMethodId,
        email,
      });
      console.log('Subscription success CALLING:', response.data);
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
      console.log('Current subscription:', response.data);
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

async submitQuestionnaire(answers, accessToken = null) {
  try {
  
    const token = accessToken || localStorage.getItem('accessToken');
    
    const requestData = {
      answers,
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

  async getCoaches(accessToken = null) {
    try {
      const params = accessToken ? { accessToken } : {};
      const response = await api.get('/auth/coach', { params });
      console.log('All coaches:', response.data);
      // Filter coaches to only include those with payout setup complete
      const coaches = response.data.filter(coach => coach.payoutSetupComplete);
      return coaches ;
    } catch (error) {
      console.error('Error fetching coaches:', error);
      throw error;
    }
  },

  async assignRandomCoach() {
    try {
      // Get access token if available
      const accessToken = localStorage.getItem('accessToken');
      // Get all available coaches with payout setup complete
      const coaches = await this.getCoaches(accessToken); // Directly assign the array
      console.log('All coaches:', coaches);
  
      if (!coaches || coaches.length === 0) {
        throw new Error('No coaches available with payout setup complete');
      }
  
      // Randomly select a coach
      const randomIndex = Math.floor(Math.random() * coaches.length);
      const selectedCoach = coaches[randomIndex];
      console.log('Selected coach:', selectedCoach);
  
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
      console.log('Creating Stripe account:', formData);
  
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
  
      console.log('Sending message:', {
        subscriptionId,
        senderId,
        receiverId,
        content,
        timestamp,
        file,
      });
  
      // Send the POST request to the backend
      const response = await api.post(`/subscription/${subscriptionId}/send-message`,{
        senderId: senderId, // Ensure this is a string (e.g., user ID)
        receiverId: receiverId, // Ensure this is a string (e.g., coach ID)
        content: content, // Ensure content is a non-empty string
        timestamp: timestamp, // Ensure timestamp is a valid Date object
        file: file, // Optional file attachment (if any)
      }
       );
  
      // Return the response data
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },
  
  async fetchMessages(subscriptionId, options = {}) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      // Prepare query parameters
      const params = {
        limit: options.limit || 50,
        offset: options.offset || 0,
        unreadOnly: options.unreadOnly || false
      };

      // Fetch messages
      const response = await api.get(`/subscription/${subscriptionId}/messages`, { params });

      return response.data.messages || response.data || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  },

  async markMessagesAsRead(subscriptionId, messageIds) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }
      if (!messageIds || messageIds.length === 0) {
        throw new Error('At least one message ID is required');
      }

      const response = await api.put(`/subscription/${subscriptionId}/mark-read`, { messageIds });
      return response.data;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  },

  async uploadFiles(files) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file); // Append each file to the form data
      });

      const response = await api.post('/user/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Ensure proper content type for file uploads
        },
      });

      if (!response.data || !Array.isArray(response.data.files)) {
        throw new Error('Invalid response from the server');
      }
  
      return response.data.files; // Return the array of uploaded file metadata
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }

};


export default subscriptionService;
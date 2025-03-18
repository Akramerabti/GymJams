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
      // Validate required parameters
      if (!subscriptionId || !senderId || !receiverId) {
        throw new Error('Missing required parameters for sendMessage');
      }


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
          console.log(`Retry ${retryCount}/${MAX_RETRIES} for fetchMessages after ${delay}ms`);
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
  
  // Approve a goal completion request (coach side)
async approveGoalCompletion(subscriptionId, goalId, pointsAwarded) {
  try {
    if (!subscriptionId || !goalId) {
      throw new Error('Subscription ID and goal ID are required');
    }
    
    console.log(`Approving goal ${goalId} with ${pointsAwarded} points`);
    
    // Make API request with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await api.post(`/subscription/${subscriptionId}/goals/${goalId}/approve`, {
          pointsAwarded: pointsAwarded || 0
        });
        
        // Log success
        console.log('Goal approval response:', response.data);
        
        if (response.data.pointsAwardedSuccess) {
          console.log(`Successfully awarded ${pointsAwarded} points to client`);
        } else {
          console.warn('Goal approved but points may not have been awarded');
        }
        
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








};


export default subscriptionService;
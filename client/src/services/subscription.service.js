import api from './api';

const subscriptionService = {
  // Create payment intent for subscription
  async createPaymentIntent(planData) {
    try {
      const response = await api.post('/subscription/create-intent', {
        planType: planData.id, // Changed from subscription to planType to match backend
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
        planType, // Changed from subscription to planType
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
      // Store the access token in localStorage if verification successful
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
    // If no access token provided, try to get it from localStorage (for guest users)
    const token = accessToken || localStorage.getItem('accessToken');
    
    // Prepare request data
    const requestData = {
      answers,
      // Only include accessToken for guest users (token will be undefined for logged-in users)
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
      console.log('Coaches:', response.data);
      return { coaches: response.data };
    } catch (error) {
      console.error('Error fetching coaches:', error);
      throw error;
    }
  },

  // Random coach assignment with access token
  async assignRandomCoach() {
    try {
      // Get access token if available
      const accessToken = localStorage.getItem('accessToken');
      
      // Get all available coaches
      const { coaches } = await this.getCoaches(accessToken);

      if (!coaches || coaches.length === 0) {
        throw new Error('No coaches available');
      }

      // Randomly select a coach
      const randomIndex = Math.floor(Math.random() * coaches.length);
      const selectedCoach = coaches[randomIndex];

      console.log('Selected coach:', selectedCoach);

      if (!selectedCoach) {
        throw new Error('Failed to select a coach');
      }

      // Assign the selected coach with access token
      const response = await api.post('/subscription/assign-coach', 
        { coachId: selectedCoach._id },
        { params: accessToken ? { accessToken } : {} }
      );

      return {
        coach: selectedCoach,
        assignment: response.data
      };
    } catch (error) {
      console.error('Error assigning random coach:', error);
      throw error;
    }
  },

  // Assign specific coach with access token
  async assignCoach(coachId) {
    try {
      // Get access token if available
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await api.post('/subscription/assign-coach', 
        { coachId },
        { params: accessToken ? { accessToken } : {} }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning coach:', error);
      throw error;
    }
  }
};

export default subscriptionService;
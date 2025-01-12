import api from './api';

const subscriptionService = {
  // Helper function to get headers with the Authorization token
  getHeaders(token) {
    if (!token) {
      console.error('No token provided');
      throw new Error('Authentication required');
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  },

  // Create payment intent for subscription
  async createPaymentIntent(planData, token) {
    try {
      console.log('Creating payment intent for plan:', planData);
      const response = await api.post(
        '/subscription/create-intent',
        {
          planType: planData.id,
        },
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  },

  // Start subscription with payment method
  async startSubscription(paymentMethodId, planType, token) {
    try {
      const response = await api.post(
        '/subscription',
        {
          paymentMethodId,
          planType,
        },
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Failed to start subscription:', error);
      throw error;
    }
  },

  // Check if the user has completed the initial questionnaire
  async checkQuestionnaireStatus(userIdOrEmail, token) {
    try {
      const response = await api.get(
        '/subscription/questionnaire-status',
        {
          params: { userIdOrEmail },
          ...this.getHeaders(token), // Pass the token to getHeaders
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
      throw error;
    }
  },

  // Submit the initial questionnaire
  async submitQuestionnaire(answers, token) {
    try {
      const response = await api.post(
        '/subscription/submit-questionnaire',
        answers,
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      throw error;
    }
  },

  // Handle subscription success
  async handleSubscriptionSuccess(planType, setupIntentId, paymentMethodId, email, token) {
    try {
      console.log('Handling subscription success:', { planType, setupIntentId, paymentMethodId, email });
      const response = await api.post(
        '/subscription/handle-success',
        {
          planType,
          setupIntentId,
          paymentMethodId,
          email,
        },
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Failed to handle subscription success:', error);
      throw error;
    }
  },

  // Get current subscription details
  async getCurrentSubscription(token) {
    try {
      const response = await api.get('/subscription/current', this.getHeaders(token)); // Pass the token to getHeaders
      console.log('Current subscription:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId, token) {
    try {
      const response = await api.delete(
        `/subscription/${subscriptionId}`,
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  },

  // Finish current month (remove recurring payment)
  async finishCurrentMonth(subscriptionId, token) {
    try {
      const response = await api.post(
        `/subscription/${subscriptionId}/finish-month`,
        {},
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Failed to finish current month:', error);
      throw error;
    }
  },

  // Update subscription plan
  async updateSubscription(subscriptionId, newPlanType, token) {
    try {
      const response = await api.put(
        `/subscription/${subscriptionId}`,
        {
          newPlanType,
        },
        this.getHeaders(token) // Pass the token to getHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  },
};

export default subscriptionService;
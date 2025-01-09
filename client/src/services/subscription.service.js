// services/subscription.service.js
import api from './api';

const subscriptionService = {
  // Create payment intent for subscription
  async createPaymentIntent(planData) {
    try {
      console.log('Creating payment intent for plan:', planData);
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

  // Handle subscription success
  async handleSubscriptionSuccess(planType, paymentIntentId, email) {
    try {
      const response = await api.post('/subscription/handle-success', {
        planType,
        paymentIntentId,
        email, // Pass the email (user's email or guest email)
      });
      return response.data;
    } catch (error) {
      console.error('Failed to handle subscription success:', error);
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
};

export default subscriptionService;
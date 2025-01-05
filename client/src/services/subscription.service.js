import api from './api';

const subscriptionService = {
  async createSubscription(subscriptionData) {
    try {
      const response = await api.post('/auth/subscription', subscriptionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await api.get(`/auth/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default subscriptionService;
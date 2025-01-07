import api from './api';

const subscriptionService = {
  async createSubscription(subscriptionData) {
    try {
      // Map the planId to the correct format expected by the backend
      const planMapping = {
        basic: '65f4c5f8e4b0a1a2b3c4d5e6', // Replace with actual ObjectId for Basic plan
        premium: '65f4c5f8e4b0a1a2b3c4d5e7', // Replace with actual ObjectId for Premium plan
        elite: '65f4c5f8e4b0a1a2b3c4d5e8', // Replace with actual ObjectId for Elite plan
      };

      // Replace the planId with the corresponding ObjectId
      const updatedSubscriptionData = {
        ...subscriptionData,
        planId: planMapping[subscriptionData.planId] || subscriptionData.planId,
      };

      console.log('Sending POST request to:', '/auth/subscription'); // Log the endpoint
      console.log('Request Payload:', updatedSubscriptionData); // Log the payload

      const response = await api.post('/auth/subscription', updatedSubscriptionData);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response ? error.response.data : error.message); // Log the error
      throw error;
    }
  },

  async getSubscriptionStatus(subscriptionId) {
    try {
      console.log('Sending GET request to:', `/auth/subscription/${subscriptionId}`); // Log the endpoint
      const response = await api.get(`/auth/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error.response ? error.response.data : error.message); // Log the error
      throw error;
    }
  }
};

export default subscriptionService;
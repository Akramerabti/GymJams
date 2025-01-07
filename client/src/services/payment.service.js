// payment.service.js
import api from './api';

const paymentService = {
  async addPaymentMethod(userId, paymentMethodData) {
    try {
      // Ensure the data is properly formatted
      const formattedData = {
        ...paymentMethodData,
        cardNumber: paymentMethodData.cardNumber.replace(/\D/g, ''), // Remove non-numeric characters
      };

      // Send the request
      const response = await api.post('/payment/payment-methods', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  },

  async getPaymentMethods(userId) {
    try {
      const response = await api.get('/payment/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  async updatePaymentMethod(userId, paymentMethodId, updateData) {
    try {
      const response = await api.put(`/payment/payment-methods/${paymentMethodId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  },

  async deletePaymentMethod(userId, paymentMethodId) {
    try {
      const response = await api.delete(`/payment/payment-methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }
};

export default paymentService;
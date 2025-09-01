// client/src/services/ambassador.service.js
import api from './api';

const ambassadorService = {
  // Get all ambassadors (only those with payout setup complete)
  async getAmbassadors() {
    try {
      const response = await api.get('/ambassador/ambassadors');
      return response.data;
    } catch (error) {
      console.error('Error fetching ambassadors:', error);
      throw error;
    }
  },

  // Get all ambassador codes
  async getAllAmbassadorCodes() {
    try {
      const response = await api.get('/ambassador/codes');
      return response.data;
    } catch (error) {
      console.error('Error fetching ambassador codes:', error);
      throw error;
    }
  },

  // Create new ambassador code
  async createAmbassadorCode(codeData) {
    try {
      const response = await api.post('/ambassador/codes', codeData);
      return response.data;
    } catch (error) {
      console.error('Error creating ambassador code:', error);
      throw error;
    }
  },

  // Update ambassador code
  async updateAmbassadorCode(codeId, codeData) {
    try {
      const response = await api.put(`/ambassador/codes/${codeId}`, codeData);
      return response.data;
    } catch (error) {
      console.error('Error updating ambassador code:', error);
      throw error;
    }
  },

  // Delete ambassador code
  async deleteAmbassadorCode(codeId) {
    try {
      const response = await api.delete(`/ambassador/codes/${codeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting ambassador code:', error);
      throw error;
    }
  },

  // Toggle ambassador code status
  async toggleAmbassadorCodeStatus(codeId, isActive) {
    try {
      const response = await api.patch(`/ambassador/codes/${codeId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error toggling ambassador code status:', error);
      throw error;
    }
  },

  // Validate ambassador can receive commission (frontend helper)
  validateAmbassadorForCommission(ambassador) {
    if (!ambassador) return false;
    return ambassador.payoutSetupComplete && ambassador.stripeAccountId;
  }
};

export default ambassadorService;
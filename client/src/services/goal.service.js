import api from './api';

const goalService = {
  // Create a new goal for a client
  createGoal: async (clientId, goalData) => {
    try {
      const response = await api.post(`/client/${clientId}/goals`, goalData);
      return response.data;
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  },

  // Get all goals for a client
  getClientGoals: async (clientId) => {
    try {
      const response = await api.get(`/client/${clientId}/goals`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client goals:', error);
      throw error;
    }
  },

  // Update an existing goal
  updateGoal: async (clientId, goalId, goalData) => {
    try {
      const response = await api.put(`/client/${clientId}/goals/${goalId}`, goalData);
      return response.data;
    } catch (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  },

  // Delete a goal
  deleteGoal: async (clientId, goalId) => {
    try {
      const response = await api.delete(`/client/${clientId}/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  },

  // Client requests goal completion
  requestGoalCompletion: async (clientId, goalId, proofData = {}) => {
    try {
      const response = await api.post(`/client/${clientId}/goals/${goalId}/request-completion`, proofData);
      return response.data;
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      throw error;
    }
  },

  // Coach approves goal completion
  approveGoalCompletion: async (clientId, goalId) => {
    try {
      const response = await api.post(`/client/${clientId}/goals/${goalId}/approve-completion`);
      return response.data;
    } catch (error) {
      console.error('Failed to approve goal completion:', error);
      throw error;
    }
  },
  
  // Coach rejects goal completion
  rejectGoalCompletion: async (clientId, goalId, reason) => {
    try {
      const response = await api.post(`/client/${clientId}/goals/${goalId}/reject-completion`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to reject goal completion:', error);
      throw error;
    }
  },

  // Generate goals based on questionnaire data
  generateGoalsFromQuestionnaire: async (clientId, questionnaireData) => {
    try {
      const response = await api.post(`/client/${clientId}/generate-goals`, { questionnaireData });
      return response.data;
    } catch (error) {
      console.error('Failed to generate goals from questionnaire:', error);
      throw error;
    }
  }
};

export default goalService;
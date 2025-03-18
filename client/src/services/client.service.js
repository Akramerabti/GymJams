// client/src/services/client.service.js
import api from './api';

const clientService = {
  // Get all clients for a coach
  async getCoachClients() {
    try {
      const response = await api.get('/client/coach-clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching coach clients:', error);
      throw error;
    }
  },

  // Get a single client by ID
  async getClientById(clientId) {
    try {
      const response = await api.get(`/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      throw error;
    }
  },

  async awardClientPoints (clientId, points) {
    try {
      const response = await api.post(`/client/${clientId}/award-points`, { points });
      return response.data;
    } catch (error) {
      console.error('Failed to award points:', error);
      throw error;
    }
  },

  // Update client stats
  async updateClientStats(clientId, statsData) {
    try {
      const response = await api.put(`/client/${clientId}/stats`, statsData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} stats:`, error);
      throw error;
    }
  },

  // Update client progress
  async updateClientProgress(clientId, progressData) {
    try {
      const response = await api.put(`/client/${clientId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} progress:`, error);
      throw error;
    }
  },

  // Update client workouts
  async updateClientWorkouts(clientId, workouts) {
    try {
      const response = await api.put(`/client/${clientId}/workouts`, workouts);
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} workouts:`, error);
      throw error;
    }
  },

  // Update client notes
  async updateClientNotes(clientId, notes) {
    try {
      const response = await api.put(`/client/${clientId}/notes`, { notes });
      return response.data;
    } catch (error) {
      console.error(`Error updating client ${clientId} notes:`, error);
      throw error;
    }
  },

  // Export client data
  async exportClientData(clientId) {
    try {
      const response = await api.get(`/client/${clientId}/export`);
      return response.data;
    } catch (error) {
      console.error(`Error exporting client ${clientId} data:`, error);
      throw error;
    }
  },

  // Get pending coach requests
  async getPendingRequests() {
    try {
      const response = await api.get('/client/pending-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  },

  // Accept coaching request
  async acceptCoachingRequest(requestId) {
    try {
      const response = await api.post(`/client/accept-request/${requestId}`);
      return response.data;
    } catch (error) {
      console.error(`Error accepting request ${requestId}:`, error);
      throw error;
    }
  },

  // Decline coaching request
  async declineCoachingRequest(requestId, reason = '') {
    try {
      const response = await api.post(`/client/decline-request/${requestId}`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error declining request ${requestId}:`, error);
      throw error;
    }
  },

  // Session management
  // Get coach sessions
  async getCoachSessions() {
    try {
      const response = await api.get('/client/sessions');
      return response.data;
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
      throw error;
    }
  },

  // Create new session
  async createSession(sessionData) {
    try {
      const response = await api.post('/client/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Update session
  async updateSession(sessionId, sessionData) {
    try {
      const response = await api.put(`/client/sessions/${sessionId}`, sessionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating session ${sessionId}:`, error);
      throw error;
    }
  },

  // Delete session
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`/client/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  },

  // Premium and Elite client features
  // Update nutrition data
  async updateNutritionData(clientId, nutritionData) {
    try {
      const response = await api.put(`/client/${clientId}/nutrition`, nutritionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating nutrition data for client ${clientId}:`, error);
      throw error;
    }
  },

  // Update advanced goals
  async updateAdvancedGoals(clientId, goals) {
    try {
      const response = await api.put(`/client/${clientId}/goals`, goals);
      return response.data;
    } catch (error) {
      console.error(`Error updating goals for client ${clientId}:`, error);
      throw error;
    }
  },

  // Elite-only: Update recovery metrics
  async updateRecoveryMetrics(clientId, recoveryData) {
    try {
      const response = await api.put(`/client/${clientId}/recovery`, recoveryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating recovery metrics for client ${clientId}:`, error);
      throw error;
    }
  },

  // Elite-only: Add physique assessment
  async addPhysiqueAssessment(clientId, assessmentData) {
    try {
      const response = await api.post(`/client/${clientId}/physique-assessment`, assessmentData);
      return response.data;
    } catch (error) {
      console.error(`Error adding physique assessment for client ${clientId}:`, error);
      throw error;
    }
  }
};

export default clientService;
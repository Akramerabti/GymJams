// client/src/services/client.service.js
import api from './api';

const clientService = {
  // Get all clients for a coach
  async getCoachClients() {
    try {
      const response = await api.get('/client/coach-clients');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch coach clients:', error);
      throw error;
    }
  },

  // Get a specific client by ID
  async getClientById(clientId) {
    try {
      const response = await api.get(`/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client details:', error);
      throw error;
    }
  },

  // Update client progress data
  async updateClientProgress(clientId, progressData) {
    try {
      const response = await api.put(`/client/${clientId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Failed to update client progress:', error);
      throw error;
    }
  },

  // Update client workout plan
  async updateClientWorkouts(clientId, workoutData) {
    try {
      const response = await api.put(`/client/${clientId}/workouts`, workoutData);
      return response.data;
    } catch (error) {
      console.error('Failed to update client workouts:', error);
      throw error;
    }
  },

  // Create/update client notes
  async updateClientNotes(clientId, notes) {
    try {
      const response = await api.put(`/client/${clientId}/notes`, { notes });
      return response.data;
    } catch (error) {
      console.error('Failed to update client notes:', error);
      throw error;
    }
  },

  // Update client stats (workouts completed, streak, etc.)
  async updateClientStats(clientId, statsData) {
    try {
      const response = await api.put(`/client/${clientId}/stats`, statsData);
      return response.data;
    } catch (error) {
      console.error('Failed to update client stats:', error);
      throw error;
    }
  },

  // Export client data
  async exportClientData(clientId) {
    try {
      const response = await api.get(`/client/${clientId}/export`);
      return response.data;
    } catch (error) {
      console.error('Failed to export client data:', error);
      throw error;
    }
  },
  
  // Get client session schedule
  async getClientSchedule(clientId, startDate, endDate) {
    try {
      const response = await api.get(`/client/${clientId}/schedule`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client schedule:', error);
      throw error;
    }
  },
  
  // Schedule a new session with client
  async scheduleSession(clientId, sessionData) {
    try {
      const response = await api.post(`/client/${clientId}/schedule`, sessionData);
      return response.data;
    } catch (error) {
      console.error('Failed to schedule session:', error);
      throw error;
    }
  },
  
  // Get all pending coaching requests
  async getPendingRequests() {
    try {
      const response = await api.get('/client/pending-requests');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      throw error;
    }
  },
  
  // Accept a coaching request
  async acceptCoachingRequest(requestId) {
    try {
      const response = await api.post(`/client/accept-request/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to accept coaching request:', error);
      throw error;
    }
  },
  
  // Decline a coaching request
  async declineCoachingRequest(requestId, reason = '') {
    try {
      const response = await api.post(`/client/decline-request/${requestId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to decline coaching request:', error);
      throw error;
    }
  }
};

export default clientService;
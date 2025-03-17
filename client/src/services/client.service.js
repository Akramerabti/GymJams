import api from './api';

// Client service for coach-client interactions
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
  
  // Get a specific client by ID
  async getClientById(clientId) {
    try {
      const response = await api.get(`/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  },
  
  // Update client stats
  async updateClientStats(clientId, statsData) {
    try {
      const response = await api.put(`/client/${clientId}/stats`, statsData);
      return response.data;
    } catch (error) {
      console.error('Error updating client stats:', error);
      throw error;
    }
  },
  
  // Update client workouts
  async updateClientWorkouts(clientId, workoutsData) {
    try {
      const response = await api.put(`/client/${clientId}/workouts`, workoutsData);
      return response.data;
    } catch (error) {
      console.error('Error updating client workouts:', error);
      throw error;
    }
  },
  
  // Update client progress
  async updateClientProgress(clientId, progressData) {
    try {
      const response = await api.put(`/client/${clientId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating client progress:', error);
      throw error;
    }
  },
  
  // Update client notes
  async updateClientNotes(clientId, notes) {
    try {
      const response = await api.put(`/client/${clientId}/notes`, { notes });
      return response.data;
    } catch (error) {
      console.error('Error updating client notes:', error);
      throw error;
    }
  },
  
  // Export client data
  async exportClientData(clientId) {
    try {
      const response = await api.get(`/client/${clientId}/export`);
      return response.data;
    } catch (error) {
      console.error('Error exporting client data:', error);
      throw error;
    }
  },
  
  // Get pending coaching requests
  async getPendingRequests() {
    try {
      const response = await api.get('/client/pending-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  },
  
  // Accept a coaching request
  async acceptCoachingRequest(requestId) {
    try {
      const response = await api.post(`/client/accept-request/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error accepting coaching request:', error);
      throw error;
    }
  },
  
  // Decline a coaching request
  async declineCoachingRequest(requestId, reason = '') {
    try {
      const response = await api.post(`/client/decline-request/${requestId}`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error declining coaching request:', error);
      throw error;
    }
  },
  
  // Session management
  
  // Get all sessions for a coach
  async getCoachSessions() {
    try {
      const response = await api.get('/client/sessions');
      return response;
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
      throw error;
    }
  },
  
  // Create a new session
  async createSession(sessionData) {
    try {
      const response = await api.post('/client/sessions', sessionData);
      return response;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },
  
  // Update a session
  async updateSession(sessionId, sessionData) {
    try {
      const response = await api.put(`/client/sessions/${sessionId}`, sessionData);
      return response;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },
  
  // Delete a session
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`/client/sessions/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
};

export default clientService;
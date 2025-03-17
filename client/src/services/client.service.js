// services/client.service.js
import api from './api';

const clientService = {
  // Get all clients for a coach
  async getClients() {
    try {
      const response = await api.get('/user/dashboard/coach');
      return response.data.recentClients || [];
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw error;
    }
  },

  // Get specific client details
  async getClientById(clientId) {
    try {
      const response = await api.get(`/user/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch client ${clientId}:`, error);
      throw error;
    }
  },

  // Update client stats (workouts, progress, etc.)
  async updateClientStats(clientId, statsData) {
    try {
      const response = await api.put(`/user/${clientId}/stats`, statsData);
      return response.data;
    } catch (error) {
      console.error('Failed to update client stats:', error);
      throw error;
    }
  },

  // Get client workout plans
  async getClientWorkouts(clientId) {
    try {
      const response = await api.get(`/user/${clientId}/workouts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client workouts:', error);
      throw error;
    }
  },

  // Save client workout plan
  async saveClientWorkouts(clientId, workoutsData) {
    try {
      const response = await api.put(`/user/${clientId}/workouts`, workoutsData);
      return response.data;
    } catch (error) {
      console.error('Failed to save client workouts:', error);
      throw error;
    }
  },

  // Get client progress data
  async getClientProgress(clientId) {
    try {
      const response = await api.get(`/user/${clientId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch client progress:', error);
      throw error;
    }
  },

  // Save client progress data
  async saveClientProgress(clientId, progressData) {
    try {
      const response = await api.put(`/user/${clientId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Failed to save client progress:', error);
      throw error;
    }
  },

  // Get upcoming sessions for coach
  async getUpcomingSessions() {
    try {
      const response = await api.get('/user/coach/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch upcoming sessions:', error);
      throw error;
    }
  },

  // Schedule a new session with client
  async scheduleSession(clientId, sessionData) {
    try {
      const response = await api.post(`/user/${clientId}/sessions`, sessionData);
      return response.data;
    } catch (error) {
      console.error('Failed to schedule session:', error);
      throw error;
    }
  },

  // Export client data as JSON
  async exportClientData(clientId) {
    try {
      const response = await api.get(`/user/${clientId}/export`);
      return response.data;
    } catch (error) {
      console.error('Failed to export client data:', error);
      throw error;
    }
  },

  // Handle client request (accept/decline)
  async handleClientRequest(requestId, action) {
    try {
      const response = await api.post(`/user/request/${requestId}`, { action });
      return response.data;
    } catch (error) {
      console.error('Failed to handle client request:', error);
      throw error;
    }
  },

  // Add a new client (manual addition by coach)
  async addClient(clientData) {
    try {
      const response = await api.post('/user/coach/clients', clientData);
      return response.data;
    } catch (error) {
      console.error('Failed to add client:', error);
      throw error;
    }
  }
};

export default clientService;
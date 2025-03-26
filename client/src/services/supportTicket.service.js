// client/src/services/supportTicket.service.js
import api from './api';

const supportTicketService = {
  // Get support tickets with filters
  async getSupportTickets(options = {}) {
    try {
      const { search, status, priority, page = 1, limit = 10 } = options;
      
      // Build query parameters
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      
      const response = await api.get('/support-tickets', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      throw error;
    }
  },

  // Get support ticket by ID
  async getSupportTicketById(id) {
    try {
      const response = await api.get(`/support-tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch support ticket ${id}:`, error);
      throw error;
    }
  },

  // Update support ticket
  async updateSupportTicket(id, updateData) {
    try {
      const response = await api.put(`/support-tickets/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update support ticket ${id}:`, error);
      throw error;
    }
  },

  // Add response to ticket
  async addResponseToTicket(id, responseData) {
    try {
      const response = await api.post(`/support-tickets/${id}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error(`Failed to add response to ticket ${id}:`, error);
      throw error;
    }
  },

  // Get support ticket statistics
  async getSupportTicketStats() {
    try {
      const response = await api.get('/support-tickets/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch support ticket statistics:', error);
      throw error;
    }
  }
};

export default supportTicketService;
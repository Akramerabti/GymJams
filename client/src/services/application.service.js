// client/src/services/application.service.js
import api from './api';

const applicationService = {
  // Submit a new application
  async submitApplication(formData) {
    try {
      const response = await api.post('/applications/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Application submission error:', error);
      throw error;
    }
  },

  // Get all applications (admin/taskforce only)
  async getApplications(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      
      const response = await api.get(`/applications?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  // Get application by ID
  async getApplicationById(id) {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  // Update application status
  async updateApplicationStatus(id, status, feedback) {
    try {
      const response = await api.put(`/applications/${id}/status`, {
        status,
        feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  // Delete application (admin only)
  async deleteApplication(id) {
    try {
      const response = await api.delete(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  }
};

export default applicationService;
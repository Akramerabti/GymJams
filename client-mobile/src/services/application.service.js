import api from './api';

const applicationService = {

  async submitApplication(formData) {
    try {
      const response = await api.post('/applications/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('[ApplicationService] Application submission error:', error);
      console.error('[ApplicationService] Error response:', error.response?.data);
      throw error;
    }
  },

  // Get all applications (admin/taskforce only)
  async getApplications(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.excludeType) params.append('excludeType', filters.excludeType);
      
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
  
  // Upload signed document
  async uploadSignedDocument(id, formData) {
    try {
      const response = await api.post(`/applications/${id}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading signed document:', error);
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
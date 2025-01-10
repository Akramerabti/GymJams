import api from './api';

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData) {
    try {
      console.log('Auth service sending registration request with:', userData);
      const response = await api.post('/auth/register', userData);
      console.log('Auth service received response:', response);
      
      // Check if we have the expected data structure
      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      return {
        success: true,
        data: response.data,
        requiresVerification: true
      };
    } catch (error) {
      console.error('Auth service registration error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error
      });
      throw error;
    }
  },

  async logout() {
    try {
      const response = await api.post('/auth/logout');
      
      // Clear any auth headers
      delete api.defaults.headers.common['Authorization'];
      
      // Clear local storage
      localStorage.removeItem('token');
      
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async validatePhone(phone) {
    try {
      const response = await api.post('/auth/validate-phone', phone );
      return response.data;
    } catch (error) {
      console.error('Phone validation error:', error);
      throw error;
    }
  },

  async validateToken(token) {
    const response = await api.get('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  async resetPassword(email) {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },

  async changePassword(oldPassword, newPassword) {
    const response = await api.post('/auth/change-password', { 
      oldPassword, 
      newPassword 
    });
    return response.data;
  }
};

export default authService;
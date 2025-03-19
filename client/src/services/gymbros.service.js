
import api from './api';

const gymbrosService = {
  async checkPhoneExists(phone) {
    try {
      const response = await api.post('/gym-bros/check-phone', { phone });
      return response.data.exists;
    } catch (error) {
      console.error('Error checking phone number existence:', error);
      throw error;
    }
  },

  async sendVerificationCode(phone) {
    try {
      const response = await api.post('/gym-bros/send-verification', { phone });
      return response.data;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  },


  async verifyCode(phone, code) {
    try {
      const response = await api.post('/gym-bros/verify-code', { phone, code });
      return response.data;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  },

  async loginWithPhone(phone, verificationToken) {
    try {
      const response = await api.post('/auth/phone-login', { 
        phone, 
        verificationToken 
      });
      return response.data;
    } catch (error) {
      console.error('Error logging in with phone:', error);
      throw error;
    }
  }
};

export default gymbrosService;
// client/src/services/emailMarketing.service.js
import api from './api';

const emailMarketingService = {
  // Send email campaign
  async sendCampaign(campaignData) {
    const response = await api.post('/email-marketing/send', campaignData);
    return response.data;
  },

  // Get all campaigns
  async getCampaigns() {
    const response = await api.get('/email-marketing/campaigns');
    return response.data;
  },

  // Get campaign details
  async getCampaignDetails(campaignId) {
    const response = await api.get(`/email-marketing/campaigns/${campaignId}`);
    return response.data;
  },

  // Get recipient count preview
  async getRecipientCount(filters) {
    const response = await api.post('/email-marketing/recipients/count', { filters });
    return response.data;
  },

  // Save email template
  async saveTemplate(template) {
    const response = await api.post('/email-marketing/templates', template);
    return response.data;
  },

  // Get saved templates
  async getTemplates() {
    const response = await api.get('/email-marketing/templates');
    return response.data;
  }
};

export default emailMarketingService;
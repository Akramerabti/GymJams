// server/src/controllers/emailMarketing.controller.js
import emailMarketingService from '../services/emailMarketing.js';
import EmailCampaign from '../models/EmailCampaign.js';
import logger from '../utils/logger.js';

// Send email campaign
export const sendCampaign = async (req, res) => {
  try {
    const { subject, htmlContent, filters, testMode, testEmail, name } = req.body;
    
    // Validate required fields
    if (!subject || !htmlContent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and content are required' 
      });
    }
    
    // Send campaign
    const result = await emailMarketingService.sendCampaign({
      name,
      subject,
      htmlContent,
      filters,
      testMode,
      testEmail,
      sentBy: req.user.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error sending campaign:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send campaign' 
    });
  }
};

// Get all campaigns
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({ sentBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('name subject status sentAt recipientCount sentCount opens clicks createdAt');
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch campaigns' 
    });
  }
};

// Get campaign details
export const getCampaignDetails = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const stats = await emailMarketingService.getCampaignStats(campaignId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching campaign details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch campaign details' 
    });
  }
};

// Get recipient count preview
export const getRecipientCount = async (req, res) => {
  try {
    const { filters } = req.body;
    const users = await emailMarketingService.getTargetUsers(filters);
    
    res.json({
      success: true,
      count: users.length
    });
  } catch (error) {
    logger.error('Error getting recipient count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get recipient count' 
    });
  }
};

// Track email open
export const trackEmailOpen = async (req, res) => {
  try {
    const { campaignId, userId } = req.params;
    await emailMarketingService.trackEmailOpen(campaignId, userId);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(pixel);
  } catch (error) {
    logger.error('Error tracking email open:', error);
    res.status(204).end();
  }
};

// Handle unsubscribe
export const handleUnsubscribe = async (req, res) => {
  try {
    const { email, token } = req.query;
    
    if (!email || !token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and token are required' 
      });
    }
    
    await emailMarketingService.handleUnsubscribe(email, token);
    
    res.json({
      success: true,
      message: 'You have been unsubscribed successfully'
    });
  } catch (error) {
    logger.error('Error handling unsubscribe:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid or expired unsubscribe link' 
    });
  }
};


// server/src/services/emailMarketing.service.js
import { Resend } from 'resend';
import User from '../models/User.js';
import EmailCampaign from '../models/EmailCampaign.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailMarketingService {
  // Get users based on filters
async getTargetUsers(filters = {}) {
  const query = { isEmailVerified: true };
  
  // Apply filters
  if (filters.role && filters.role !== 'all') {
    query.role = filters.role;
  }
  
  if (filters.hasSubscription !== undefined) {
    query.subscription = filters.hasSubscription ? { $ne: null } : null;
  }
  
  if (filters.lastActiveWithin) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.lastActiveWithin);
    query.lastLogin = { $gte: daysAgo };
  }
  
  // Base requirement: user must have email notifications enabled
  query['notificationPreferences.emailNotifications'] = true;
  
  // Only apply marketing preference filter if explicitly requested
  if (filters.acceptsMarketing === true) {
    query['notificationPreferences.shop.salesAndPromotions'] = true;
  }
  
  // Optional: Add campaign type handling for more granular control
  if (filters.campaignType) {
    switch (filters.campaignType) {
      case 'promotional':
        query['notificationPreferences.shop.salesAndPromotions'] = true;
        break;
      case 'coaching':
        query['notificationPreferences.coaching.coachApplications'] = true;
        break;
      case 'games':
        query['notificationPreferences.games.newGames'] = true;
        break;
      // For transactional/system emails, just require general email notifications
      case 'transactional':
      case 'system':
      default:
        // Already covered by base requirement
        break;
    }
  }
  
  const users = await User.find(query)
    .select('email firstName lastName notificationPreferences role lastLogin');
  
  return users;
}

  // Send campaign to users
async sendCampaign(campaignData) {
  try {
    const { 
      subject, 
      htmlContent, 
      filters = {}, 
      testMode = false,
      testEmail = null 
    } = campaignData;
    
    // Get target users or send test
    let recipients = [];
    if (testMode && testEmail) {
      // Check if user exists in database
      const existingUser = await User.findOne({ email: testEmail })
        .select('email firstName lastName');
      
      if (existingUser) {
        recipients = [{
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName
        }];
      } else {
        // User doesn't exist, use default test values
        recipients = [{
          email: testEmail,
          firstName: 'Test',
          lastName: 'User'
        }];
      }
    } else {
      recipients = await this.getTargetUsers(filters);
    }
    
    if (recipients.length === 0) {
      return {
        success: false,
        message: 'No recipients found matching the criteria'
      };
    }
    
    // Create campaign record
    const campaign = await EmailCampaign.create({
      name: campaignData.name || `Campaign ${new Date().toISOString()}`,
      subject,
      htmlContent,
      filters,
      recipientCount: recipients.length,
      status: 'sending',
      sentBy: campaignData.sentBy
    });
    
    // Send emails in batches
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(async (user) => {
        try {
          // Personalize content
          let personalizedHtml = htmlContent
            .replace(/{{firstName}}/g, user.firstName || 'Friend')
            .replace(/{{email}}/g, user.email);
          
          // Add tracking pixel (skip for test mode to avoid confusion)
          if (!testMode) {
            const trackingPixel = `<img src="${process.env.SERVER_URL}/api/email/track/${campaign._id}/${user._id}" width="1" height="1" style="display:none;" />`;
            personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`);
          }
          
          // Add unsubscribe footer (skip for test mode)
          if (!testMode) {
            const unsubscribeLink = `${process.env.CLIENT_URL}/unsubscribe?email=${user.email}&token=${this.generateUnsubscribeToken(user.email)}`;
            const footer = `
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                <p>© ${new Date().getFullYear()} GymTonic. All rights reserved.</p>
                <p>
                  <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | 
                  <a href="${process.env.CLIENT_URL}/preferences" style="color: #6b7280; text-decoration: underline;">Update preferences</a>
                </p>
              </div>
            `;
            personalizedHtml = personalizedHtml.replace('</body>', `${footer}</body>`);
          }
          
          const emailData = {
            from: 'GymTonic <info@gymtonic.ca>',
            to: user.email,
            subject: subject.replace(/{{firstName}}/g, user.firstName || 'Friend'),
            html: personalizedHtml
          };
          
          // Add unsubscribe headers only for non-test emails
          if (!testMode) {
            const unsubscribeLink = `${process.env.CLIENT_URL}/unsubscribe?email=${user.email}&token=${this.generateUnsubscribeToken(user.email)}`;
            emailData.headers = {
              'List-Unsubscribe': `<${unsubscribeLink}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            };
          }
          
          await resend.emails.send(emailData);
          
          sentCount++;
          return { success: true, email: user.email };
        } catch (error) {
          failedCount++;
          logger.error(`Failed to send to ${user.email}:`, error);
          return { success: false, email: user.email, error: error.message };
        }
      });
      
      await Promise.all(promises);
      
      // Update campaign progress
      await EmailCampaign.findByIdAndUpdate(campaign._id, {
        sentCount,
        failedCount
      });
      
      // Rate limiting between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Update final campaign status
    await EmailCampaign.findByIdAndUpdate(campaign._id, {
      status: 'sent',
      sentAt: new Date(),
      sentCount,
      failedCount
    });
    
    return {
      success: true,
      campaignId: campaign._id,
      stats: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount
      }
    };
    
  } catch (error) {
    logger.error('Error sending campaign:', error);
    throw error;
  }
}
  
  // Get campaign statistics
  async getCampaignStats(campaignId) {
    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    const openRate = campaign.sentCount > 0 
      ? ((campaign.uniqueOpens / campaign.sentCount) * 100).toFixed(1)
      : 0;
      
    const clickRate = campaign.uniqueOpens > 0
      ? ((campaign.uniqueClicks / campaign.uniqueOpens) * 100).toFixed(1)
      : 0;
    
    return {
      name: campaign.name,
      subject: campaign.subject,
      sentAt: campaign.sentAt,
      recipients: campaign.recipientCount,
      sent: campaign.sentCount,
      failed: campaign.failedCount,
      opens: campaign.opens,
      uniqueOpens: campaign.uniqueOpens,
      clicks: campaign.clicks,
      uniqueClicks: campaign.uniqueClicks,
      openRate: `${openRate}%`,
      clickRate: `${clickRate}%`
    };
  }
  
  // Track email open
  async trackEmailOpen(campaignId, userId) {
    try {
      await EmailCampaign.findByIdAndUpdate(campaignId, {
        $inc: { opens: 1 },
        $addToSet: { openedBy: userId }
      });
      
      // Update unique opens count
      const campaign = await EmailCampaign.findById(campaignId);
      await EmailCampaign.findByIdAndUpdate(campaignId, {
        uniqueOpens: campaign.openedBy.length
      });
      
    } catch (error) {
      logger.error('Error tracking email open:', error);
    }
  }
  
  // Track email click
  async trackEmailClick(campaignId, userId, url) {
    try {
      await EmailCampaign.findByIdAndUpdate(campaignId, {
        $inc: { clicks: 1 },
        $addToSet: { clickedBy: userId },
        $push: { clickedUrls: { userId, url, clickedAt: new Date() } }
      });
      
      // Update unique clicks count
      const campaign = await EmailCampaign.findById(campaignId);
      await EmailCampaign.findByIdAndUpdate(campaignId, {
        uniqueClicks: campaign.clickedBy.length
      });
      
    } catch (error) {
      logger.error('Error tracking email click:', error);
    }
  }
  
  generateUnsubscribeToken(email) {
    return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30d' });
  }
  
  // Handle unsubscribe
  async handleUnsubscribe(email, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.email !== email) {
        throw new Error('Invalid unsubscribe token');
      }

      await User.findOneAndUpdate(
        { email },
        {
          'notificationPreferences.emailNotifications': false,
          'notificationPreferences.shop.salesAndPromotions': false
        }
      );
      
      return { success: true };
    } catch (error) {
      logger.error('Error handling unsubscribe:', error);
      throw error;
    }
  }
}

export default new EmailMarketingService();
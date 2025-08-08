// server/src/services/taskforceNotification.service.js
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

/**
 * Service to handle notifications for taskforce members
 */
class TaskforceNotificationService {
  
  /**
   * Get all taskforce users
   */
  async getTaskforceUsers() {
    try {
      const taskforceUsers = await User.find({ 
        role: 'taskforce',
        isEmailVerified: true // Only send to verified emails
      }).select('email firstName lastName');
      
      logger.info(`[TASKFORCE_NOTIFICATION] Found ${taskforceUsers.length} taskforce users`);
      return taskforceUsers;
    } catch (error) {
      logger.error('[TASKFORCE_NOTIFICATION] Error fetching taskforce users:', error);
      return [];
    }
  }

  /**
   * Notify taskforce about new application
   */
  async notifyNewApplication(application) {
    try {
      const taskforceUsers = await this.getTaskforceUsers();
      
      if (taskforceUsers.length === 0) {
        logger.warn('[TASKFORCE_NOTIFICATION] No taskforce users to notify about new application');
        return { success: true, notified: 0, message: 'No taskforce users found' };
      }

      const subject = `New ${this.capitalizeFirstLetter(application.applicationType)} Application Received - ${application.name}`;
      
      const message = `Hello Team,

A new application has been submitted and requires review.

APPLICATION DETAILS:
• Name: ${application.name}
• Email: ${application.email}
• Phone: ${application.phone || 'Not provided'}
• Type: ${this.capitalizeFirstLetter(application.applicationType)}
• Applied: ${new Date(application.createdAt).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

MESSAGE FROM APPLICANT:
${application.message}

${application.portfolioUrl ? `Portfolio/Website: ${application.portfolioUrl}` : ''}
${application.resume ? `Resume: Attached to application` : ''}

ACTION REQUIRED:
Please log into the admin panel to review this application and take appropriate action.

Application ID: ${application._id}

Best regards,
GymTonic System`;

      let successCount = 0;
      let failureCount = 0;
      const failures = [];

      // Send notifications to all taskforce users with 1s delay to avoid rate limit
      for (const user of taskforceUsers) {
        try {
          await sendEmail({
            email: user.email,
            subject: subject,
            message: message
          });
          successCount++;
          logger.info(`[TASKFORCE_NOTIFICATION] Notified ${user.email} about new application ${application._id}`);
        } catch (emailError) {
          failureCount++;
          failures.push({ email: user.email, error: emailError.message });
          logger.error(`[TASKFORCE_NOTIFICATION] Failed to notify ${user.email}:`, emailError.message);
        }
        // 1 second delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`[TASKFORCE_NOTIFICATION] New application notification complete: ${successCount} sent, ${failureCount} failed`);
      
      return {
        success: true,
        notified: successCount,
        failed: failureCount,
        failures: failures,
        message: `Notified ${successCount} taskforce members about new application`
      };
      
    } catch (error) {
      logger.error('[TASKFORCE_NOTIFICATION] Error notifying taskforce about new application:', error);
      return {
        success: false,
        error: error.message,
        notified: 0
      };
    }
  }

  /**
   * Notify taskforce about received signed document
   */
  async notifyDocumentReceived(application) {
    try {
      const taskforceUsers = await this.getTaskforceUsers();
      
      if (taskforceUsers.length === 0) {
        logger.warn('[TASKFORCE_NOTIFICATION] No taskforce users to notify about document received');
        return { success: true, notified: 0, message: 'No taskforce users found' };
      }

      const subject = `Signed Document Received - ${application.name} (${this.capitalizeFirstLetter(application.applicationType)})`;
      
      const message = `Hello Team,

A signed document has been received and is ready for final review.

APPLICATION DETAILS:
• Name: ${application.name}
• Email: ${application.email}
• Type: ${this.capitalizeFirstLetter(application.applicationType)}
• Document Received: ${new Date(application.signedDocumentReceivedAt).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
• Current Status: ${this.capitalizeFirstLetter(application.status)}

ACTION REQUIRED:
The applicant has submitted their signed document. Please log into the admin panel to:
1. Review the signed document
2. Approve or request changes
3. Update the applicant's status to "Approved" if everything is in order

Application ID: ${application._id}

Note: Once approved, the user's role will be automatically updated in the system.

Best regards,
GymTonic System`;

      let successCount = 0;
      let failureCount = 0;
      const failures = [];

      // Send notifications to all taskforce users with 1s delay to avoid rate limit
      for (const user of taskforceUsers) {
        try {
          await sendEmail({
            email: user.email,
            subject: subject,
            message: message
          });
          successCount++;
          logger.info(`[TASKFORCE_NOTIFICATION] Notified ${user.email} about document received for ${application._id}`);
        } catch (emailError) {
          failureCount++;
          failures.push({ email: user.email, error: emailError.message });
          logger.error(`[TASKFORCE_NOTIFICATION] Failed to notify ${user.email}:`, emailError.message);
        }
        // 1 second delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`[TASKFORCE_NOTIFICATION] Document received notification complete: ${successCount} sent, ${failureCount} failed`);
      
      return {
        success: true,
        notified: successCount,
        failed: failureCount,
        failures: failures,
        message: `Notified ${successCount} taskforce members about received document`
      };
      
    } catch (error) {
      logger.error('[TASKFORCE_NOTIFICATION] Error notifying taskforce about document received:', error);
      return {
        success: false,
        error: error.message,
        notified: 0
      };
    }
  }

  /**
   * Notify taskforce about application status changes (optional)
   */
  async notifyStatusChange(application, oldStatus, newStatus, changedBy = null) {
    try {
      // Only notify for significant status changes
      const significantChanges = [
        { from: 'pending', to: 'awaiting' },
        { from: 'awaiting', to: 'received' },
        { from: 'received', to: 'approved' },
        { from: 'pending', to: 'rejected' },
        { from: 'awaiting', to: 'rejected' },
        { from: 'received', to: 'rejected' }
      ];

      const isSignificant = significantChanges.some(change => 
        change.from === oldStatus && change.to === newStatus
      );

      if (!isSignificant) {
        logger.info(`[TASKFORCE_NOTIFICATION] Status change ${oldStatus} -> ${newStatus} not significant, skipping notification`);
        return { success: true, notified: 0, message: 'Status change not significant enough for notification' };
      }

      const taskforceUsers = await this.getTaskforceUsers();
      
      if (taskforceUsers.length === 0) {
        logger.warn('[TASKFORCE_NOTIFICATION] No taskforce users to notify about status change');
        return { success: true, notified: 0, message: 'No taskforce users found' };
      }

      const subject = `Application Status Update - ${application.name} (${oldStatus.toUpperCase()} → ${newStatus.toUpperCase()})`;
      
      let statusMessage = '';
      switch (newStatus) {
        case 'awaiting':
          statusMessage = 'Documents have been sent to the applicant for signing.';
          break;
        case 'received':
          statusMessage = 'Signed documents have been received and are ready for final review.';
          break;
        case 'approved':
          statusMessage = 'Application has been fully approved and user role has been updated.';
          break;
        case 'rejected':
          statusMessage = 'Application has been rejected.';
          break;
      }

      const message = `Hello Team,

An application status has been updated.

APPLICATION DETAILS:
• Name: ${application.name}
• Email: ${application.email}
• Type: ${this.capitalizeFirstLetter(application.applicationType)}
• Previous Status: ${this.capitalizeFirstLetter(oldStatus)}
• New Status: ${this.capitalizeFirstLetter(newStatus)}
• Updated: ${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
${changedBy ? `• Updated by: ${changedBy}` : ''}

STATUS UPDATE:
${statusMessage}

${application.feedback ? `FEEDBACK PROVIDED:\n${application.feedback}\n` : ''}

Application ID: ${application._id}

Best regards,
GymTonic System`;

      let successCount = 0;
      let failureCount = 0;
      const failures = [];

      // Send notifications to all taskforce users with 1s delay to avoid rate limit
      for (const user of taskforceUsers) {
        try {
          await sendEmail({
            email: user.email,
            subject: subject,
            message: message
          });
          successCount++;
          logger.info(`[TASKFORCE_NOTIFICATION] Notified ${user.email} about status change for ${application._id}`);
        } catch (emailError) {
          failureCount++;
          failures.push({ email: user.email, error: emailError.message });
          logger.error(`[TASKFORCE_NOTIFICATION] Failed to notify ${user.email}:`, emailError.message);
        }
        // 1 second delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`[TASKFORCE_NOTIFICATION] Status change notification complete: ${successCount} sent, ${failureCount} failed`);
      
      return {
        success: true,
        notified: successCount,
        failed: failureCount,
        failures: failures,
        message: `Notified ${successCount} taskforce members about status change`
      };
      
    } catch (error) {
      logger.error('[TASKFORCE_NOTIFICATION] Error notifying taskforce about status change:', error);
      return {
        success: false,
        error: error.message,
        notified: 0
      };
    }
  }

  /**
   * Send a custom notification to taskforce (for manual alerts)
   */
  async sendCustomNotification(subject, message, applicationId = null) {
    try {
      const taskforceUsers = await this.getTaskforceUsers();
      
      if (taskforceUsers.length === 0) {
        logger.warn('[TASKFORCE_NOTIFICATION] No taskforce users for custom notification');
        return { success: true, notified: 0, message: 'No taskforce users found' };
      }

      const fullMessage = `Hello Team,

${message}

${applicationId ? `Application ID: ${applicationId}` : ''}

Best regards,
GymTonic System`;

      let successCount = 0;
      let failureCount = 0;
      const failures = [];

      for (const user of taskforceUsers) {
        try {
          await sendEmail({
            email: user.email,
            subject: subject,
            message: fullMessage
          });
          successCount++;
          logger.info(`[TASKFORCE_NOTIFICATION] Sent custom notification to ${user.email}`);
        } catch (emailError) {
          failureCount++;
          failures.push({ email: user.email, error: emailError.message });
          logger.error(`[TASKFORCE_NOTIFICATION] Failed to send custom notification to ${user.email}:`, emailError.message);
        }
        // 1 second delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        notified: successCount,
        failed: failureCount,
        failures: failures,
        message: `Sent custom notification to ${successCount} taskforce members`
      };

    } catch (error) {
      logger.error('[TASKFORCE_NOTIFICATION] Error sending custom notification:', error);
      return {
        success: false,
        error: error.message,
        notified: 0
      };
    }
  }

  /**
   * Helper function to capitalize first letter
   */
  capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

const taskforceNotificationService = new TaskforceNotificationService();
export default taskforceNotificationService;
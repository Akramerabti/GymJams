// server/src/utils/email.js
import { Resend } from 'resend';
import FormData from 'form-data';
import fetch from 'node-fetch';
import logger from './logger.js';

// Initialize Resend with API key
let resend;
try {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY is not defined. Email sending will be simulated.');
  } else {
    resend = new Resend(process.env.RESEND_API_KEY);
    logger.info('Resend API initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize Resend API:', error);
}

// Send email with Mailgun
const sendEmailWithMailgun = async (options) => {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun API key or domain not configured');
    }

    const form = new FormData();
    form.append('from', `GymTonic Support <support@${process.env.MAILGUN_DOMAIN}>`);
    form.append('to', options.email);
    form.append('subject', options.subject);
    form.append('text', options.message);
    
    if (options.html) {
      form.append('html', options.html);
    } else {
      form.append('html', convertTextToHtml(options.message));
    }

    if (options.cc) {
      form.append('cc', options.cc);
    }

    if (options.bcc) {
      form.append('bcc', options.bcc);
    }

    // Handle attachments
    if (options.attachments && options.attachments.length > 0) {
      logger.info(`[MAILGUN] Adding ${options.attachments.length} attachments`);
      
      options.attachments.forEach((attachment, index) => {
        if (attachment.content && attachment.filename) {
          form.append('attachment', attachment.content, {
            filename: attachment.filename,
            contentType: attachment.contentType || 'application/octet-stream'
          });
          logger.info(`[MAILGUN] Attached file: ${attachment.filename} (${attachment.content.length} bytes)`);
        } else {
          logger.warn(`[MAILGUN] Skipping invalid attachment at index ${index}`);
        }
      });
    }

    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mailgun API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    logger.info('[MAILGUN] Email sent successfully:', result.id);

    return {
      id: result.id,
      messageId: result.id,
      success: true,
      provider: 'mailgun'
    };

  } catch (error) {
    logger.error('[MAILGUN] Error sending email:', error);
    throw error;
  }
};

// Send email function - with fallback strategy
export const sendEmail = async (options) => {
  try {
    // Strategy 1: Use Mailgun for emails with attachments (more reliable for large files)
    if (options.attachments && options.attachments.length > 0) {
      logger.info(`[EMAIL] Using Mailgun for email with ${options.attachments.length} attachments`);
      return await sendEmailWithMailgun(options);
    }

    // Strategy 2: Use Resend for simple emails (faster, better deliverability)
    if (resend && process.env.RESEND_API_KEY) {
      logger.info('[EMAIL] Using Resend for simple email');
      
      const emailPayload = {
        from: 'GymTonic Support <support@gymtonic.ca>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || convertTextToHtml(options.message),
        cc: options.cc,
        bcc: options.bcc,
      };

      const response = await resend.emails.send(emailPayload);

      return {
        id: response.id,
        messageId: response.id,
        success: true,
        provider: 'resend'
      };
    }

    // Strategy 3: Fallback to Mailgun if Resend is not available
    logger.info('[EMAIL] Resend not available, falling back to Mailgun');
    return await sendEmailWithMailgun(options);

  } catch (error) {
    logger.error(`[ERROR] sendEmail - Error sending email: ${error.message}`);
    
    // In production, try the alternative service as fallback
    if (process.env.NODE_ENV === 'production') {
      try {
        if (options.attachments && options.attachments.length > 0) {
          // If Mailgun failed for attachments, we can't really fallback to Resend
          // as Resend doesn't support attachments in the same way
          throw error;
        } else {
          // Try the other service as fallback
          logger.info('[EMAIL] Attempting fallback email service');
          if (resend && process.env.RESEND_API_KEY) {
            const emailPayload = {
              from: 'GymTonic Support <support@gymtonic.ca>',
              to: options.email,
              subject: options.subject,
              text: options.message,
              html: options.html || convertTextToHtml(options.message)
            };
            const response = await resend.emails.send(emailPayload);
            return {
              id: response.id,
              messageId: response.id,
              success: true,
              provider: 'resend-fallback'
            };
          } else {
            return await sendEmailWithMailgun(options);
          }
        }
      } catch (fallbackError) {
        logger.error('[ERROR] Fallback email service also failed:', fallbackError);
        throw error; // Throw original error
      }
    }

    // In development, return mock response
    if (process.env.NODE_ENV !== 'production') {
      return {
        messageId: `mock-error-${Date.now()}`,
        success: false,
        error: error.message,
        provider: 'mock'
      };
    }

    throw error;
  }
};

function convertTextToHtml(text) {
  if (!text) return '';
  
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return escaped.replace(/\n/g, '<br>');
}
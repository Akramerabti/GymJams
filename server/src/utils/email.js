// server/src/utils/email.js
import { Resend } from 'resend';
import { sendEmailWithBrevo } from './brevoEmail.js';
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

// Send email function - maintains the same interface as before
export const sendEmail = async (options) => {
  try {
    // Log email attempt with detailed info
    console.log(`[DEBUG] sendEmail - Attempting to send email to: ${options.email}`);
    console.log(`[DEBUG] sendEmail - Subject: ${options.subject}`);
    console.log(`[DEBUG] sendEmail - Message (first 100 chars): ${options.message?.substring(0, 100)}...`);
    
    // If there are attachments, log them
    if (options.attachments?.length > 0) {
      console.log(`[DEBUG] sendEmail - Has ${options.attachments.length} attachment(s):`);
      options.attachments.forEach((att, index) => {
        console.log(`[DEBUG] sendEmail - Attachment ${index + 1}: ${att.filename}, Size: ${att.content ? `${Math.round(att.content.length / 1024)}KB` : 'unknown'}, Type: ${att.contentType || 'unknown'}`);
        
        // Check if content is a Buffer
        if (att.content) {
          console.log(`[DEBUG] sendEmail - Content is a ${att.content.constructor.name}, Length: ${att.content.length} bytes`);
          // Check if Buffer is valid (look at first few bytes for debugging)
          if (Buffer.isBuffer(att.content) && att.content.length > 0) {
            console.log(`[DEBUG] sendEmail - First 10 bytes of content: ${att.content.slice(0, 10).toString('hex')}`);
          }
        } else {
          console.error(`[ERROR] sendEmail - Attachment content is missing for ${att.filename}`);
        }
      });
      
      // Use Brevo for emails with attachments
      console.log('[DEBUG] sendEmail - Email has attachments, using Brevo for delivery');
      return await sendEmailWithBrevo(options);
    } else {
      console.log(`[DEBUG] sendEmail - No attachments included, using Resend`);
    }
    
    // If Resend is not initialized or we're in development without API key, simulate email
    if (!resend || (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY)) {
      console.log('[DEBUG] sendEmail - Email sending is simulated (no Resend API key or in development mode)');
      
      // Return mock successful response
      return {
        id: `mock-${Date.now()}`,
        messageId: `mock-${Date.now()}@simulated.resend.dev`,
        success: true
      };
    }
    
    // For emails without attachments, continue using Resend
    // Create email payload
    const emailPayload = {
      from: 'GymTonic Support <support@gymtonic.ca>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || convertTextToHtml(options.message),
      cc: options.cc,
      bcc: options.bcc,
    };
    
    console.log(`[DEBUG] sendEmail - Calling Resend API with payload: ${JSON.stringify({
      ...emailPayload,
      text: `${emailPayload.text?.substring(0, 50)}...` || '',
      html: emailPayload.html ? '[HTML content]' : 'none'
    })}`);
   
    const response = await resend.emails.send(emailPayload);
    
    return {
      id: response.id,
      messageId: response.id,
      success: true
    };
  } catch (error) {
    console.error(`[ERROR] sendEmail - Error sending email: ${error.message}`);

    if (process.env.NODE_ENV !== 'production') {
      return {
        messageId: `error-${Date.now()}`,
        success: false,
        error: error.message
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
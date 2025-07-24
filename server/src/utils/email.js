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

    if (options.attachments?.length > 0) {
      //(`[DEBUG] sendEmail - Has ${options.attachments.length} attachment(s):`);
      options.attachments.forEach((att, index) => {
        //(`[DEBUG] sendEmail - Attachment ${index + 1}: ${att.filename}, Size: ${att.content ? `${Math.round(att.content.length / 1024)}KB` : 'unknown'}, Type: ${att.contentType || 'unknown'}`);
        
        // Check if content is a Buffer
        if (att.content) {
          //(`[DEBUG] sendEmail - Content is a ${att.content.constructor.name}, Length: ${att.content.length} bytes`);
          // Check if Buffer is valid (look at first few bytes for debugging)
          if (Buffer.isBuffer(att.content) && att.content.length > 0) {
            //(`[DEBUG] sendEmail - First 10 bytes of content: ${att.content.slice(0, 10).toString('hex')}`);
          }
        } else {
          console.error(`[ERROR] sendEmail - Attachment content is missing for ${att.filename}`);
        }
      });
   
      return await sendEmailWithBrevo(options);
    } else {
      //(`[DEBUG] sendEmail - No attachments included, using Resend`);
    }
    

    if (!resend || (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY)) {
    
      return {
        id: `mock-${Date.now()}`,
        messageId: `mock-${Date.now()}@simulated.resend.dev`,
        success: true
      };
    }
    
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
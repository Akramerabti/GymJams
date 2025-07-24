import * as SibApiV3Sdk from '@getbrevo/brevo';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

let apiClient;
if (process.env.BREVO_API_KEY) {
  apiClient = new SibApiV3Sdk.TransactionalEmailsApi();
  apiClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

export const sendEmailWithBrevo = async (options) => {
  try {

    const sender = {
      email: 'support@gymtonic.ca',
      name: 'GymTonic Support'
    };
    
    const toList = [{
      email: options.email
    }];
  
    const ccList = options.cc ? 
      (Array.isArray(options.cc) ? options.cc : [options.cc]).map(email => ({ email })) : 
      undefined;

    const bccList = options.bcc ? 
      (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map(email => ({ email })) : 
      undefined;
    
    const brevoAttachments = options.attachments?.map(attachment => {
  
      const content = Buffer.isBuffer(attachment.content) ? 
        attachment.content.toString('base64') : 
        Buffer.from(attachment.content).toString('base64');
      
      return {
        name: attachment.filename,
        content: content,
        contentType: attachment.contentType || 'application/octet-stream' 
      };
    });
    
    const htmlContent = options.html || convertTextToHtml(options.message);
    
    const sendEmailRequest = new SibApiV3Sdk.SendSmtpEmail();
    sendEmailRequest.sender = sender;
    sendEmailRequest.to = toList;
    if (ccList) sendEmailRequest.cc = ccList;
    if (bccList) sendEmailRequest.bcc = bccList;
    sendEmailRequest.subject = options.subject;
    sendEmailRequest.htmlContent = htmlContent;
    sendEmailRequest.textContent = options.message;

    if (brevoAttachments?.length > 0) {
      sendEmailRequest.attachment = brevoAttachments;
    }

    if (!apiClient) {
      throw new Error('Brevo API client is not properly initialized. Check your BREVO_API_KEY.');
    }
    
    const data = await apiClient.sendTransacEmail(sendEmailRequest);

    return {
      messageId: data.messageId,
      success: true
    };
  } catch (error) {
    console.error(`[ERROR] sendEmailWithBrevo - Error sending email: ${error.message}`);
    console.error(`[ERROR] sendEmailWithBrevo - Error stack: ${error.stack}`);
    
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

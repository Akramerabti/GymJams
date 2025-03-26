// server/src/utils/email.js
import nodemailer from 'nodemailer';
import logger from './logger.js';

// Create reusable transporter object using environment variables for configuration
const createTransporter = () => {
  // For production, use actual SMTP credentials
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } 
  
  // For development, use Ethereal email test account or console output
  else {
    // Log the email content to console in development
    logger.info('Email sending is simulated in development mode');
    
    // Nodemailer's "ethereal" test account - emails can be viewed online but aren't sent
    return new Promise((resolve, reject) => {
      nodemailer.createTestAccount()
        .then(account => {
          const transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
              user: account.user,
              pass: account.pass
            }
          });
          resolve(transporter);
        })
        .catch(error => {
          logger.error('Error creating test email account:', error);
          reject(error);
        });
    });
  }
};

// Send email function
export const sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = await createTransporter();
    
    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'GymJams Support <support@gymjams.ca>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html // Optional HTML version
    };
    
    // Add CC and attachments if provided
    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;
    if (options.attachments) mailOptions.attachments = options.attachments;
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Log success
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};
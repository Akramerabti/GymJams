import { Resend } from 'resend';
import logger from '../utils/logger.js';

if (!process.env.RESEND_API_KEY) {
  logger.error('RESEND_API_KEY is not defined');
  throw new Error('RESEND_API_KEY is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  try {
    await resend.emails.send({
      from: 'GymJams <verification@gymjams.ca>',
      to: user.email,
      subject: 'Verify your GymJams account',
      html: `
        <h1>Welcome to GymJams!</h1>
        <p>Hi ${user.firstName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
        <p>Best regards,<br>The GymJams Team</p>
      `
    });
    logger.info(`Verification email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Resend error:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: 'GymJams <noreply@gymjams.ca>',
      to: user.email,
      subject: 'Reset your GymJams password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.firstName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The GymJams Team</p>
      `
    });
    logger.info(`Password reset email sent to ${user.email}`);
    return true;
  } catch (error) {
    logger.error('Resend error:', error);
    throw error;
  }
};

export const sendSubscriptionReceipt = async (subscriptionData, email, isGuest = false) => {
  const subscriptionAccessUrl = `${process.env.CLIENT_URL}/subscription-access/${subscriptionData.accessToken}`;

  try {
    await resend.emails.send({
      from: 'GymJams <subscriptions@gymjams.ca>',
      to: email,
      subject: 'Welcome to GymJams - Your Subscription Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #2b6cb0; margin: 0;">Welcome to GymJams!</h1>
            <p style="color: #4a5568; font-size: 18px;">Thank you for subscribing to our ${subscriptionData.subscription.charAt(0).toUpperCase() + subscriptionData.subscription.slice(1)} Plan</p>
          </div>

          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
              Subscription Details
            </h2>
            <div style="margin-bottom: 20px;">
              <p style="margin: 8px 0;"><strong>Plan:</strong> ${subscriptionData.subscription.charAt(0).toUpperCase() + subscriptionData.subscription.slice(1)}</p>
              <p style="margin: 8px 0;"><strong>Monthly Fee:</strong> $${subscriptionData.price}</p>
              <p style="margin: 8px 0;"><strong>Start Date:</strong> ${new Date(subscriptionData.startDate).toLocaleDateString()}</p>
              <p style="margin: 8px 0;"><strong>Points Earned:</strong> ${subscriptionData.pointsAwarded}</p>
            </div>
          </div>

          ${isGuest ? `
          <div style="background-color: #ebf8ff; border: 2px solid #4299e1; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #2b6cb0; margin-top: 0;">How to Access Your Subscription</h2>
            <p style="margin-bottom: 15px;">Since you purchased as a guest, please save your access token:</p>
            <div style="background-color: #fff; padding: 10px; border-radius: 4px; text-align: center; margin: 15px 0; font-family: monospace; font-size: 16px;">
              ${subscriptionData.accessToken}
            </div>
            <p style="margin-top: 15px;">To access your subscription:</p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Visit <a href="${process.env.CLIENT_URL}/coaching" style="color: #4299e1;">GymJams Coaching</a></li>
              <li>Click on "Already have a subscription? Access it here"</li>
              <li>Enter your access token</li>
            </ol>
            <p style="margin-top: 15px; font-style: italic;">Save this email to keep your access token safe!</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${subscriptionAccessUrl}" 
               style="display: inline-block; background-color: #4299e1; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access Your Subscription
            </a>
          </div>

          <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <h3 style="color: #2d3748; margin-bottom: 10px;">Your Subscription Includes:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${subscriptionData.features ? subscriptionData.features.map(feature => `
                <li style="margin: 8px 0; padding-left: 20px; position: relative;">
                  <span style="color: #48bb78; position: absolute; left: 0;">✓</span>
                  ${feature}
                </li>
              `).join('') : ''}
            </ul>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; font-size: 14px; color: #718096;">
            <p style="margin: 0 0 10px 0;"><strong>Need Help?</strong></p>
            <p style="margin: 0;">Contact our support team at support@gymjams.ca</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">© 2024 GymJams. All rights reserved.</p>
          </div>
        </div>
      `
    });

    return true;
  } catch (error) {
    logger.error('Subscription receipt email error:', error);
    throw error;
  }
};
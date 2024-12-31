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
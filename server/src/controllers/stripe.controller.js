import User from '../models/User.js';
import logger from '../utils/logger.js';
import stripe from '../config/stripe.js';
import mongoose from 'mongoose';

export const createStripeAccount = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body.email || req.body;

    // Add proper logging
    console.log('Creating Stripe account:', { email, firstName, lastName });

    // Validate input data
    if (!email || !firstName || !lastName) {
      console.log('Missing required fields:', { email, firstName, lastName });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Check if user exists and has the required permissions
    if (!req.user || !req.user.id) {
      console.log('User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    console.log('Stripe account created:', account.id);

    // Update user with Stripe account ID
    await User.findByIdAndUpdate(req.user.id, {
      stripeAccountId: account.id,
    });

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        stripeAccountId: account.id,
      },
      options: {
        document: {
          require_live_capture: true,
        },
      },
    });

    console.log('Verification session created:', verificationSession.id);

    return res.json({ 
      accountId: account.id,
      verificationUrl: verificationSession.url,
      verificationSessionId: verificationSession.id,
    });
  } catch (error) {
    console.error('Error creating Stripe account:', error.message);
    return res.status(400).json({ error: error.message || 'Failed to create Stripe account' });
  }
};

export const createStripeAccountLink = async (req, res) => {
    try {
      const { accountId, refreshUrl, returnUrl } = req.body;
  
      // Create an account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
  
      res.json({ url: accountLink.url });
    } catch (error) {
      console.error('Error creating account link:', error);
      res.status(500).json({ error: 'Failed to create account link' });
    }
  };

  export const checkPayoutSetup = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Check if the user has a Stripe account ID
      if (!user.stripeAccountId) {
        return res.json({ payoutSetupComplete: false });
      }
  
      // Retrieve the Stripe account to check if payouts are enabled
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
  
      if (account.charges_enabled && account.payouts_enabled) {
        // Update the coach's payout setup status in the database
        await User.findByIdAndUpdate(req.user.id, {
          payoutSetupComplete: true,
        });
  
        console.log('Payout setup complete:', user.stripeAccountId);
        return res.json({ payoutSetupComplete: true });
      } else {
        // Log the missing requirements for debugging
        console.log('Missing requirements:', account.requirements.currently_due);
        return res.json({
          payoutSetupComplete: false,
          missingRequirements: account.requirements.currently_due,
        });
      }
    } catch (error) {
      logger.error('Error checking payout setup:', error);
      res.status(500).json({ error: 'Failed to check payout setup status' });
    }
  };

  export const createStripeDashboardLink = async (req, res) => {
    try {
      const { accountId } = req.body;
  
      // Create a login link for the Stripe Express dashboard
      const loginLink = await stripe.accounts.createLoginLink(accountId);
  
      res.json({ url: loginLink.url });
    } catch (error) {
      console.error('Error creating dashboard link:', error);
      res.status(500).json({ error: 'Failed to create dashboard link' });
    }
  };
  

  export const checkVerificationStatus = async (req, res) => {
    try {
      const { verificationSessionId } = req.body;
  
      // Retrieve the verification session
      const verificationSession = await stripe.identity.verificationSessions.retrieve(
        verificationSessionId
      );
  
      if (verificationSession.status === 'verified') {
        // Verification successful
        res.json({ verified: true });
      } else {
        // Verification failed or incomplete
        res.json({ verified: false });
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      res.status(500).json({ error: 'Failed to check verification status' });
    }
  };
  
  export default stripe;
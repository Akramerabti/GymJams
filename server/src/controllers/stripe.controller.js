import User from '../models/User.js';
import logger from '../utils/logger.js';
import stripe from '../config/stripe.js';
import mongoose from 'mongoose';

export const createStripeAccount = async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
  
      // Create a Stripe Connected Account
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        business_type: 'individual',
        individual: {
          first_name: firstName,
          last_name: lastName,
        },
        capabilities: {
          transfers: { requested: true },
        },
      });
  
      // Save the Stripe account ID to the coach's profile
      await User.findByIdAndUpdate(req.user.id, {
        stripeAccountId: account.id,
      });
  
      res.json({ accountId: account.id });
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      res.status(500).json({ error: 'Failed to create Stripe account' });
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
  
        return res.json({ payoutSetupComplete: true });
      } else {
        return res.json({ payoutSetupComplete: false });
      }
    } catch (error) {
      console.error('Error checking payout setup:', error);
      res.status(500).json({ error: 'Failed to check payout setup status' });
    }
  };

  

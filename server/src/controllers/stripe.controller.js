import User from '../models/User.js';
import logger from '../utils/logger.js';
import stripe from '../config/stripe.js';
import mongoose from 'mongoose';

export const createStripeAccount = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      refreshUrl, 
      returnUrl,  
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !dateOfBirth ||
      !address ||
      !refreshUrl ||
      !returnUrl
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const businessProfile = {
      url: 'https://gymjams.ca/',
      mcc: '5734',
      description: 'Gym-related clothes, equipment, and services',
    };

    // Create a Stripe Connected Account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        dob: {
          day: parseInt(dateOfBirth.day, 10),
          month: parseInt(dateOfBirth.month, 10),
          year: parseInt(dateOfBirth.year, 10),
        },
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: 'CA',
        },
         relationship: {
          title: 'Coach', // Add the individual's title
        },
      },
      business_profile: {
        url: businessProfile.url,
        mcc: businessProfile.mcc,
        product_description: businessProfile.description,
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

   // Save the Stripe account ID to the coach's profile
   await User.findByIdAndUpdate(req.user.id, {
    stripeAccountId: account.id,
  });

   // Initiate Identity Verification for proof of liveness
   const verificationSession = await stripe.identity.verificationSessions.create({
    type: 'document', // Use 'document' for ID + selfie verification
    metadata: {
      stripeAccountId: account.id, // Link to the Stripe account
    },
    options: {
      document: {
        require_live_capture: true, // Require a live selfie
      },
    },
  });

  res.json({ 
    accountId: account.id,
    verificationUrl: verificationSession.url, // URL for the coach to complete verification
    verificationSessionId: verificationSession.id, // ID to check verification status later
  });
} catch (error) {
  console.error('Error creating Stripe account:', error);
  res.status(500).json({ error: 'Failed to create Stripe account' });
}
};

export const initiateVerification = async (req, res) => {
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

    console.log('Account Requirements:', account.requirements);

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
        pendingVerification: account.requirements.pending_verification,
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
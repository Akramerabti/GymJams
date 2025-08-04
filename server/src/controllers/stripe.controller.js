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
      url: 'https://gymtonic.ca/',
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
    console.error('=== ERROR in createStripeAccount ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error type:', error.type);
    console.error('Full error object:', error);
    
    // Log stack trace
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Handle specific Stripe errors
    if (error.type) {
      console.error('Stripe error details:', {
        type: error.type,
        code: error.code,
        decline_code: error.decline_code,
        param: error.param,
        detail: error.detail
      });
    }

    // Handle mongoose/database errors
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      console.error('Database error details:', {
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      });
    }

    res.status(500).json({ 
      error: 'Failed to create Stripe account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      return res.json({ payoutSetupComplete: false, reason: 'No Stripe account ID' });
    }

    console.log(`=== DIAGNOSTIC: Checking payout setup for user ${req.user.id} ===`);
    console.log(`Stripe Account ID: ${user.stripeAccountId}`);

    // Retrieve the Stripe account to check if payouts are enabled
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Log EVERYTHING for debugging
    console.log('=== STRIPE ACCOUNT DETAILS ===');
    console.log('Account ID:', account.id);
    console.log('Charges enabled:', account.charges_enabled);
    console.log('Payouts enabled:', account.payouts_enabled);
    console.log('Details submitted:', account.details_submitted);
    console.log('Business type:', account.business_type);
    console.log('Country:', account.country);
    console.log('Default currency:', account.default_currency);
    console.log('Type:', account.type);
    
    // Log requirements in detail
    console.log('=== REQUIREMENTS ===');
    console.log('Currently due:', account.requirements?.currently_due);
    console.log('Eventually due:', account.requirements?.eventually_due);
    console.log('Past due:', account.requirements?.past_due);
    console.log('Pending verification:', account.requirements?.pending_verification);
    console.log('Disabled reason:', account.requirements?.disabled_reason);

    // Log capabilities
    console.log('=== CAPABILITIES ===');
    console.log('Transfers:', account.capabilities?.transfers);
    console.log('Card payments:', account.capabilities?.card_payments);
    console.log('Legacy payments:', account.capabilities?.legacy_payments);

    // Check the exact condition
    const isSetupComplete = account.charges_enabled && account.payouts_enabled;
    
    console.log('=== SETUP CHECK ===');
    console.log('charges_enabled:', account.charges_enabled);
    console.log('payouts_enabled:', account.payouts_enabled);
    console.log('Combined check (charges_enabled && payouts_enabled):', isSetupComplete);

    if (isSetupComplete) {
      console.log('✅ Setup appears complete, updating database...');
      
      // Update the coach's payout setup status in the database
      const updateResult = await User.findByIdAndUpdate(
        req.user.id, 
        { payoutSetupComplete: true },
        { new: true } // Return the updated document
      );
      
      console.log('Database update result:', updateResult.payoutSetupComplete);
      console.log('🎉 Payout setup marked as complete for user:', req.user.id);
      
      return res.json({ 
        payoutSetupComplete: true,
        debug: {
          stripeAccountId: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          updatedInDb: updateResult.payoutSetupComplete
        }
      });
    } else {
      console.log('❌ Setup not complete');
      
      // Also update the database to reflect current status
      await User.findByIdAndUpdate(req.user.id, { payoutSetupComplete: false });
      
      return res.json({
        payoutSetupComplete: false,
        debug: {
          stripeAccountId: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        },
        missingRequirements: account.requirements?.currently_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
        reason: `charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`
      });
    }
  } catch (error) {
    console.error('=== ERROR in checkPayoutSetup ===');
    console.error('Error message:', error.message);
    console.error('Error type:', error.type);
    console.error('Full error:', error);
    
    logger.error('Error checking payout setup:', error);
    res.status(500).json({ 
      error: 'Failed to check payout setup status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
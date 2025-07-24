import Stripe from 'stripe';
import logger from '../utils/logger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_SECRET_KEY is not defined in environment variables');
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  maxNetworkRetries: 3,
  timeout: 10000,
});

export const createCustomer = async ({ email, name, metadata = {} }) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });
    return customer;
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
    throw error;
  }
};

export const initStripe = async () => {
  try {
    // Test the connection with a simple operation
    await stripe.paymentMethods.list({
      limit: 1,
      type: 'card'
    });
    logger.info('Stripe connection successful');
    return true;
  } catch (error) {
    if (error.type === 'StripeAuthenticationError') {
      logger.error('Stripe authentication failed. Please check your API key.');
    } else {
      logger.error('Stripe connection error:', error);
    }
    return false;
  }
};

// Additional helper functions
export const createPaymentIntent = async ({ amount, metadata = {} }) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'cad',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    throw error;
  }
};

export const createAccountLink = async (accountId, returnUrl, refreshUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
      collect: 'currently_due'
    });
    return accountLink;
  } catch (error) {
    logger.error('Error creating account link:', error);
    throw error;
  }
};

export const retrieveConnectAccount = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    //('Stripe Account:', account);
    //('Charges Enabled:', account.charges_enabled);
    //('Payouts Enabled:', account.payouts_enabled);
    return account;
  } catch (error) {
    logger.error('Error retrieving Connect account:', error);
    throw error;
  }
};

export const createTransfer = async ({ amount, destination, metadata = {} }) => {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination,
      metadata
    });
    return transfer;
  } catch (error) {
    logger.error('Error creating transfer:', error);
    throw error;
  }
};

export default stripe; 
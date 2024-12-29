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
      currency: 'usd',
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

export const handleStripeWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    logger.error('Error handling stripe webhook:', error);
    throw error;
  }
};

const handlePaymentSuccess = async (paymentIntent) => {
  // Implement payment success logic
  logger.info(`Payment succeeded for intent: ${paymentIntent.id}`);
};

const handlePaymentFailure = async (paymentIntent) => {
  // Implement payment failure logic
  logger.error(`Payment failed for intent: ${paymentIntent.id}`);
};

export default stripe;
import Stripe from 'stripe';
import logger from '../utils/logger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_SECRET_KEY is not defined in environment variables');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-02-29', // Use the latest API version
  appInfo: {
    name: 'GymShop',
    version: '1.0.0'
  }
});

// Test the Stripe connection
const testStripeConnection = async () => {
  try {
    await stripe.paymentIntents.list({ limit: 1 });
    logger.info('Stripe connection successful');
  } catch (error) {
    logger.error('Stripe connection error:', error);
    process.exit(1);
  }
};

export const initStripe = () => {
  testStripeConnection();
};

// Stripe webhook handling
export const handleStripeWebhook = async (requestBody, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      requestBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

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

    return { success: true };
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    throw error;
  }
};

// Helper functions for Stripe operations
export const createPaymentIntent = async ({
  amount,
  currency = 'usd',
  customer = null,
  metadata = {}
}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer,
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

export const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });

    return refund;
  } catch (error) {
    logger.error('Error creating refund:', error);
    throw error;
  }
};

export default stripe;
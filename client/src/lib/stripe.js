// lib/stripe.js
import { loadStripe } from '@stripe/stripe-js';
import { handleApiError } from '../utils/helpers';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment processing helper
export const processPayment = async ({ amount, currency = 'USD', paymentMethod, orderId }) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Create payment intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        orderId,
        paymentMethod
      }),
    });

    const { clientSecret } = await response.json();

    // Confirm payment
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      paymentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error)
    };
  }
};

// Payment element configuration
export const stripeElementsConfig = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0070f3',
      colorBackground: '#ffffff',
      colorText: '#1a1a1a',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  },
  loader: 'auto',
};

// Payment method types configuration
export const paymentMethodTypes = {
  card: {
    label: 'Credit Card',
    icon: 'credit-card',
    enabled: true,
  },
  ideal: {
    label: 'iDEAL',
    icon: 'bank',
    enabled: process.env.NODE_ENV === 'production',
  },
  sepa_debit: {
    label: 'SEPA Direct Debit',
    icon: 'bank',
    enabled: process.env.NODE_ENV === 'production',
  },
};

// Stripe webhook handler helper
export const handleStripeWebhook = async (event) => {
  const { type, data } = event;

  switch (type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(data.object);
      break;
    case 'charge.refunded':
      await handleRefund(data.object);
      break;
    default:
      console.log(`Unhandled event type ${type}`);
  }
};

// Payment success handler
const handlePaymentSuccess = async (paymentIntent) => {
  // Update order status
  await fetch(`/api/orders/${paymentIntent.metadata.orderId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
    }),
  });
};

// Payment failure handler
const handlePaymentFailure = async (paymentIntent) => {
  await fetch(`/api/orders/${paymentIntent.metadata.orderId}/fail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    }),
  });
};

// Refund handler
const handleRefund = async (charge) => {
  await fetch(`/api/orders/${charge.metadata.orderId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chargeId: charge.id,
      amount: charge.amount_refunded,
    }),
  });
};
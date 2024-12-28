import api from './api';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const paymentService = {
  async createPaymentIntent(orderData) {
    const response = await api.post('/payments/create-intent', orderData);
    return response.data;
  },

  async confirmPayment(paymentIntentId, paymentMethod) {
    const stripe = await stripePromise;
    const result = await stripe.confirmCardPayment(paymentIntentId, {
      payment_method: paymentMethod
    });
    return result;
  },

  async getPaymentMethods() {
    const response = await api.get('/payments/methods');
    return response.data;
  },

  async addPaymentMethod(paymentMethodData) {
    const response = await api.post('/payments/methods', paymentMethodData);
    return response.data;
  },

  async validatePromoCode(code) {
    const response = await api.post('/payments/validate-promo', { code });
    return response.data;
  }
};

export default paymentService;
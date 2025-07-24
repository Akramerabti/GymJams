import stripe from '../config/stripe';
import Order from '../models/Order';
import logger from '../utils/logger';

class PaymentService {
  async createPaymentIntent(amount, metadata = {}) {
    try {
      return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'cad',
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    try {
      const { orderId } = paymentIntent.metadata;
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id,
        status: 'processing'
      });
    } catch (error) {
      logger.error('Error handling payment success:', error);
      throw error;
    }
  }

  async handlePaymentFailure(paymentIntent) {
    try {
      const { orderId } = paymentIntent.metadata;
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed',
        status: 'cancelled'
      });
    } catch (error) {
      logger.error('Error handling payment failure:', error);
      throw error;
    }
  }

  async processRefund(orderId, amount = null) {
    try {
      const order = await Order.findById(orderId);
      if (!order || order.paymentStatus !== 'paid') {
        throw new Error('Invalid order for refund');
      }

      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'refunded',
        'refundStatus.status': 'processed',
        'refundStatus.amount': amount || order.total,
        'refundStatus.date': new Date()
      });

      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }
}

export default new PaymentService();
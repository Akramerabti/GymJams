import Order from '../models/Order';
import ProductService from './product.service';
import { createPaymentIntent } from '../config/stripe';
import logger from '../utils/logger';

class OrderService {
  async createOrder(userId, orderData) {
    try {
      const { items, shippingAddress, billingAddress } = orderData;

      // Calculate total and validate stock
      let total = 0;
      for (const item of items) {
        const product = await ProductService.updateStock(item.id, item.quantity);
        total += product.price * item.quantity;
      }

      // Create order
      const order = await Order.create({
        user: userId,
        items: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress,
        billingAddress,
        total,
        status: 'pending'
      });

      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount: total,
        metadata: { orderId: order._id.toString() }
      });

      return {
        order,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }

  async getUserOrders(userId) {
    try {
      return await Order.find({ user: userId })
        .populate('items.product')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error fetching user orders:', error);
      throw error;
    }
  }

  async getOrder(orderId, userId) {
    try {
      const order = await Order.findOne({
        _id: orderId,
        user: userId
      }).populate('items.product');

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }
}

export default new OrderService();
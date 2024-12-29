import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createPaymentIntent } from '../config/stripe.js';
import logger from '../utils/logger.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress } = req.body;
    const userId = req.user.id;

    // Validate stock and calculate total
    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.id} not found` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}` 
        });
      }
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

    res.status(201).json({
      order,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
};
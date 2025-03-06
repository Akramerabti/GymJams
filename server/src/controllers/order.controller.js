import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import stripe from '../config/stripe.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Get all orders for the current user
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId }).populate('items.product');
    res.status(200).json({ orders });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// Get a specific order by ID
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user: userId }).populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ order });
  } catch (error) {
    logger.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Extract order data from request body
    const { items, shippingAddress, billingAddress, shippingMethod = 'standard', userId } = req.body;

    const isGuest = !userId;
    
    if (!items || !items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No items provided' });
    }

    if (!shippingAddress) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // For guest orders, ensure email is provided
    if (isGuest && !shippingAddress.email) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Email is required for guest orders' });
    }

    // 1. Validate items and check stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      console.log('item:', item);
      // Make sure all properties exist
      if (!item.id) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Product ID is required for all items' });
      }

      const product = await Product.findById(item.id).session(session);
      
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product not found: ${item.id}` });
      }
      
      if (product.stockQuantity < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        });
      }

      // Calculate price (handle discounts if needed)
      let price = product.price;
      if (product.discount && 
          product.discount.percentage && 
          new Date(product.discount.startDate) <= new Date() && 
          new Date(product.discount.endDate) >= new Date()) {
        const discountAmount = (price * product.discount.percentage) / 100;
        price = price - discountAmount;
      }
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: price
      });
      
      subtotal += price * item.quantity;
    }

    // 2. Calculate shipping, tax, etc.
    const shippingCost = calculateShippingCost(subtotal, shippingMethod);
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const total = subtotal + shippingCost + tax;

    // 3. Create the order
    const order = new Order({
      user: userId, // Will be null for guest checkout
      email: shippingAddress.email, // Required for guest checkout
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      shippingMethod,
      subtotal,
      shippingCost,
      tax,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      guestOrder: isGuest
    });

    await order.save({ session });
    
    // 4. Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: { 
        orderId: order._id.toString(),
        userId: userId ? userId.toString() : 'guest'
      }
    });

    // 5. Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      order,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

// Process successful payment and update inventory
export const processPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentIntentId } = req.body;
    
    // 1. Validate payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Payment not successful' });
    }
    
    const orderId = paymentIntent.metadata.orderId;
    
    // 2. Find the order
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // 3. Update order status
    order.paymentStatus = 'paid';
    order.status = 'processing';
    order.stripeChargeId = paymentIntent.charges.data[0]?.id;
    
    await order.save({ session });
    
    // 4. Update inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } },
        { session }
      );
    }
    
    // 5. Add points to user if they have an account
    if (order.user) {
      const pointsEarned = Math.floor(order.total);
      await User.findByIdAndUpdate(
        order.user,
        { $inc: { points: pointsEarned } },
        { session }
      );
      
      logger.info(`Added ${pointsEarned} points to user ${order.user} for order ${order._id}`);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      order,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error processing payment:', error);
    res.status(500).json({ message: 'Error processing payment' });
  }
};

// Cancel an order
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Find the order (include guest orders if the email matches)
    const orderQuery = { _id: id };
    if (userId) {
      orderQuery.user = userId;
    } else if (req.body.email) {
      orderQuery.email = req.body.email;
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if order is in a cancellable state
    orderQuery.status = { $nin: ['delivered', 'cancelled'] };
    
    // 1. Find the order
    const order = await Order.findOne(orderQuery).session(session);
    
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }
    
    // 2. If payment was made, process refund
    if (order.paymentStatus === 'paid' && order.stripeChargeId) {
      const refund = await stripe.refunds.create({
        charge: order.stripeChargeId,
        metadata: { 
          orderId: order._id.toString(),
          reason: 'customer_requested'
        }
      });
      
      order.refundStatus = {
        status: 'processed',
        date: new Date(),
        amount: order.total,
        stripeRefundId: refund.id
      };
    }
    
    // 3. Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    
    await order.save({ session });
    
    // 4. Restore inventory if order was in processing state
    if (order.status === 'processing') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stockQuantity: item.quantity } },
          { session }
        );
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
};

// Stripe webhook handler for payment events
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    await handleSuccessfulPayment(paymentIntent);
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    await handleFailedPayment(paymentIntent);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};

// Helper function to handle successful payments from webhook
const handleSuccessfulPayment = async (paymentIntent) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      logger.error('No orderId found in paymentIntent metadata');
      await session.abortTransaction();
      return;
    }
    
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      await session.abortTransaction();
      return;
    }
    
    if (order.paymentStatus === 'paid') {
      logger.info(`Order ${orderId} already marked as paid, skipping`);
      await session.abortTransaction();
      return;
    }
    
    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'processing';
    
    if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
      order.stripeChargeId = paymentIntent.charges.data[0].id;
    }
    
    await order.save({ session });
    
    // Update inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } },
        { session }
      );
    }
    
    // Add points to user
    if (order.user) {
      const pointsEarned = Math.floor(order.total);
      await User.findByIdAndUpdate(
        order.user,
        { $inc: { points: pointsEarned } },
        { session }
      );
    }
    
    await session.commitTransaction();
    logger.info(`Payment processed successfully for order ${orderId}`);
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error handling successful payment webhook:', error);
  } finally {
    session.endSession();
  }
};

// Helper function to handle failed payments from webhook
const handleFailedPayment = async (paymentIntent) => {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      logger.error('No orderId found in paymentIntent metadata');
      return;
    }
    
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'failed',
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    logger.info(`Payment failed for order ${orderId}`);
  } catch (error) {
    logger.error('Error handling failed payment webhook:', error);
  }
};

// Helper function to calculate shipping cost
const calculateShippingCost = (subtotal, shippingMethod) => {
  if (subtotal >= 100) {
    return 0; // Free shipping for orders over $100
  }
  
  return shippingMethod === 'express' ? 25 : 10; // $25 for express, $10 for standard
};
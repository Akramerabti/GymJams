import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import stripe from '../config/stripe.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { sendOrderConfirmationEmail, sendOrderUpdateEmail } from '../services/email.service.js';

// Get all orders for the current user
export const getOrders = async (req, res) => {
  try {
    // Extract user ID from the authenticated user
    const userId = req.user.id;

    console.log('User ID:', userId);
    
    if (!userId || typeof userId !== 'string') {
      logger.error(`Invalid userId format: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Validate the userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error(`User ID is not a valid ObjectId: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Find orders for the current user
    const orders = await Order.find({ user: userId })
      .populate('items.product')
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance when you don't need Mongoose documents

      console.log('Orders:', orders);
    return res.status(200).json({ orders });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate orderId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      logger.error(`Invalid order ID format: ${id}`);
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      logger.error(`Invalid user ID format in order details request: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Find the order with proper population
    const order = await Order.findOne({ 
      _id: id, 
      user: userId 
    }).populate({
      path: 'items.product',
      select: 'name price images category stockQuantity'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    logger.error('Error fetching order details:', error);
    return res.status(500).json({ message: 'Error fetching order details' });
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    // Validate items and check stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
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
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        });
      }

      let price = product.price;
      if (product.discount && product.discount.percentage && new Date(product.discount.startDate) <= new Date() && new Date(product.discount.endDate) >= new Date()) {
        const discountAmount = (price * product.discount.percentage) / 100;
        price = price - discountAmount;
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: price,
      });

      subtotal += price * item.quantity;
    }

    const shippingCost = calculateShippingCost(subtotal, shippingMethod);
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const total = subtotal + shippingCost + tax;

    // Create the order without requiring an email for guest users
    const order = new Order({
      user: userId, // Will be null for guest checkout
      email: shippingAddress.email || null, // Allow null for guest orders
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
      guestOrder: isGuest,
    });

    await order.save({ session });

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: userId ? userId.toString() : 'guest',
      },
    });

    // Update the order with the payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      order,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

export const processPayment = async (req, res) => {
  const maxRetries = 5;
  let retryCount = 0;
  let lastError = null;

  logger.debug(`Starting payment processing for request: ${JSON.stringify(req.body)}`);

  while (retryCount < maxRetries) {
    const session = await mongoose.startSession();
    
    try {
      // Start transaction with proper concurrency control
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });

      logger.debug(`Starting transaction (attempt ${retryCount + 1})`);

      const { paymentIntentId } = req.body;

      logger.debug(`Processing payment intent: ${paymentIntentId}`);

      if (!paymentIntentId) {
        logger.error('Payment intent ID is required');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Payment intent ID is required' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        logger.error('Payment not successful or payment intent not found');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Payment not successful' });
      }

      const orderId = paymentIntent.metadata.orderId;

      if (!orderId) {
        logger.error('No order ID found in payment metadata');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'No order ID found in payment metadata' });
      }

      const order = await Order.findById(orderId).session(session);
      
      if (!order) {
        logger.warn('Order not found');
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Order not found' });
      }

      // Only proceed if the order hasn't already been paid
      if (order.paymentStatus === 'paid') {
        logger.info('Order already marked as paid, returning success');
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ 
          order, 
          message: 'Payment already processed'
        });
      }

      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'processing';
      
      // Get charge ID if available
      if (paymentIntent.charges?.data?.length > 0) {
        order.stripeChargeId = paymentIntent.charges.data[0].id;
      } else if (paymentIntent.latest_charge) {
        order.stripeChargeId = paymentIntent.latest_charge;
      }
      
      await order.save({ session });
      logger.debug('Order status updated to paid and processing');

      // Update inventory using findOneAndUpdate with optimistic concurrency control
      for (const item of order.items) {
        logger.debug(`Updating inventory for product: ${item.product}, quantity: ${item.quantity}`);
        
        // First get the current product to check stock
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }
        
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product}`);
        }
        
        // Now update with atomic operation
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            _id: item.product,
            stockQuantity: { $gte: item.quantity } // Optimistic concurrency control
          },
          { $inc: { stockQuantity: -item.quantity } },
          { new: true, session }
        );
        
        if (!updatedProduct) {
          throw new Error(`Failed to update inventory for product ${item.product}`);
        }
        
        // Get the user value - either ObjectId or 'guest'
        const userId = order.user || 'guest';
        
        // Create inventory transaction record
        await new InventoryTransaction({
          product: item.product,
          transactionType: 'reduction',
          quantity: item.quantity,
          previousQuantity: product.stockQuantity,
          newQuantity: product.stockQuantity - item.quantity,
          reason: `Order #${order._id}`,
          user: userId,
          orderId: order._id
        }).save({ session });
        
        logger.debug(`Inventory updated for product: ${item.product}`);
      }
      
      // If a user is authenticated, award points
      if (order.user) {
        const pointsEarned = Math.floor(order.total);
        await User.findByIdAndUpdate(
          order.user,
          { $inc: { points: pointsEarned } },
          { session }
        );
        logger.debug(`Added ${pointsEarned} points to user ${order.user}`);
      }

      // If we get here without errors, commit the transaction
      await session.commitTransaction();
      session.endSession();
      logger.debug('Transaction committed successfully');

      // Send order confirmation email with PDF receipt
      try {
        // Get the email address - either from user or from order.email for guest
        const emailAddress = order.email || (order.user ? await User.findById(order.user).then(u => u.email) : null);

        if (emailAddress) {
          // Populate product details for the email
          const populatedOrder = await Order.findById(order._id).populate('items.product');

          await sendOrderConfirmationEmail(populatedOrder, emailAddress);
          logger.info(`Order confirmation email sent for order ${order._id}`);
        } else {
          logger.warn(`No email address found for order ${order._id}, skipping confirmation email`);
        }
      } catch (emailError) {
        // Don't fail the transaction if email sending fails
        logger.error(`Failed to send order confirmation email: ${emailError}`);
      }


      return res.status(200).json({ 
        order, 
        message: 'Payment processed successfully' 
      });
    } catch (error) {
      // Always abort the transaction on error
      await session.abortTransaction();
      session.endSession();

      logger.error(`Error during transaction (attempt ${retryCount + 1}): ${error.message}`);
      logger.debug(`Error details: ${JSON.stringify(error)}`);

      // Check if this is a retryable error (write conflict or other transient error)
      const isTransient = 
        error.code === 112 || // WriteConflict error
        error.code === 251 || // Transaction aborted due to transaction timeout
        (error.errorLabels && error.errorLabels.includes("TransientTransactionError")) ||
        error.message?.includes('Write conflict');
      
      if (isTransient && retryCount < maxRetries - 1) {
        // Exponential backoff with jitter: 2^n * (100-500ms) milliseconds
        retryCount++;
        const baseDelay = Math.pow(2, retryCount) * 100;
        const jitter = Math.floor(Math.random() * 400); // Random number between 0-400
        const backoffMs = baseDelay + jitter;
        logger.debug(`Retrying transaction in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      // We've reached max retries or encountered a non-transient error
      lastError = error;
      break;
    }
  }

  // If we get here, all retries failed
  logger.error(`Failed to process payment after ${retryCount} attempts`);
  
  return res.status(500).json({
    message: 'Failed to process payment after multiple attempts',
    error: lastError?.message || 'Transaction conflicts',
    retryCount
  });
};


const handleSuccessfulPayment = async (paymentIntent) => {
  let retryCount = 0;
  const maxRetries = 5;
  
  while (retryCount < maxRetries) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
      
      logger.debug(`Webhook transaction attempt ${retryCount + 1} for payment intent ${paymentIntent.id}`);
      
      const orderId = paymentIntent.metadata.orderId;
      
      if (!orderId) {
        logger.error('No orderId found in paymentIntent metadata');
        await session.abortTransaction();
        session.endSession();
        return;
      }
      
      // Find the order by ID, not restricting by payment status because
      // the regular payment route might have already handled it
      const order = await Order.findById(orderId).session(session);
      
      if (!order) {
        logger.info(`Order ${orderId} not found, skipping webhook`);
        await session.abortTransaction();
        session.endSession();
        return;
      }
      
      // If the order is already paid, we don't need to do anything
      if (order.paymentStatus === 'paid') {
        logger.info(`Order ${orderId} already paid, skipping webhook processing`);
        await session.abortTransaction();
        session.endSession();
        return;
      }
      
      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'processing';
      
      // Handle cases where there might not be charges data yet
      let chargeId = null;
      if (paymentIntent.charges && paymentIntent.charges.data && paymentIntent.charges.data.length > 0) {
        chargeId = paymentIntent.charges.data[0].id;
      } else if (paymentIntent.latest_charge) {
        // Some payment intents have a direct latest_charge field
        chargeId = paymentIntent.latest_charge;
      }
      
      if (chargeId) {
        order.stripeChargeId = chargeId;
      }
      
      await order.save({ session });
      logger.debug(`Order ${orderId} marked as paid via webhook`);
      
      // Update inventory with optimistic concurrency control
      for (const item of order.items) {
        // First get the current product to check stock
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          logger.warn(`Product ${item.product} not found during webhook processing`);
          continue;
        }
        
        const previousQuantity = product.stockQuantity;
        const newQuantity = Math.max(0, previousQuantity - item.quantity);
        
        // Use findOneAndUpdate with optimistic concurrency control
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            _id: product._id,
            stockQuantity: previousQuantity // Ensure no one else updated it
          },
          { $set: { stockQuantity: newQuantity } },
          { new: true, session }
        );
        
        if (!updatedProduct) {
          // This means another process updated the product, forcing a retry
          throw new Error(`Concurrent modification detected for product ${product._id}`);
        }
        
        // Get the user value - either ObjectId or 'guest'
        const userId = order.user || 'guest';
        
        // Create inventory transaction
        await new InventoryTransaction({
          product: item.product,
          transactionType: 'reduction',
          quantity: item.quantity,
          previousQuantity,
          newQuantity,
          reason: `Order #${order._id} webhook`,
          user: userId, // Use userId which is either ObjectId or 'guest'
          orderId: order._id,
          notes: 'Inventory reduction due to webhook payment confirmation'
        }).save({ session });
        
        logger.debug(`Webhook: Updated inventory for product ${item.product}: ${previousQuantity} -> ${newQuantity}`);
      }
      
      // Add points to user (only for registered users)
      if (order.user) {
        const pointsEarned = Math.floor(order.total);
        await User.findByIdAndUpdate(
          order.user,
          { $inc: { points: pointsEarned } },
          { session, new: true }
        );
        logger.debug(`Added ${pointsEarned} points to user ${order.user}`);
      }
      
      await session.commitTransaction();
      logger.info(`Webhook: Payment processed successfully for order ${orderId}`);
      session.endSession();

      // Send order confirmation email
      try {
        // Since we've closed the session, get a fresh copy of the order with populated products
        const populatedOrder = await Order.findById(orderId).populate('items.product');

        // Get the email address from either the order.email field or the user record
        const emailAddress = populatedOrder.email || 
          (populatedOrder.user ? await User.findById(populatedOrder.user).then(u => u.email) : null);

        if (emailAddress) {
          await sendOrderConfirmationEmail(populatedOrder, emailAddress);
          logger.info(`Order confirmation email sent for order ${orderId} via webhook`);
        } else {
          logger.warn(`No email address found for order ${orderId}, skipping confirmation email from webhook`);
        }
      } catch (emailError) {
        // Don't fail if email sending fails
        logger.error(`Failed to send order confirmation email from webhook: ${emailError}`);
      }

      return;
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      const isTransient = 
        error.code === 112 || // WriteConflict error
        error.code === 251 || // Transaction aborted due to transaction timeout
        (error.errorLabels && error.errorLabels.includes("TransientTransactionError")) ||
        error.message?.includes('Write conflict') ||
        error.message?.includes('Concurrent modification detected');
        
      if (isTransient && retryCount < maxRetries - 1) {
        retryCount++;
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, retryCount) * 100;
        const jitter = Math.floor(Math.random() * 400);
        const backoffMs = baseDelay + jitter;
        
        logger.warn(`Retrying webhook transaction (attempt ${retryCount + 1}) due to transient error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      logger.error('Error handling webhook payment (non-retryable):', error);
      break;
    }
  }
  
  if (retryCount >= maxRetries) {
    logger.error(`Max retries (${maxRetries}) reached for webhook payment processing`);
  }
};
// Cancel an order
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  });

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
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          logger.warn(`Product ${item.product} not found while cancelling order ${order._id}`);
          continue;
        }
        
        const previousQuantity = product.stockQuantity;
        const newQuantity = previousQuantity + item.quantity;
        
        await Product.findByIdAndUpdate(
          item.product,
          { $set: { stockQuantity: newQuantity } },
          { session, new: true }
        );
        
        // Get the user value - either ObjectId or 'guest'
        const userId = order.user || 'guest';
        
        // Create inventory transaction record for the inventory restoration
        const inventoryTransaction = new InventoryTransaction({
          product: item.product,
          transactionType: 'addition',
          quantity: item.quantity,
          previousQuantity: previousQuantity,
          newQuantity: newQuantity,
          reason: `Order #${order._id} cancelled`,
          user: userId,
          orderId: order._id,
          notes: 'Inventory restoration due to order cancellation'
        });
        
        await inventoryTransaction.save({ session });
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

export const updateOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { items, shippingAddress, billingAddress, shippingMethod = 'standard', userId } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending' || order.paymentStatus !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order cannot be modified' });
    }

    if (items && items.length > 0) {
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
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
            message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          });
        }

        let price = product.price;
        if (product.discount && product.discount.percentage && new Date(product.discount.startDate) <= new Date() && new Date(product.discount.endDate) >= new Date()) {
          const discountAmount = (price * product.discount.percentage) / 100;
          price = price - discountAmount;
        }

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: price,
        });

        subtotal += price * item.quantity;
      }

      order.items = orderItems;
      order.subtotal = subtotal;
    }

    if (shippingAddress) {
      order.shippingAddress = shippingAddress;

      // If this is a guest order getting a user ID, update the user field
      if (userId && !order.user) {
        order.user = userId;
      }
    }

    if (billingAddress) {
      order.billingAddress = billingAddress;
    }

    if (shippingMethod) {
      order.shippingMethod = shippingMethod;
    }

    const shippingCost = calculateShippingCost(order.subtotal || 0, order.shippingMethod);
    const tax = Math.round((order.subtotal || 0) * 0.08 * 100) / 100; // 8% tax
    const total = (order.subtotal || 0) + shippingCost + tax;

    order.shippingCost = shippingCost;
    order.tax = tax;
    order.total = total;

    await order.save({ session });

    if (order.paymentIntentId) {
      await stripe.paymentIntents.update(order.paymentIntentId, {
        amount: Math.round(total * 100), // Convert to cents
        metadata: {
          orderId: order._id.toString(),
          userId: userId ? userId.toString() : 'guest',
        },
      });
    } else {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: order._id.toString(),
          userId: userId ? userId.toString() : 'guest',
        },
      });

      order.paymentIntentId = paymentIntent.id;
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const updatedOrder = await Order.findById(id).populate('items.product');

    res.status(200).json({
      order: updatedOrder,
      clientSecret: updatedOrder.paymentIntentId
        ? (await stripe.paymentIntents.retrieve(updatedOrder.paymentIntentId)).client_secret
        : null,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
};

export const getGuestOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      logger.error(`Invalid order ID format: ${orderId}`);
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findOne({
      _id: orderId,
      email: email.toLowerCase(),
    }).populate({
      path: 'items.product',
      select: 'name price images category stockQuantity',
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found for the provided email' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    logger.error('Error fetching guest order details:', error);
    return res.status(500).json({ message: 'Error fetching order details' });
  }
};

export const updateOrderEmail = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Find the order
    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order with the email
    order.email = email;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error('Error updating order email:', error);
    res.status(500).json({ message: 'Error updating order email' });
  }
};

// Add this new controller function to order.controller.js

export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, trackingNumber, estimatedDeliveryDate } = req.body;

    // Validate order ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    // Validate status
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the order
    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;

    // If shipping status, add tracking info
    if (status === 'shipped') {
      if (!trackingNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Tracking number is required for shipped status' });
      }
      order.trackingNumber = trackingNumber;
      
      if (estimatedDeliveryDate) {
        order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
      }
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send status update email if status has changed
    if (previousStatus !== status) {
      try {
        // Get the email address
        const emailAddress = order.email || 
          (order.user ? await User.findById(order.user).then(u => u.email) : null);
        
        if (emailAddress) {
          // Get a populated version of the order for the email
          const populatedOrder = await Order.findById(id).populate('items.product');
          
          await sendOrderUpdateEmail(populatedOrder, emailAddress, status);
          logger.info(`Order status update email sent for order ${id}`);
        }
      } catch (emailError) {
        logger.error(`Failed to send order status update email: ${emailError}`);
        // Don't fail the request if email sending fails
      }
    }

    res.status(200).json({
      message: 'Order status updated successfully',
      order: await Order.findById(id).populate('items.product')
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};
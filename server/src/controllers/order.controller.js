import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import stripe from '../config/stripe.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import InventoryTransaction from '../models/InventoryTransaction.js';

// Get all orders for the current user
export const getOrders = async (req, res) => {
  try {
    // Extract user ID from the authenticated user
    const userId = req.user.id;
    
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
      logger.debug(`Retrieved payment intent: ${JSON.stringify(paymentIntent)}`);

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        logger.error('Payment not successful or payment intent not found');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Payment not successful' });
      }

      const orderId = paymentIntent.metadata.orderId;
      logger.debug(`Order ID from payment intent metadata: ${orderId}`);

      if (!orderId) {
        logger.error('No order ID found in payment metadata');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'No order ID found in payment metadata' });
      }

      // Use findOne instead of findById to have more control over the query
      const order = await Order.findOne({
        _id: orderId,
        paymentStatus: { $ne: 'paid' } // Only process if not already paid
      }).session(session);
      
      logger.debug(`Retrieved order: ${JSON.stringify(order)}`);

      if (!order) {
        logger.warn('Order not found or already processed');
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({ 
          message: 'Order not found or already processed',
          alreadyProcessed: true
        });
      }

      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'processing';
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

      // If we get here without errors, commit the transaction
      await session.commitTransaction();
      session.endSession();
      logger.debug('Transaction committed successfully');

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

// Improved helper function to handle successful payments from webhook
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
      
      // Use findOne with query conditions instead of findById to ensure atomicity
      const order = await Order.findOne({
        _id: orderId,
        paymentStatus: { $ne: 'paid' } // Only process if not already paid
      }).session(session);
      
      if (!order) {
        logger.info(`Order ${orderId} not found or already processed, skipping webhook`);
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
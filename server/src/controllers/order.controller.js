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
  const maxRetries = 5; // Increased number of retries
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primary'
      });

      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Payment intent ID is required' });
      }

      // 1. Validate payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Payment intent not found' });
      }

      if (paymentIntent.status !== 'succeeded') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Payment not successful' });
      }

      const orderId = paymentIntent.metadata.orderId;
      if (!orderId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'No order ID found in payment metadata' });
      }

      // 2. Find the order - with explicit locking
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if the order has already been processed to avoid double-processing
      if (order.paymentStatus === 'paid') {
        // Order already processed, no need to continue with the transaction
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
          order,
          message: 'Order has already been processed',
        });
      }

      // 3. Update order status
      order.paymentStatus = 'paid';
      order.status = 'processing';

      // Handle cases where there might not be charges data yet
      let chargeId = null;
      if (paymentIntent.charges && paymentIntent.charges.data && paymentIntent.charges.data.length > 0) {
        chargeId = paymentIntent.charges.data[0].id;
      } else if (paymentIntent.latest_charge) {
        chargeId = paymentIntent.latest_charge;
      }

      if (chargeId) {
        order.stripeChargeId = chargeId;
      }

      await order.save({ session });

      // 4. Update inventory with improved locking strategy
      for (const item of order.items) {
        // Find product with explicit lock for update
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          // Skip if product doesn't exist
          logger.warn(`Product ${item.product} not found while processing order ${order._id}`);
          continue;
        }
        
        // Verify stock again in case it changed between transactions
        if (product.stockQuantity < item.quantity) {
          // We have already charged the customer, so we need to fulfill the order
          // Log a warning about negative inventory
          logger.warn(`Insufficient stock for product ${product._id} while processing order ${order._id}. Allowing negative inventory.`);
        }
        
        const previousQuantity = product.stockQuantity;
        const newQuantity = Math.max(0, previousQuantity - item.quantity);
        
        // Update product with a specific update query to avoid race conditions
        await Product.findByIdAndUpdate(
          item.product,
          { $set: { stockQuantity: newQuantity } },
          { session, new: true }
        );
        
        // Create inventory transaction record
        const inventoryTransaction = new InventoryTransaction({
          product: item.product,
          transactionType: 'reduction',
          quantity: item.quantity,
          previousQuantity: previousQuantity,
          newQuantity: newQuantity,
          reason: `Order #${order._id}`,
          user: order.user || 'guest',
          orderId: order._id,
          notes: `Inventory reduction due to purchase (attempt ${retryCount + 1})`
        });
        
        await inventoryTransaction.save({ session });
      }

      // 5. Add points to user if they have an account
      if (order.user) {
        const pointsEarned = Math.floor(order.total);
        await User.findByIdAndUpdate(
          order.user,
          { $inc: { points: pointsEarned } },
          { session, new: true }
        );

        logger.info(`Added ${pointsEarned} points to user ${order.user} for order ${order._id}`);
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        order,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      lastError = error;
      await session.abortTransaction();
      session.endSession();

      // Only retry on specific transient errors
      const isTransient = 
        error.errorLabels?.includes('TransientTransactionError') || 
        error.message?.includes('Write conflict') ||
        error.message?.includes('yielding is disabled');
      
      if (isTransient && retryCount < maxRetries) {
        retryCount++;
        logger.warn(`Retrying transaction (attempt ${retryCount}) due to transient error: ${error.message}`);
        
        // Add exponential backoff to reduce contention
        const backoffMs = Math.min(100 * Math.pow(2, retryCount), 2000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        continue; // Retry the transaction
      }

      logger.error('Error processing payment:', error);
      break; // Exit the loop for non-transient errors
    }
  }

  // If all retries fail
  logger.error('Max retries reached for processing payment');
  return res.status(500).json({ 
    message: 'Failed to process payment after multiple attempts',
    error: lastError?.message || 'Transaction conflicts' 
  });
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
        
        // Create inventory transaction record for the inventory restoration
        const inventoryTransaction = new InventoryTransaction({
          product: item.product,
          transactionType: 'addition',
          quantity: item.quantity,
          previousQuantity: previousQuantity,
          newQuantity: newQuantity,
          reason: `Order #${order._id} cancelled`,
          user: order.user || 'guest',
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

// Helper function to handle successful payments from webhook
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
      
      const orderId = paymentIntent.metadata.orderId;
      
      if (!orderId) {
        logger.error('No orderId found in paymentIntent metadata');
        await session.abortTransaction();
        session.endSession();
        return;
      }
      
      const order = await Order.findById(orderId).session(session);
      
      if (!order) {
        logger.error(`Order not found: ${orderId}`);
        await session.abortTransaction();
        session.endSession();
        return;
      }
      
      if (order.paymentStatus === 'paid') {
        logger.info(`Order ${orderId} already marked as paid, skipping`);
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
      
      // Update inventory and create transaction records
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) continue;
        
        const previousQuantity = product.stockQuantity;
        const newQuantity = Math.max(0, previousQuantity - item.quantity);
        
        await Product.findByIdAndUpdate(
          item.product,
          { stockQuantity: newQuantity },
          { session, new: true }
        );
        
        // Create inventory transaction
        const inventoryTransaction = new InventoryTransaction({
          product: item.product,
          transactionType: 'reduction',
          quantity: item.quantity,
          previousQuantity: previousQuantity,
          newQuantity: newQuantity,
          reason: `Order #${order._id} webhook`,
          user: order.user || 'guest',
          orderId: order._id,
          notes: 'Inventory reduction due to webhook payment confirmation'
        });
        
        await inventoryTransaction.save({ session });
      }
      
      // Add points to user
      if (order.user) {
        const pointsEarned = Math.floor(order.total);
        await User.findByIdAndUpdate(
          order.user,
          { $inc: { points: pointsEarned } },
          { session, new: true }
        );
      }
      
      await session.commitTransaction();
      logger.info(`Payment processed successfully for order ${orderId}`);
      return;
      
    } catch (error) {
      await session.abortTransaction();
      
      const isTransient = 
        error.errorLabels?.includes('TransientTransactionError') || 
        error.message?.includes('Write conflict') ||
        error.message?.includes('yielding is disabled');
        
      if (isTransient && retryCount < maxRetries) {
        retryCount++;
        const backoffMs = Math.min(100 * Math.pow(2, retryCount), 2000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        logger.warn(`Retrying webhook transaction (attempt ${retryCount}) due to transient error: ${error.message}`);
        continue;
      }
      
      logger.error('Error handling successful payment webhook:', error);
      break;
    } finally {
      session.endSession();
    }
  }
  
  if (retryCount >= maxRetries) {
    logger.error(`Max retries (${maxRetries}) reached for webhook payment processing`);
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
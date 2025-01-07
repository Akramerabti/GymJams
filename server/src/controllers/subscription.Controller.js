import Stripe from 'stripe';
import User from '../models/User.js';
import { 
  UserSubscription, 
  UserPoints, 
  Subscription 
} from '../models/Subscription.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// subscription.Controller.js
export const createSubscription = async (req, res) => {
  const { planId, paymentMethodId, email, firstName, lastName, phone } = req.body;

  try {
    // Validate input
    if (!planId || !paymentMethodId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch the plan using the ObjectId
    const plan = await Subscription.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        firstName,
        lastName,
        phone,
        role: 'user',
        isEmailVerified: false,
      });
      await user.save();
    }

    // Handle Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription in database
    const userSubscription = new UserSubscription({
      user: user._id,
      subscription: planId,
      startDate: new Date(),
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
    });
    await userSubscription.save();

    // Handle points allocation
    const userPoints = await UserPoints.findOne({ user: user._id });
    if (userPoints) {
      userPoints.balance += plan.pointsPerMonth;
      userPoints.history.push({
        amount: plan.pointsPerMonth,
        type: 'earned',
        source: 'subscription',
        description: `Points from ${plan.name} subscription`,
      });
      await userPoints.save();
    } else {
      await UserPoints.create({
        user: user._id,
        balance: plan.pointsPerMonth,
        history: [{
          amount: plan.pointsPerMonth,
          type: 'earned',
          source: 'subscription',
          description: `Points from ${plan.name} subscription`,
        }],
      });
    }

    // Send success response
    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    logger.error('Subscription creation failed:', error);
    res.status(500).json({
      error: 'Subscription creation failed',
      message: error.message,
    });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await UserSubscription.findById(req.params.id)
      .populate('subscription');

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await UserSubscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel on Stripe
    await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    // Update local subscription
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await subscription.save();

    res.json({ success: true });
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};
// controllers/subscription.controller.js
import Stripe from 'stripe';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan configurations
const PLANS = {
  basic: {
    name: 'Basic',
    price: 29.99,
    stripePriceId: 'price_1QfDwQFGfbnmVSqEnE7A8vlR',
    points: 100
  },
  premium: {
    name: 'Premium',
    price: 49.99,
    stripePriceId: 'price_1QfDxKFGfbnmVSqEfd4Fc5HH',
    points: 200
  },
  elite: {
    name: 'Elite',
    price: 99.99,
    stripePriceId: 'price_1QfDxZFGfbnmVSqEUe8fCPFa',
    points: 500
  }
};

// Create subscription payment intent
export const createSubscriptionIntent = async (req, res) => {
  try {
    const { planType } = req.body;

    console.log('Creating subscription:', PLANS[planType]);

    if (!PLANS[planType]) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const plan = PLANS[planType];

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        planType,
        userId: req.user?.id || 'guest'
      }
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      plan
    });
  } catch (error) {
    logger.error('Failed to create payment intent:', error);
    res.status(500).json({ error: 'Failed to start subscription process' });
  }
};

// Create new subscription
export const createSubscription = async (req, res) => {
  try {
    const { planType, paymentMethodId } = req.body;
    const user = req.user;

    console.log('Creating subscription:', PLANS[planType]);

    if (!PLANS[planType]) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Create or get Stripe customer
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        metadata: {
          userId: user.id
        }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: PLANS[planType].stripePriceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });

    // Create subscription in DB
    const newSubscription = await Subscription.create({
      user: user.id,
      subscription: planType,
      stripeSubscriptionId: subscription.id,
      status: subscription.status
    });

    // Update user
    user.subscription = newSubscription._id;
    user.points += PLANS[planType].points;
    await user.save();

    res.json({
      subscription: newSubscription,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    logger.error('Failed to create subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

// Update subscription
export const updateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { newPlanType } = req.body;
    
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!PLANS[newPlanType]) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Update in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          price: PLANS[newPlanType].stripePriceId
        }],
        proration_behavior: 'always_invoice'
      }
    );

    // Update in DB
    subscription.subscription = newPlanType;
    await subscription.save();

    // Update user points
    const pointsDiff = PLANS[newPlanType].points - PLANS[subscription.subscription].points;
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: pointsDiff }
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    logger.error('Failed to update subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel in Stripe
    await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    // Update in DB
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await subscription.save();

    // Remove subscription from user
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { subscription: 1 }
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    logger.error('Failed to cancel subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// controllers/subscription.controller.js
export const handleSubscriptionSuccess = async (req, res) => {
  try {
    const { planType, paymentIntentId, email } = req.body;

    // Retrieve the payment intent from Stripe to confirm the payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    let user = null;

    // If the user is authenticated, use the authenticated user
    if (req.user) {
      user = req.user;
    } else {
      // If the user is not authenticated, search for the user by email
      user = await User.findOne({ email });
    }

    // Create or update the subscription in the database
    const subscriptionData = {
      subscription: planType,
      stripeSubscriptionId: paymentIntent.id,
      status: 'active',
      startDate: new Date(),
    };

    if (user) {
      // If the user is logged in, associate the subscription with the user
      subscriptionData.user = user.id;
    } else {
      // If it's a guest, associate the subscription with the guest email
      subscriptionData.guestEmail = email;
    }

    // Create the subscription in the database
    const newSubscription = await Subscription.create(subscriptionData);

    // If the user is logged in, update their subscription and points
    if (user) {
      // Update the user's subscription and points
      await User.findByIdAndUpdate(
        user.id,
        {
          $set: { subscription: newSubscription._id }, // Add the subscription reference
          $inc: { points: PLANS[planType].points }, // Add points based on the plan
        },
        { new: true }
      );
    }

    res.json({ success: true, subscription: newSubscription });
  } catch (error) {
    logger.error('Failed to handle subscription success:', error);
    res.status(500).json({ error: 'Failed to handle subscription success' });
  }
};
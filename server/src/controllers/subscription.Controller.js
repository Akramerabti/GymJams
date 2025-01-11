// controllers/subscription.controller.js
import Stripe from 'stripe';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';
import { sendSubscriptionReceipt } from '../services/email.service.js';
import crypto from 'crypto';

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

export const getCurrentSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user.subscription) {
      return res.status(200).json(null); // Return null instead of 404
    }
    res.json(user.subscription);
  } catch (error) {
    logger.error('Error fetching current subscription:', error);
    res.status(500).json({ message: 'Error fetching current subscription' });
  }
};

export const finishCurrentMonth = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find the subscription in the database
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if the subscription belongs to the logged-in user
    if (req.user && subscription.user?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to modify this subscription' });
    }

    // Cancel the subscription in Stripe but allow it to run until the end of the current period
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true, // This will cancel the subscription at the end of the current period
    });

    // Update the subscription in the database
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({ message: 'Recurring payments have been cancelled. You will retain access until the end of the current billing period.' });
  } catch (error) {
    logger.error('Failed to finish current month:', error);
    res.status(500).json({ error: 'Failed to finish current month' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find the subscription in the database
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if the subscription belongs to the logged-in user (if user is logged in)
    if (req.user && subscription.user?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to cancel this subscription' });
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update the subscription in the database
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await subscription.save();

    // Handle points removal for logged-in users within the first 10 days
    if (req.user && subscription.user) {
      const daysSinceStart = (new Date() - subscription.startDate) / (1000 * 60 * 60 * 24);

      if (daysSinceStart <= 10) {
        // Remove the points awarded for this subscription
        const pointsToRemove = PLANS[subscription.subscription].points;
        console.log(`Removing ${pointsToRemove} points from user ${req.user.id} (within 10 days of subscription)`); // Log points removal
        await User.findByIdAndUpdate(subscription.user, {
          $inc: { points: -pointsToRemove },
        });
      }
    }

    // Remove the subscription reference from the user (if logged in)
    if (req.user && subscription.user) {
      console.log(`Removing subscription reference from user ${req.user.id}`); // Log subscription removal
      await User.findByIdAndUpdate(req.user.id, {
        $unset: { subscription: 1 },
      });
    }

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    logger.error('Failed to cancel subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const handleSubscriptionSuccess = async (req, res) => {
  try {
    console.log('Handling subscription success...');
    console.log('req.user:', req.user);

    const { planType, paymentIntentId, email } = req.body;

    if (!planType || !paymentIntentId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    let user = null;
    let stripeCustomerId = null;

    if (req.user) {
      console.log('User is logged in:', req.user.id);
      user = req.user;
      stripeCustomerId = user.stripeCustomerId;
    } else {
      console.log('User is a guest, creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: email,
      });
      stripeCustomerId = customer.id;
    }

    // Create a subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: PLANS[planType].stripePriceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Prepare subscription data for the database
    const subscriptionData = {
      subscription: planType,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: stripeCustomerId,
      status: 'active',
      startDate: new Date(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      accessToken,
    };

    if (user) {
      console.log('Associating subscription with user:', user.id);
      subscriptionData.user = user.id;
    } else {
      console.log('Associating subscription with guest email:', email);
      subscriptionData.guestEmail = email;
    }

    // Create the subscription in the database
    const newSubscription = await Subscription.create(subscriptionData);

    // If the user is logged in, update their subscription and points
    if (user) {
      const pointsToAdd = PLANS[planType].points;
      console.log(`Adding ${pointsToAdd} points to user ${user.id} for ${planType} subscription`);
      await User.findByIdAndUpdate(
        user.id,
        {
          $set: { subscription: newSubscription._id },
          $inc: { points: pointsToAdd },
        },
        { new: true }
      );
    }

    await sendSubscriptionReceipt({
      ...newSubscription.toObject(),
      price: PLANS[planType].price,
      pointsAwarded: PLANS[planType].points,
      accessToken,
      features: PLANS[planType].features 
    }, user ? user.email : email, !user); 

    res.json({ 
      success: true, 
      subscription: newSubscription,
      accessToken: accessToken
    });

  } catch (error) {
    console.error('Failed to handle subscription success:', error);
    
    // If we've created a subscription but email failed, attempt to clean up
    if (error.message?.includes('email') && res.locals.newSubscription) {
      try {
        await Subscription.findByIdAndDelete(res.locals.newSubscription._id);
        if (req.user) {
          await User.findByIdAndUpdate(req.user.id, {
            $unset: { subscription: 1 },
            $inc: { points: -PLANS[planType].points }
          });
        }
        await stripe.subscriptions.del(res.locals.newSubscription.stripeSubscriptionId);
      } catch (cleanupError) {
        console.error('Failed to clean up after email error:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to complete subscription process',
      details: error.message
    });
  }
};

export const accessSubscription = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Find subscription by access token
    const subscription = await Subscription.findOne({ accessToken: token });

    if (!subscription) {
      return res.status(404).json({ error: 'Invalid or expired access token' });
    }

    // Check if subscription is still active
    if (subscription.status !== 'active') {
      return res.status(403).json({ error: 'This subscription is no longer active' });
    }

    // Check if subscription is within its valid period
    const now = new Date();
    if (now > subscription.currentPeriodEnd) {
      return res.status(403).json({ error: 'This subscription period has expired' });
    }

    // Return subscription details along with access information
    const subscriptionDetails = {
      type: subscription.subscription,
      status: subscription.status,
      startDate: subscription.startDate,
      currentPeriodEnd: subscription.currentPeriodEnd,
      features: PLANS[subscription.subscription].features,
      pointsAwarded: PLANS[subscription.subscription].points
    };

    // Store access token in session if you want to maintain access
    if (req.session) {
      req.session.subscriptionAccess = token;
    }

    res.json({ 
      success: true,
      subscription: subscriptionDetails,
      message: 'Subscription access granted successfully'
    });
  } catch (error) {
    console.error('Subscription access error:', error);
    res.status(500).json({ error: 'Failed to access subscription' });
  }
};
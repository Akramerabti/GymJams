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
    console.log(`Updating points for user ${req.user.id}: Adding ${pointsDiff} points`); // Log points change
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: pointsDiff }
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    logger.error('Failed to update subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
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
    const { planType, paymentIntentId, email } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    let user = null;

    if (req.user) { // If the user is authenticated, use the authenticated user
      user = req.user;
    } else {
      user = await User.findOne({ email }); // If the user is not authenticated, search for the user by email
    }

    let stripeCustomerId = user?.stripeCustomerId; // Ensure the user has a stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({  // If the user doesn't have a stripeCustomerId, create a new customer in Stripe
        email: email, // Use the provided email to create the customer
      });
      stripeCustomerId = customer.id;

      if (user) {  // Update the user's stripeCustomerId in the database
        await User.findByIdAndUpdate(user.id, { stripeCustomerId });
      }
    }

    // Create a subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: PLANS[planType].stripePriceId, // Use the price ID from your PLANS configuration
        },
      ],
      payment_behavior: 'default_incomplete', // Ensure the subscription is created even if the payment is not yet complete
      expand: ['latest_invoice.payment_intent'],
    });

    // Prepare subscription data for the database
    const subscriptionData = {
      subscription: planType,
      stripeSubscriptionId: subscription.id, // Use the Subscription ID from Stripe
      stripeCustomerId: stripeCustomerId,
      status: 'active',
      startDate: new Date(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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
      const pointsToAdd = PLANS[planType].points;
      console.log(`Adding ${pointsToAdd} points to user ${user.id} for ${planType} subscription`); // Log points addition
      await User.findByIdAndUpdate(
        user.id,
        {
          $set: { subscription: newSubscription._id }, // Add the subscription reference
          $inc: { points: pointsToAdd }, // Add points based on the plan
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
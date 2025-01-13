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

export const createSetupIntent = async (req, res) => {
  try {
    // Create a SetupIntent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session', // Important for recurring payments
    });

    res.json({ 
      clientSecret: setupIntent.client_secret,
      plan: PLANS[req.body.planType]
    });
  } catch (error) {
    logger.error('Failed to create setup intent:', error);
    res.status(500).json({ error: 'Failed to initialize setup' });
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

export const getQuestionnaireStatus = async (req, res) => {
  try {
    let subscription;

    if (req.user) {
      // For logged-in users
      subscription = await Subscription.findOne({ user: req.user.id });
    } else {
      // For guest users
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token required for guest users' });
      }
      subscription = await Subscription.findOne({ accessToken });
    }

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json({
      completed: subscription.hasCompletedQuestionnaire,
      completedAt: subscription.questionnaireCompletedAt,
      data: subscription.questionnaireData
    });

  } catch (error) {
    logger.error('Error fetching questionnaire status:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire status' });
  }
};

// In subscription.controller.js
export const submitQuestionnaire = async (req, res) => {
  try {
    const { answers, accessToken } = req.body;
    let subscription;

    if (req.user) {
      // For logged-in users
      subscription = await Subscription.findOne({ user: req.user.id });
    } else if (accessToken) {
      // For guest users
      subscription = await Subscription.findOne({ accessToken });
    } else {
      return res.status(400).json({ error: 'Access token required for guest users' });
    }

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Update questionnaire data
    subscription.hasCompletedQuestionnaire = true;
    subscription.questionnaireData = answers;
    subscription.questionnaireCompletedAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Questionnaire completed successfully'
    });
  } catch (error) {
    logger.error('Error submitting questionnaire:', error);
    res.status(500).json({ error: 'Failed to submit questionnaire' });
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
    const { planType, paymentMethodId, email } = req.body;

    if (!planType || !paymentMethodId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = null;
    let stripeCustomerId = null;

    // 1. Get or create customer
    if (req.user) {
      user = req.user;
      stripeCustomerId = user.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email,
      });
      stripeCustomerId = customer.id;
    }

    // 2. Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // 3. Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // 4. Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: PLANS[planType].stripePriceId }],
      payment_behavior: 'error_if_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { planType },
    });

    // Generate access token for guests
    // Generate access token only for guests and set to undefined for users (not null)
    const accessToken = !user ? crypto.randomBytes(32).toString('hex') : undefined;
    
    // 5. Create subscription in database
    const subscriptionData = {
      subscription: planType,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: stripeCustomerId,
      status: subscription.status,
      startDate: new Date(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      ...(accessToken && { accessToken }), // Only include accessToken if it exists
      ...(user ? { user: user.id } : { guestEmail: email })
    };

    const newSubscription = await Subscription.create(subscriptionData);

    // 6. Update user if logged in
    if (user) {
      await User.findByIdAndUpdate(user.id, {
        $set: { subscription: newSubscription._id },
        $inc: { points: PLANS[planType].points },
      });
    }

    console.log('Preparing to send receipt email with data:', {
      subscription: planType,
      price: PLANS[planType].price,
      pointsAwarded: PLANS[planType].points,
      features: PLANS[planType].features,
      startDate: subscriptionData.startDate,
      accessToken: accessToken
    });

    // 7. Send receipt email
    try {
      await sendSubscriptionReceipt({
        subscription: planType,
        price: PLANS[planType].price,
        pointsAwarded: PLANS[planType].points,
        features: PLANS[planType].features,
        startDate: subscriptionData.startDate,
        accessToken: accessToken
      }, email, !user);
      console.log('Receipt email sent successfully');
    } catch (emailError) {
      console.error('Failed to send receipt email:', emailError);
      // Don't throw error, continue with response
    }

    // 8. Handle response
    if (subscription.latest_invoice.payment_intent) {
      return res.json({
        subscription: newSubscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.latest_invoice.payment_intent.status,
      });
    }

    res.json({
      subscription: newSubscription,
      status: 'succeeded'
    });

  } catch (error) {
    console.error('Failed to handle subscription success:', error);
    res.status(500).json({ error: 'Failed to complete subscription process' });
  }
};


export const handleWebhook = async (event) => {
  let subscription;

  switch (event.type) {
    case 'invoice.paid':
      // Just update subscription status and period
      invoice = event.data.object;
      subscription = await Subscription.findOne({ 
        stripeSubscriptionId: invoice.subscription 
      });

      if (subscription) {
        subscription.status = 'active';
        subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);
        subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
        await subscription.save();
      }
      break;

    case 'invoice.payment_failed':
      // Just mark subscription as past due
      invoice = event.data.object;
      subscription = await Subscription.findOne({ 
        stripeSubscriptionId: invoice.subscription 
      });

      if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();
      }
      break;

    case 'customer.subscription.updated':
      // Sync any subscription updates from Stripe
      const stripeSubscription = event.data.object;
      subscription = await Subscription.findOne({ 
        stripeSubscriptionId: stripeSubscription.id 
      });

      if (subscription) {
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
        await subscription.save();
      }
      break;

    case 'customer.subscription.deleted':
      // Just mark subscription as cancelled in our database
      subscription = event.data.object;
      const dbSubscription = await Subscription.findOne({ 
        stripeSubscriptionId: subscription.id 
      });

      if (dbSubscription) {
        dbSubscription.status = 'cancelled';
        dbSubscription.endDate = new Date();
        await dbSubscription.save();
      }
      break;
  }

  return { received: true };
};
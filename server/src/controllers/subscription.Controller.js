// controllers/subscription.controller.js
import Stripe from 'stripe';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';
import { sendSubscriptionReceipt } from '../services/email.service.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

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

// Updated getCurrentSubscription controller
export const getCurrentSubscription = async (req, res) => {
  try {
    let subscription;

    if (req.user) {
      // For logged-in users
      const user = await User.findById(req.user.id).populate('subscription');
      subscription = user.subscription;
    } else {
      // For guest users with access token
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required for guest access' });
      }

      subscription = await Subscription.findOne({ 
        accessToken,
        status: 'active' // Only return active subscriptions
      });

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found for this access token' });
      }
    }

    // Return subscription data (or null if none found)
    res.json(subscription || null);
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
      // For logged-in users: Find an ACTIVE subscription for the user
      subscription = await Subscription.findOne({ 
        user: req.user.id, 
        status: 'active' // Ensure the subscription is active
      });
    } else {
      // For guest users: Find an ACTIVE subscription using the access token
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token required for guest users' });
      }
      subscription = await Subscription.findOne({ 
        accessToken, 
        status: 'active' // Ensure the subscription is active
      });
    }

    // If no ACTIVE subscription is found, return an error
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    console.log('Active subscription found:', subscription);
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
      subscription = await Subscription.findOne({ 
        user: req.user.id, 
        status: 'active' // Ensure the subscription is active
      });
    } else if (accessToken) {
      subscription = await Subscription.findOne({ 
        accessToken, 
        status: 'active' // Ensure the subscription is active
      });
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
        await User.findByIdAndUpdate(subscription.user, {
          $inc: { points: -pointsToRemove },
        });
      }
    }

    // Remove the subscription reference from the user (if logged in)
    if (req.user && subscription.user) {
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
    res.status(500).json({ error: 'Failed to complete subscription process' });
  }
};

export const handleWebhook = async (event) => {
  try {
    logger.info(`Received Stripe webhook event: ${event.type}`, {
      eventId: event.id,
      timestamp: new Date().toISOString(),
      rawEvent: JSON.stringify(event)
    });

    switch (event.type) {
      case 'invoice.created':
        logger.info('Draft invoice created', event.data.object);
        break;

      case 'invoice.finalized':
        logger.info('Invoice finalized', event.data.object);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        logger.info('Invoice payment succeeded', {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
          customerEmail: invoice.customer_email
        });
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        logger.info('Payment intent succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount
        });
        break;

      // ... other existing cases ...

      default:
        logger.warn(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    logger.error('Webhook handling error', {
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

export const assignCoach = async (req, res) => {
  // Maximum number of retries for transaction
  const MAX_RETRIES = 3;
  let retryCount = 0;

  async function attemptAssignment() {
    const session = await mongoose.startSession();
    try {
      const { coachId } = req.body;
      let subscription;
      let clientName;
      let clientEmail;

      // Find subscription with proper locking
      const subscriptionQuery = req.user ? 
        { user: req.user.id, status: 'active' } : 
        { accessToken: req.query.accessToken, status: 'active' };

      session.startTransaction();

      subscription = req.user ?
        await Subscription.findOne(subscriptionQuery)
          .populate('user', 'firstName lastName email')
          .session(session) :
        await Subscription.findOne(subscriptionQuery)
          .session(session);

      if (!subscription) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Set client details
      if (req.user) {
        clientName = `${subscription.user.firstName} ${subscription.user.lastName}`;
        clientEmail = subscription.user.email;
      } else {
        clientName = 'Guest User';
        clientEmail = subscription.guestEmail;
      }

      // Verify coach with locking
      const coach = await User.findOne({
        _id: coachId,
        role: 'coach',
        isEmailVerified: true,
        coachStatus: { $ne: 'full' }
      }).session(session);

      if (!coach) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Coach not found or unavailable' });
      }

      // Handle previous coach reassignment
      if (subscription.assignedCoach) {
        await User.findByIdAndUpdate(
          subscription.assignedCoach,
          {
            $pull: { coachingSubscriptions: subscription._id },
            $inc: { 'availability.currentClients': -1 }
          },
          { session, new: true }
        );
        subscription.coachAssignmentStatus = 'changed';
      } else {
        subscription.coachAssignmentStatus = 'assigned';
      }

      // Update subscription atomically
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          assignedCoach: coachId,
          coachAssignmentDate: new Date(),
          coachAssignmentStatus: subscription.coachAssignmentStatus
        },
        { session, new: true }
      );

      // Update coach atomically
      const updatedCoach = await User.findByIdAndUpdate(
        coachId,
        {
          $addToSet: { coachingSubscriptions: subscription._id },
          $inc: { 'availability.currentClients': 1 }
        },
        { session, new: true }
      );

      // Commit transaction
      await session.commitTransaction();

      // Populate coach details after successful transaction
      await updatedSubscription.populate('assignedCoach', 
        'firstName lastName profileImage bio rating socialLinks specialties');

      return res.json({
        message: 'Coach assigned successfully',
        coach: updatedSubscription.assignedCoach,
        assignmentDate: updatedSubscription.coachAssignmentDate,
        client: {
          name: clientName,
          email: clientEmail,
          subscriptionType: updatedSubscription.subscription,
          startDate: updatedSubscription.startDate
        }
      });

    } catch (error) {
      await session.abortTransaction();

      // Retry logic for write conflicts
      if (error.code === 112 && retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying transaction attempt ${retryCount}...`);
        return attemptAssignment();
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  try {
    await attemptAssignment();
  } catch (error) {
    console.error('Coach assignment error:', error);
    const errorMessage = error.code === 112 ? 
      'Transaction conflict occurred. Please try again.' : 
      'Failed to assign coach';
    res.status(500).json({ error: errorMessage });
  }
};
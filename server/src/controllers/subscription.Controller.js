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
    price: 69.99,
    stripePriceId: 'price_1Qi0q2FGfbnmVSqEiDg7Z4cK',
    points: 200
  },
  elite: {
    name: 'Elite',
    price: 89.99,
    stripePriceId: 'price_1Qi0noFGfbnmVSqEdkYZHCiM',
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

    // Schedule removal of the subscription from the coach's list of clients at the end of the billing period
    const timeUntilEndOfPeriod = subscription.currentPeriodEnd - new Date();
    setTimeout(async () => {
      try {
        // Remove the subscription from the coach's list of clients
        if (subscription.assignedCoach) {
          await User.findByIdAndUpdate(subscription.assignedCoach, {
            $pull: { clients: subscription.user }, // Assuming `clients` is an array of user IDs in the coach's document
          });
        }

        // Optionally, update the subscription status to reflect that it has ended
        subscription.status = 'cancelled';
        subscription.endDate = new Date();
        await subscription.save();
      } catch (error) {
        logger.error('Failed to remove subscription from coach:', error);
      }
    }, timeUntilEndOfPeriod);

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

    // Calculate days since subscription start
    const daysSinceStart = (new Date() - subscription.startDate) / (1000 * 60 * 60 * 24);

    // Refund logic for subscriptions cancelled within 10 days
    if (daysSinceStart <= 10) {
      // Calculate refund amount (40% of the subscription price)
      const plan = PLANS[subscription.subscription];
      const refundAmount = Math.round(plan.price * 0.4 * 100); // Convert to cents

      // Find the latest invoice for this subscription
      const invoices = await stripe.invoices.list({
        subscription: subscription.stripeSubscriptionId,
        limit: 1
      });

      if (invoices.data.length > 0) {
        const latestInvoice = invoices.data[0];
        
        // Create a refund for the invoice
        await stripe.refunds.create({
          charge: latestInvoice.charge,
          amount: refundAmount,
          reason: 'requested_by_customer'
        });
      }
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update the subscription in the database
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await subscription.save();

    // Handle points removal for logged-in users within the first 10 days
    if (req.user && subscription.user) {
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

    // Remove the subscription from the coach's list of clients
    if (subscription.assignedCoach) {
      await User.findByIdAndUpdate(subscription.assignedCoach, {
        $pull: { clients: subscription.user }, // Assuming `clients` is an array of user IDs in the coach's document
      });
    }

    res.json({ 
      message: 'Subscription cancelled successfully',
      refunded: daysSinceStart <= 10
    });

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

    if (subscription.latest_invoice.payment_intent) {
      return res.json({
        subscription: newSubscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.latest_invoice.payment_intent.status,
      });
    }

    // Default response if no payment intent is found
    return res.json({
      subscription: newSubscription,
      status: 'succeeded',
    });
  } catch (error) {
    console.error('Error in handleSubscriptionSuccess:', error);

    // Ensure no response is sent if one has already been sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to complete subscription process' });
    }
  }
};


export const assignCoach = async (req, res) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  async function attemptAssignment() {
    const session = await mongoose.startSession();
    try {
      const { coachId } = req.body;
      let subscription;
      let clientName;
      let clientEmail;

      console.log('Assigning coach:', coachId);
    
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
        coachStatus: 'available',
        payoutSetupComplete: true
      }).session(session);
      

      if (!coach) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Coach not found or unavailable' });
      }

      // Check if the coach's Stripe account is verified
      const account = await stripe.accounts.retrieve(coach.stripeAccountId);
      if (!account.charges_enabled || !account.payouts_enabled) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'Coach has not completed payment setup' });
      }

      // Calculate coach's share (60% of the subscription price)
      const plan = PLANS[subscription.subscription];
      const coachShare = Math.round(plan.price * 0.6 * 100); // Convert to cents

      // Instead of immediate transfer, add to pending earnings
      await User.findByIdAndUpdate(
        coachId,
        {
          $inc: { 'earnings.pendingAmount': coachShare }
        },
        { session }
      );

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

      // Update subscription with coach assignment and payment tracking
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          assignedCoach: coachId,
          coachAssignmentDate: new Date(),
          coachAssignmentStatus: subscription.coachAssignmentStatus,
          coachPaymentDetails: {
            weeklyAmount: coachShare,
            startDate: new Date(),
            lastPayoutDate: null,
            subscriptionPrice: plan.price,
            isRefundable: true // Will be used for 10-day refund window tracking
          }
        },
        { session, new: true }
      );

      // Update coach availability
      const updatedCoach = await User.findByIdAndUpdate(
        coachId,
        {
          $addToSet: { coachingSubscriptions: subscription._id },
          $inc: { 'availability.currentClients': 1 }
        },
        { session, new: true }
      );

      await session.commitTransaction();

      // Populate coach details
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


export const handleWebhook = async (event) => {
  try {
    console.log('Raw Webhook Event:', JSON.stringify(event, null, 2));
    console.log('Webhook Event Type:', event.type);
    console.log('Webhook Event ID:', event.id);
    console.log('Webhook Timestamp:', new Date().toISOString());

    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Find the subscription in the database
        const subscription = await Subscription.findOne({
          stripeSubscriptionId: subscriptionId,
        });

        if (!subscription) {
          console.log('Subscription not found in database:', subscriptionId);
          break;
        }

        // Double-check: Ensure the subscription is marked as active
        if (subscription.status !== 'active') {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscriptionId },
            { 
              status: 'active',
              currentPeriodEnd: new Date(invoice.period_end * 1000),
            }
          );
          console.log(`Subscription ${subscriptionId} marked as active.`);
        }

        if (subscription.user && !invoice.billing_reason !== 'subscription_create') {
          const plan = PLANS[subscription.subscription];
          if (plan && plan.points) {
            // Award points for renewal
            await User.findByIdAndUpdate(subscription.user, {
              $inc: { points: plan.points }
            });

            console.log(`Awarded ${plan.points} renewal points to user ${subscription.user} for ${subscription.subscription} plan`);
          }
        }


        // Double-check: Ensure the coach's pendingAmount is correct
        if (subscription.assignedCoach) {
          const coach = await User.findById(subscription.assignedCoach);
          const plan = PLANS[subscription.subscription];
          const coachShare = Math.round(plan.price * 0.6 * 100); // Convert to cents

          // Verify if the coach's pendingAmount is correct
          if (coach.earnings.pendingAmount < coachShare) {
            await User.findByIdAndUpdate(coach._id, {
              $inc: { 'earnings.pendingAmount': coachShare },
            });
            console.log(`Added $${coachShare / 100} to coach ${coach._id}'s pending earnings.`);
          }
        }
      
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        const failedSubscriptionId = failedInvoice.subscription;

        // Find the subscription in the database
        const failedSubscription = await Subscription.findOne({
          stripeSubscriptionId: failedSubscriptionId,
        });

        if (!failedSubscription) {
          console.log('Subscription not found in database:', failedSubscriptionId);
          break;
        }

        // Double-check: Ensure the subscription is marked as cancelled
        if (failedSubscription.status !== 'cancelled') {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: failedSubscriptionId },
            { 
              status: 'cancelled',
              endDate: new Date(),
            }
          );
          console.log(`Subscription ${failedSubscriptionId} marked as cancelled.`);
        }

        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;

        // Find the subscription in the database
        const dbSubscription = await Subscription.findOne({
          stripeSubscriptionId: deletedSubscription.id,
        });

        if (!dbSubscription) {
          console.log('Subscription not found in database:', deletedSubscription.id);
          break;
        }

        // Double-check: Ensure the subscription is marked as cancelled
        if (dbSubscription.status !== 'cancelled') {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: deletedSubscription.id },
            { 
              status: 'cancelled',
              endDate: new Date(),
            }
          );
          console.log(`Subscription ${deletedSubscription.id} marked as cancelled.`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook Handling Error:', error);
    throw error;
  }
};
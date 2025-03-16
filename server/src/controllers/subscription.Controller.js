// controllers/subscription.controller.js
import Stripe from 'stripe';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';
import { sendSubscriptionReceipt } from '../services/email.service.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getIoInstance, activeUsers } from '../socketServer.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan configurations
const PLANS = {
  basic: {
    name: 'Basic',
    price: 39.99,
    stripePriceId: 'price_1Qj4nqFGfbnmVSqEuxLNYQr2',
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

    console.log('Accessing subscription with token:', token);

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
      // For logged-in users: Find the most recent ACTIVE subscription for the user
      subscription = await Subscription.findOne({ 
        user: req.user.id, 
        status: 'active'
      })
      .sort({ startDate: -1 }) // Sort by startDate in descending order
      .exec();
    } else {
      // For guest users: Find the most recent ACTIVE subscription using the access token
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token required for guest users' });
      }
      subscription = await Subscription.findOne({ 
        accessToken, 
        status: 'active'
      })
      .sort({ startDate: -1 }) // Sort by startDate in descending order
      .exec();
    }

    // If no ACTIVE subscription is found, return an error
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json({
      completed: subscription.hasCompletedQuestionnaire,
      completedAt: subscription.questionnaireCompletedAt,
      data: subscription.questionnaireData,
      subscriptionStartDate: subscription.startDate // Added for verification
    });

  } catch (error) {
    logger.error('Error fetching questionnaire status:', error);
    res.status(500).json({ error: 'Failed to fetch questionnaire status' });
  }
};

export const submitQuestionnaire = async (req, res) => {
  try {
    const { answers, accessToken } = req.body;
    let subscription;

    if (req.user) {
      // For logged-in users: Find the most recent ACTIVE subscription
      subscription = await Subscription.findOne({ 
        user: req.user.id, 
        status: 'active'
      })
      .sort({ startDate: -1 }) // Sort by startDate in descending order
      .exec();
    } else if (accessToken) {
      // For guest users: Find the most recent ACTIVE subscription
      subscription = await Subscription.findOne({ 
        accessToken, 
        status: 'active'
      })
      .sort({ startDate: -1 }) // Sort by startDate in descending order
      .exec();
    } else {
      return res.status(400).json({ error: 'Access token required for guest users' });
    }

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Log the subscription being updated
    console.log('Updating questionnaire for subscription:', {
      id: subscription._id,
      startDate: subscription.startDate,
      status: subscription.status
    });

    // Update questionnaire data
    subscription.hasCompletedQuestionnaire = true;
    subscription.questionnaireData = answers;
    subscription.questionnaireCompletedAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Questionnaire completed successfully',
      subscriptionStartDate: subscription.startDate // Added for verification
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

    // Calculate the end date as one month after the start date
    const endDate = new Date(subscription.startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Cancel the subscription in Stripe but allow it to run until the end of the current period
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update the subscription in the database
    subscription.cancelAtPeriodEnd = true;
    subscription.endDate = endDate; // Set the end date to one month after the start date
    await subscription.save();

    res.json({
      message: 'Recurring payments have been cancelled. You will retain access until the end of the current billing period.',
      endDate: endDate,
    });
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

    // Check if the subscription belongs to the logged-in user
    if (req.user && subscription.user?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to cancel this subscription' });
    }

    // Check if the subscription is eligible for a refund
    const isRefundEligible = subscription.isEligibleForRefund();

    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (isRefundEligible) {
        // Immediately cancel the subscription in Stripe
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

        // Update subscription in database
        subscription.status = 'cancelled';
        subscription.endDate = new Date();

       // Retrieve the latest invoice ID for the subscription
       const subscriptionDetails = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
       const latestInvoiceId = subscriptionDetails.latest_invoice;

       if (!latestInvoiceId) {
         throw new Error('Latest invoice not found for the subscription');
       }

       // Retrieve the latest invoice details
       const latestInvoice = await stripe.invoices.retrieve(latestInvoiceId);

       // Ensure the latest invoice has a payment intent
       if (!latestInvoice.payment_intent) {
         throw new Error('Payment intent not found for the latest invoice');
       }

       // Process a 40% refund
       const plan = PLANS[subscription.subscription];
       const refundAmount = Math.round(plan.price * 0.4 * 100); // 40% of the plan's price in cents

       // Create a refund in Stripe
       const refund = await stripe.refunds.create({
         payment_intent: latestInvoice.payment_intent, // Use the payment intent from the latest invoice
         amount: refundAmount,
         reason: 'requested_by_customer',
       });

       console.log('Refund processed:', {
         refundId: refund.id,
         amount: refundAmount,
         subscriptionId: subscription._id,
       });
     } else {
        // Mark subscription for cancellation at period end
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        subscription.cancelAtPeriodEnd = true;
      }

      // Remove points from the user only if the cancellation is refund-eligible
      if (isRefundEligible) {
        const userUpdate = {
          $unset: { subscription: 1 },
          $inc: { points: -PLANS[subscription.subscription].points },
        };

        await User.findByIdAndUpdate(subscription.user, userUpdate, { session });
      } else {
        // Only remove the subscription reference if the cancellation is not refund-eligible
        const userUpdate = {
          $unset: { subscription: 1 },
        };

        await User.findByIdAndUpdate(subscription.user, userUpdate, { session });
      }


      // Update coach metrics
      if (subscription.assignedCoach) {
        console.log(`Subscription ${subscription._id} cancelled - Refund: ${isRefundEligible}`);

        const coach = await User.findById(subscription.assignedCoach).session(session);
        if (coach) {
          const updatedSubscriptions = coach.coachingSubscriptions.filter(
            (subId) => subId.toString() !== subscription._id.toString()
          );

          // Calculate the refund amount (one-third of the plan's value)
          const plan = PLANS[subscription.subscription];
          const refundAmount = Math.round(plan.price * 100 * 0.3); // Convert to cents for Stripe

          // Update coach's pendingAmount if refund is eligible
          const coachUpdate = {
            coachingSubscriptions: updatedSubscriptions,
            'availability.currentClients': updatedSubscriptions.length,
            coachStatus: updatedSubscriptions.length >= coach.availability.maxClients ? 'full' : 'available',
          };

          if (isRefundEligible) {
            coachUpdate.$inc = { 'earnings.pendingAmount': -refundAmount };
          }

          await User.findByIdAndUpdate(subscription.assignedCoach, coachUpdate, { session });
          console.log(`Updated coach ${coach._id} metrics - Current clients: ${updatedSubscriptions.length}`);
        }
      }

      await subscription.save({ session });

      await session.commitTransaction();

      res.json({
        message: isRefundEligible
          ? 'Subscription cancelled successfully. Refund will be processed shortly.'
          : 'Subscription will be cancelled at the end of the current billing period.',
        refunded: isRefundEligible,
        endDate: isRefundEligible ? new Date() : subscription.currentPeriodEnd,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error('Failed to cancel subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const handleSubscriptionSuccess = async (req, res) => {
  const session = await mongoose.startSession();
  let result = null;

  try {
    const { planType, paymentMethodId, email } = req.body;

    if (!planType || !paymentMethodId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('handleSubscriptionSuccess called for:', {
      planType,
      email,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });

    let user = null;
    let stripeCustomerId = null;

    result = await session.withTransaction(async () => {
      // Check for existing active subscription to prevent duplicates
      if (req.user) {
        const existingSubscription = await Subscription.findOne({
          user: req.user.id,
          status: 'active',
          stripeSubscriptionId: { $exists: true },
          createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
        }).session(session);

        if (existingSubscription) {
          console.log('Duplicate subscription detected:', existingSubscription.id);
          return {
            subscription: existingSubscription,
            status: 'succeeded',
            duplicate: true
          };
        }

        user = req.user;
        stripeCustomerId = user.stripeCustomerId;
      } else {
        const existingSubscription = await Subscription.findOne({
          guestEmail: email,
          status: 'active',
          stripeSubscriptionId: { $exists: true },
          createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
        }).session(session);

        if (existingSubscription) {
          console.log('Duplicate guest subscription detected:', existingSubscription.id);
          return {
            subscription: existingSubscription,
            status: 'succeeded',
            duplicate: true
          };
        }

        const customer = await stripe.customers.create({
          email,
        });
        stripeCustomerId = customer.id;
      }

      // Stripe operations
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: PLANS[planType].stripePriceId }],
        payment_behavior: 'error_if_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { planType },
      });

      const accessToken = !user ? crypto.randomBytes(32).toString('hex') : undefined;

      const subscriptionData = {
        subscription: planType,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: stripeCustomerId,
        status: subscription.status,
        startDate: new Date(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        pointsAwarded: false, // Initialize pointsAwarded as false
        ...(accessToken && { accessToken }),
        ...(user ? { user: user.id } : { guestEmail: email })
      };

      const newSubscription = await Subscription.create([subscriptionData], { session });
      const createdSubscription = newSubscription[0];

      console.log('New subscription created:', {
        id: createdSubscription._id,
        points: PLANS[planType].points
      });

      if (user && !createdSubscription.pointsAwarded) {
        await User.findByIdAndUpdate(
          user.id,
          {
            $set: { subscription: createdSubscription._id },
            $inc: { points: PLANS[planType].points }
          },
          { session }
        );

        // Mark points as awarded
        await Subscription.findByIdAndUpdate(
          createdSubscription._id,
          { pointsAwarded: true },
          { session }
        );

        console.log('Points awarded for user:', {
          userId: user.id,
          pointsAwarded: PLANS[planType].points,
          subscriptionId: createdSubscription._id,
          timestamp: new Date().toISOString()
        });
      }

      return {
        subscription: createdSubscription,
        ...(subscription.latest_invoice.payment_intent && {
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          status: subscription.latest_invoice.payment_intent.status,
        }),
        status: 'succeeded'
      };
    });

    // Send receipt email after transaction commits
    if (result && !result.duplicate) {
      try {
        await sendSubscriptionReceipt({
          subscription: planType,
          price: PLANS[planType].price,
          pointsAwarded: PLANS[planType].points,
          features: PLANS[planType].features,
          startDate: result.subscription.startDate,
          accessToken: result.subscription.accessToken
        }, email, !user);
        console.log('Receipt email sent successfully');
      } catch (emailError) {
        console.error('Failed to send receipt email:', emailError);
      }
    }

    // Send response after transaction commits
    if (result) {
      res.json(result);
    } else {
      throw new Error('Transaction failed to return result');
    }

  } catch (error) {
    console.error('Error in handleSubscriptionSuccess:', error);
    await session.abortTransaction();

    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to complete subscription process' });
    }
  } finally {
    session.endSession();
  }
};


export const assignCoach = async (req, res) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let stripeAccountVerified = false;
  let coachShare = 0;

  // Verify Stripe account outside the retry loop
  async function verifyStripeAccount(coach) {
    try {
      const account = await stripe.accounts.retrieve(coach.stripeAccountId);
      return account.charges_enabled && account.payouts_enabled;
    } catch (error) {
      console.error('Stripe account verification error:', error);
      return false;
    }
  }

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
          .sort({ startDate: -1 })
          .session(session) :
        await Subscription.findOne(subscriptionQuery)
          .sort({ startDate: -1 })
          .session(session);

      if (!subscription) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'No active subscription found' });
      }

      if (req.user) {
        clientName = `${subscription.user.firstName} ${subscription.user.lastName}`;
        clientEmail = subscription.user.email;
      } else {
        clientName = 'Guest User';
        clientEmail = subscription.guestEmail;
      }

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

      // Only verify Stripe account on first attempt
      if (retryCount === 0) {
        stripeAccountVerified = await verifyStripeAccount(coach);
        if (!stripeAccountVerified) {
          await session.abortTransaction();
          return res.status(400).json({ error: 'Coach has not completed payment setup' });
        }

        // Calculate coach's share only once
        const plan = PLANS[subscription.subscription];
        coachShare = Math.round(plan.price * 0.6 * 100);
        console.log('Coach share calculated to give to coach:', coachShare);
      }

      // Proceed with MongoDB transaction
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

      // Update coach earnings only if this is the first attempt
      if (retryCount === 0) {
        await User.findByIdAndUpdate(
          coachId,
          {
            $inc: { 'earnings.pendingAmount': coachShare }
          },
          { session }
        );
      }

      const plan = PLANS[subscription.subscription];
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
            isRefundable: true
          }
        },
        { session, new: true }
      );

      const updatedCoach = await User.findByIdAndUpdate(
        coachId,
        {
          $addToSet: { coachingSubscriptions: subscription._id },
          $inc: { 'availability.currentClients': 1 }
        },
        { session, new: true }
      );

      await session.commitTransaction();

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

    switch (event.type) {
    
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object;
        console.log('Subscription deleted event:', deletedSubscription);
      
        const dbSubscription = await Subscription.findOne({
          stripeSubscriptionId: deletedSubscription.id,
        });
      
        if (!dbSubscription) {
          console.error('Subscription not found in database:', deletedSubscription.id);
          return;
        }
      
        console.log('Database subscription:', dbSubscription);
      
        const session = await mongoose.startSession();
        session.startTransaction();
      
        try {
          const isRefundEligible = dbSubscription.isEligibleForRefund();
          console.log('Refund eligible:', isRefundEligible);
      
      
          // Handle coach updates - only remove from client list, don't adjust earnings
          if (dbSubscription.assignedCoach) {
            const coach = await User.findById(dbSubscription.assignedCoach);
            if (coach) {
              const updatedSubscriptions = coach.coachingSubscriptions.filter(
                (subId) => subId.toString() !== dbSubscription._id.toString()
              );
      
              // Only update subscription list and client count, not earnings
              const coachUpdate = {
                coachingSubscriptions: updatedSubscriptions,
                'availability.currentClients': updatedSubscriptions.length,
                coachStatus: updatedSubscriptions.length >= coach.availability.maxClients ? 'full' : 'available',
              };
      
              await User.findByIdAndUpdate(dbSubscription.assignedCoach, coachUpdate, { session });
              console.log(`Updated coach ${coach._id} subscription list`);
            }
          }
      
          // For users, only remove the subscription reference
          if (dbSubscription.user) {
            const userUpdate = {
              $unset: { subscription: 1 }, // Only remove the subscription reference
            };
      
            await User.findByIdAndUpdate(dbSubscription.user, userUpdate, { session });
            console.log(`Removed subscription reference for user ${dbSubscription.user}`);
          }
      
          // Just update subscription status
          dbSubscription.status = 'cancelled';
          dbSubscription.endDate = new Date();
          await dbSubscription.save({ session });
      
          await session.commitTransaction();
          console.log('Webhook cleanup completed successfully');
      
        } catch (error) {
          await session.abortTransaction();
          console.error('Webhook transaction failed:', error);
          throw error;
        } finally {
          session.endSession();
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook Handling Error:', error);
    throw error;
  }
};

export const messaging = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { subscriptionId } = req.params;
    const { senderId, receiverId, content, timestamp, file } = req.body;

    console.log('Received message request:', {
      subscriptionId,
      senderId,
      receiverId,
      timestamp,
      hasContent: !!content,
      hasFiles: Array.isArray(file) ? file.length : 0
    });

    // Validate required fields
    if (!subscriptionId || !senderId || !receiverId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(subscriptionId) || 
        !mongoose.Types.ObjectId.isValid(senderId) || 
        !mongoose.Types.ObjectId.isValid(receiverId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    // Validate timestamp
    let parsedTimestamp;
    try {
      parsedTimestamp = timestamp ? new Date(timestamp) : new Date();
      if (isNaN(parsedTimestamp.getTime())) {
        throw new Error('Invalid timestamp format');
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid timestamp format' });
    }

    // Create the message object with a unique _id
    const message = {
      _id: new mongoose.Types.ObjectId(), // Generate a unique _id
      sender: new mongoose.Types.ObjectId(senderId),
      content: content?.trim() || '', // Optional content (default to empty string)
      timestamp: parsedTimestamp,
      read: false, // Initially unread
      file: Array.isArray(file) ? file.map((fileItem) => {
        // Handle file type
        let fileType = 'unknown';
        if (fileItem.type) {
          fileType = fileItem.type;
        } else if (fileItem.path) {
          // Try to infer type from path if needed
          const path = fileItem.path.toLowerCase();
          if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif')) {
            fileType = 'image';
          } else if (path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.avi')) {
            fileType = 'video';
          }
        }
        return {
          path: fileItem.path, // File path
          type: fileType, // File type
        };
      }) : [],
    };

    // Find the subscription and update it with the new message
    const subscription = await Subscription.findById(subscriptionId).session(session);
    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Add the message to the subscription's messages array
    subscription.messages.push(message);
    
    // Make sure messages are sorted by timestamp
    subscription.messages.sort((a, b) => a.timestamp - b.timestamp);

    // Save the updated subscription
    await subscription.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // Get populated subscription (can be done outside the transaction)
    const populatedSubscription = await Subscription.findById(subscriptionId)
      .populate('user', 'firstName lastName email profileImage')
      .populate('assignedCoach', 'firstName lastName email profileImage');

    // Return the updated subscription
    res.status(200).json(populatedSubscription);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { subscriptionId } = req.params;
    const { messageIds } = req.body;
    
    // Get the reader's ID (either from the token or the request body)
    const readerId = req.user?.id || req.body.readerId;

    // Validate required fields
    if (!subscriptionId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid subscription ID format' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId).session(session);
    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Get the sender IDs of the messages being marked as read
    const senderIds = new Set();
    const validMessageIds = [];
    
    // Verify message IDs and collect sender information
    for (const id of messageIds) {
      // Skip invalid IDs
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn(`Invalid message ID format: ${id}`);
        continue;
      }
      
      validMessageIds.push(id);
      
      // Find the message in the subscription
      const message = subscription.messages.find(m => m._id.toString() === id);
      
      // If message exists and has a sender, add it to the set
      if (message && message.sender) {
        senderIds.add(message.sender.toString());
      }
    }

    // Count how many messages were updated
    let updatedCount = 0;
    const now = new Date();

    // Update the 'read' status of each message
    subscription.messages = subscription.messages.map(msg => {
      const msgId = msg._id.toString();
      if (validMessageIds.includes(msgId) && !msg.read) {
        updatedCount++;
        return { 
          ...msg.toObject(),
          read: true, 
          readAt: now 
        };
      }
      return msg;
    });

    // Reset the appropriate unread counter if reader ID is provided
    if (readerId) {
      // If reader is the user, reset user's unread count
      if (subscription.user && readerId === subscription.user.toString()) {
        if (subscription.unreadCounts) {
          subscription.unreadCounts.user = 0;
        }
      } 
      // If reader is the coach, reset coach's unread count
      else if (subscription.assignedCoach && readerId === subscription.assignedCoach.toString()) {
        if (subscription.unreadCounts) {
          subscription.unreadCounts.coach = 0;
        }
      }
    }

    // Only save if changes were made
    if (updatedCount > 0) {
      await subscription.save({ session });
      logger.info(`Marked ${updatedCount} messages as read in subscription ${subscriptionId}`);
    } else {
      logger.info('No messages needed to be marked as read');
    }

    await session.commitTransaction();
    session.endSession();

    // Send immediate response for better UX
    res.status(200).json({ 
      message: 'Messages marked as read', 
      updatedCount,
      subscriptionId
    });
    
    // After database update is committed, emit socket events
    try {
      // Determine the receiver of the read receipts
      let receiversToNotify = Array.from(senderIds);
      
      // Filter out the reader from recipients (no need to notify yourself)
      if (readerId) {
        receiversToNotify = receiversToNotify.filter(id => id !== readerId);
      }
      
      const io = getIoInstance();
      if (io && receiversToNotify.length > 0) {
        // Log for debugging
        logger.info(`Sending read receipts via socket to: ${receiversToNotify.join(', ')}`);
        
        for (const receiverId of receiversToNotify) {
          const receiverSocketId = activeUsers.get(receiverId);
          
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('messagesRead', {
              subscriptionId,
              messageIds: validMessageIds,
              readerId,
              timestamp: now.toISOString()
            });
            logger.info(`Sent read receipt to user ${receiverId} for ${validMessageIds.length} messages`);
          } else {
            logger.info(`User ${receiverId} is offline, read receipts will be delivered later`);
          }
        }
      }
    } catch (socketError) {
      // Don't block the request for socket errors, just log them
      logger.error('Error sending socket notification for read messages:', socketError);
    }
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { limit = 100, offset = 0, unreadOnly = false } = req.query;
    
    // Validate subscription ID
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      return res.status(400).json({ message: 'Invalid subscription ID format' });
    }
    
    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId)
      .select('messages')
      .lean();
      
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    // Extract messages and ensure it's an array
    let messages = subscription.messages || [];
    
    // Filter unread messages if requested
    if (unreadOnly === 'true') {
      messages = messages.filter(msg => !msg.read);
    }
    
    // Sort messages by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination if requested
    if (limit !== 'all') {
      const start = parseInt(offset, 10);
      const end = start + parseInt(limit, 10);
      messages = messages.slice(start, end);
    }
    
    // Return the messages
    res.status(200).json(messages);
    
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Error fetching messages', 
      error: error.message 
    });
  }
};
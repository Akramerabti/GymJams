// services/coachPayouts.js
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import cron from 'node-cron';
import Subscription from '../models/Subscription.js';
import { sendSubscriptionEndEmail } from './email.service.js';


export const processWeeklyCoachPayouts = async () => {
  try {
    // Find all coaches with pending earnings
    const coaches = await User.find({
      role: 'coach',
      'earnings.pendingAmount': { $gt: 0 },
      stripeAccountId: { $exists: true }
    });

    for (const coach of coaches) {
      try {
        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: coach.earnings.pendingAmount,
          currency: 'cad',
          destination: coach.stripeAccountId,
          description: `Weekly coach payout for ${new Date().toLocaleDateString()}`
        });

        await User.findByIdAndUpdate(coach._id, {
          $inc: {
            'earnings.totalEarned': coach.earnings.pendingAmount,
            'earnings.pendingAmount': -coach.earnings.pendingAmount
          },
          $set: { 'earnings.lastPayout': new Date() },
          $push: {
            'earnings.payoutHistory': {
              amount: coach.earnings.pendingAmount,
              date: new Date(),
              stripeTransferId: transfer.id,
              subscriptions: coach.coachingSubscriptions
            }
          }
        });

        logger.info(`Successfully processed payout for coach ${coach._id}`);
      } catch (error) {
        logger.error(`Failed to process payout for coach ${coach._id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Weekly coach payout processing failed:', error);
    throw error;
  }
};

export const cleanupSubscriptions = async () => {
  try {
    // Find all expired or cancelled subscriptions that still have assigned coaches
    const expiredSubscriptions = await Subscription.find({
      assignedCoach: { $ne: null },
      $or: [
        { status: { $ne: 'active' } },
        { currentPeriodEnd: { $lt: new Date() } }
      ]
    });

    // Group subscriptions by coach
    const coachesSubs = {};
    const subscriptionsToNotify = [];
    
    expiredSubscriptions.forEach(sub => {
      if (!coachesSubs[sub.assignedCoach]) {
        coachesSubs[sub.assignedCoach] = [];
      }
      coachesSubs[sub.assignedCoach].push(sub._id);
      
      // Check if this subscription just expired and needs an email notification
      const isJustExpired = sub.status === 'active' && sub.currentPeriodEnd < new Date();
      if (isJustExpired) {
        subscriptionsToNotify.push(sub);
      }
    });

    // Send emails for newly expired subscriptions
    for (const subscription of subscriptionsToNotify) {
      try {
        // Update subscription status first
        subscription.status = 'cancelled';
        subscription.endDate = new Date();
        await subscription.save();
        
        // Determine email and guest status
        let userEmail = null;
        let isGuest = false;

        if (subscription.user) {
          // For registered users, get email from user object
          const user = await User.findById(subscription.user);
          userEmail = user?.email;
        } else {
          // For guest subscriptions, get email from the subscription
          userEmail = subscription.guestEmail;
          isGuest = true;
        }

        // Send subscription end email
        if (userEmail) {
          await sendSubscriptionEndEmail({
            subscription: subscription.subscription,
            startDate: subscription.startDate,
            accessToken: subscription.accessToken
          }, userEmail, 'expired', isGuest);
          
          logger.info(`Sent expiration email to ${userEmail} for subscription ${subscription._id}`);
        }
      } catch (emailError) {
        logger.error(`Failed to send expiration email for subscription ${subscription._id}:`, emailError);
      }
    }

    // Update each affected coach
    for (const [coachId, expiredSubs] of Object.entries(coachesSubs)) {
      const coach = await User.findById(coachId);
      if (coach) {
        // Remove expired subscriptions from coach's list
        coach.coachingSubscriptions = coach.coachingSubscriptions.filter(
          subId => !expiredSubs.includes(subId)
        );
        
        // Update counts and status
        coach.availability.currentClients = coach.coachingSubscriptions.length;
        coach.coachStatus = coach.coachingSubscriptions.length >= coach.availability.maxClients 
          ? 'full' 
          : 'available';
        
        await coach.save();
        
        logger.info(`Updated coach ${coachId}: removed ${expiredSubs.length} expired subscriptions`);
      }
    }
  } catch (error) {
    logger.error('Error during subscription cleanup:', error);
  }
};

export const cleanupCoachSubscriptions = async () => {
  try {
    
    const coaches = await User.find({ 
      role: 'coach',
      coachingSubscriptions: { $exists: true, $ne: [] }
    });
    
    for (const coach of coaches) {

      const activeSubscriptions = await Subscription.find({
        _id: { $in: coach.coachingSubscriptions },
        status: 'active'
      }).select('_id user guestEmail subscription');
      
      activeSubscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. ${sub._id} - ${sub.subscription} plan - ${sub.user ? 'Registered user' : 'Guest'}`);
      });
      
      const activeIds = activeSubscriptions.map(sub => sub._id);
      const removedCount = coach.coachingSubscriptions.length - activeIds.length;
      
      if (removedCount > 0) {

        const inactiveIds = coach.coachingSubscriptions.filter(id => 
          !activeIds.some(activeId => activeId.toString() === id.toString())
        );
        
        await User.findByIdAndUpdate(coach._id, {
          coachingSubscriptions: activeIds,
          'availability.currentClients': activeIds.length,
          coachStatus: activeIds.length >= coach.availability.maxClients ? 'full' : 'available'
        });

      } else {
        console.log(`✅ Coach ${coach._id} subscription list is already clean`);
      }
    }
    
    console.log('\n🎉 Coach subscription cleanup completed!');
    
    // Return summary
    return {
      coachesProcessed: coaches.length,
      message: 'Cleanup completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error during coach subscription cleanup:', error);
    throw error;
  }
};

// Add route to trigger cleanup manually
export const triggerCleanup = async (req, res) => {
  try {
    // Add admin check if needed
    if (req.user.role !== 'admin' && req.user.email !== 'your-admin@email.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await cleanupCoachSubscriptions();
    res.json({
      message: 'Subscription cleanup completed',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual cleanup trigger failed:', error);
    res.status(500).json({ error: 'Failed to cleanup subscriptions' });
  }
};

export const initializeCoachPayouts = () => {
  cron.schedule('0 0 * * 0', async () => {
    try {
      await processWeeklyCoachPayouts();
      logger.info('Weekly coach payouts processed successfully');
    } catch (error) {
      logger.error('Weekly coach payout cron job failed:', error);
    }
  });
};


export const initializeSubcleanupJobs = () => {
  cron.schedule('0 */2 * * *', async () => {
    await cleanupSubscriptions();
    
    try {
      await cleanupCoachSubscriptions();
    } catch (error) {
      logger.error('Coach subscription cleanup failed:', error);
    }
  });
};
// services/coachPayouts.js
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import cron from 'node-cron';

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

        // Update coach earnings record
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

// Initialize weekly cron job
export const initializeCoachPayouts = () => {
  // Run every Sunday at midnight (0 0 * * 0)
  cron.schedule('0 0 * * 0', async () => {
    try {
      await processWeeklyCoachPayouts();
      logger.info('Weekly coach payouts processed successfully');
    } catch (error) {
      logger.error('Weekly coach payout cron job failed:', error);
    }
  });
};
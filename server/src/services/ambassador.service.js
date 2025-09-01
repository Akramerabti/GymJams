// services/ambassador.service.js
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import CommissionTransaction from '../models/CommissionTransaction.js';
import logger from '../utils/logger.js';
import cron from 'node-cron';

/**
 * Process weekly payouts for ambassadors/affiliates
 * This runs weekly and pays out any pending commission amounts
 */
export const processWeeklyAmbassadorPayouts = async () => {
  try {
    // Find all ambassadors or coaches with affiliate earnings pending
    const ambassadors = await User.find({
      role: { $in: ['affiliate', 'coach'] },
      'earnings.pendingAmount': { $gt: 0 },
      payoutSetupComplete: true,
      stripeAccountId: { $exists: true }
    });

    logger.info(`Processing ambassador payouts for ${ambassadors.length} users`);

    for (const ambassador of ambassadors) {
      try {
        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: ambassador.earnings.pendingAmount,
          currency: 'cad',
          destination: ambassador.stripeAccountId,
          description: `Weekly ambassador commission payout for ${new Date().toLocaleDateString()}`
        });

        // Update user record with payout information
        await User.findByIdAndUpdate(ambassador._id, {
          $inc: {
            'earnings.totalEarned': ambassador.earnings.pendingAmount,
            'earnings.pendingAmount': -ambassador.earnings.pendingAmount
          },
          $set: { 'earnings.lastPayout': new Date() },
          $push: {
            'earnings.payoutHistory': {
              amount: ambassador.earnings.pendingAmount,
              date: new Date(),
              stripeTransferId: transfer.id,
              type: 'commission'
            }
          }
        });

        // Update the status of all pending commission transactions to 'paid'
        await CommissionTransaction.updateMany(
          { 
            ambassador: ambassador._id,
            status: 'pending'
          },
          {
            $set: {
              status: 'paid',
              paidAt: new Date()
            }
          }
        );

        logger.info(`Successfully processed payout for ambassador ${ambassador.email} (${ambassador._id}): $${ambassador.earnings.pendingAmount / 100}`);
      } catch (error) {
        logger.error(`Failed to process payout for ambassador ${ambassador.email} (${ambassador._id}):`, error);
      }
    }
  } catch (error) {
    logger.error('Weekly ambassador payout processing failed:', error);
    throw error;
  }
};

/**
 * Initialize cron job for weekly ambassador payouts
 */
export const initializeAmbassadorPayouts = () => {
  // Run every Sunday at midnight
  cron.schedule('0 0 * * 0', async () => {
    try {
      await processWeeklyAmbassadorPayouts();
      logger.info('Weekly ambassador payouts processed successfully');
    } catch (error) {
      logger.error('Weekly ambassador payout cron job failed:', error);
    }
  });
};

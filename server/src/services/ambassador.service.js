// services/ambassador.service.js
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import CommissionTransaction from '../models/CommissionTransaction.js';
import logger from '../utils/logger.js';
import cron from 'node-cron';

/**
 * Process weekly payouts for ambassadors/affiliates/taskforce
 * This runs weekly and pays out any pending commission amounts
 */
export const processWeeklyAmbassadorPayouts = async () => {
  try {
    // Find all ambassadors, coaches, or taskforce members with affiliate earnings pending
    const ambassadors = await User.find({
      role: { $in: ['affiliate', 'coach', 'taskforce'] }, // Added 'taskforce'
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
 * Get all eligible ambassadors (coaches, affiliates, and taskforce members)
 */
export const getAmbassadors = async () => {
  try {
    const ambassadors = await User.find({
      role: { $in: ['affiliate', 'coach', 'taskforce'] }, // Added 'taskforce'
      isActive: true
    }).select('firstName lastName email role payoutSetupComplete stripeAccountId earnings');

    return {
      success: true,
      data: ambassadors
    };
  } catch (error) {
    logger.error('Error fetching ambassadors:', error);
    throw error;
  }
};

/**
 * Get all ambassador codes with populated ambassador data
 */
export const getAllAmbassadorCodes = async () => {
  try {
    const codes = await AmbassadorCode.find({})
      .populate({
        path: 'ambassador',
        select: 'firstName lastName email role payoutSetupComplete'
      })
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: codes
    };
  } catch (error) {
    logger.error('Error fetching ambassador codes:', error);
    throw error;
  }
};

/**
 * Create a new ambassador code
 */
export const createAmbassadorCode = async (codeData) => {
  try {
    // Verify the ambassador exists and has an eligible role
    const ambassador = await User.findById(codeData.ambassadorId);
    if (!ambassador) {
      throw new Error('Ambassador not found');
    }

    if (!['affiliate', 'coach', 'taskforce'].includes(ambassador.role)) {
      throw new Error('User is not eligible to be an ambassador');
    }

    const ambassadorCode = new AmbassadorCode({
      ...codeData,
      ambassador: codeData.ambassadorId
    });

    await ambassadorCode.save();
    
    // Populate the ambassador data for response
    await ambassadorCode.populate('ambassador', 'firstName lastName email role payoutSetupComplete');

    return {
      success: true,
      data: ambassadorCode
    };
  } catch (error) {
    logger.error('Error creating ambassador code:', error);
    throw error;
  }
};

/**
 * Update an existing ambassador code
 */
export const updateAmbassadorCode = async (codeId, updateData) => {
  try {
    // If updating the ambassador, verify they exist and have eligible role
    if (updateData.ambassadorId) {
      const ambassador = await User.findById(updateData.ambassadorId);
      if (!ambassador) {
        throw new Error('Ambassador not found');
      }

      if (!['affiliate', 'coach', 'taskforce'].includes(ambassador.role)) {
        throw new Error('User is not eligible to be an ambassador');
      }

      updateData.ambassador = updateData.ambassadorId;
      delete updateData.ambassadorId;
    }

    const ambassadorCode = await AmbassadorCode.findByIdAndUpdate(
      codeId,
      updateData,
      { new: true }
    ).populate('ambassador', 'firstName lastName email role payoutSetupComplete');

    if (!ambassadorCode) {
      throw new Error('Ambassador code not found');
    }

    return {
      success: true,
      data: ambassadorCode
    };
  } catch (error) {
    logger.error('Error updating ambassador code:', error);
    throw error;
  }
};

/**
 * Delete an ambassador code
 */
export const deleteAmbassadorCode = async (codeId) => {
  try {
    const ambassadorCode = await AmbassadorCode.findByIdAndDelete(codeId);
    
    if (!ambassadorCode) {
      throw new Error('Ambassador code not found');
    }

    return {
      success: true,
      message: 'Ambassador code deleted successfully'
    };
  } catch (error) {
    logger.error('Error deleting ambassador code:', error);
    throw error;
  }
};

/**
 * Toggle ambassador code active status
 */
export const toggleAmbassadorCodeStatus = async (codeId, isActive) => {
  try {
    const ambassadorCode = await AmbassadorCode.findByIdAndUpdate(
      codeId,
      { isActive },
      { new: true }
    ).populate('ambassador', 'firstName lastName email role payoutSetupComplete');

    if (!ambassadorCode) {
      throw new Error('Ambassador code not found');
    }

    return {
      success: true,
      data: ambassadorCode
    };
  } catch (error) {
    logger.error('Error toggling ambassador code status:', error);
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

// Export all functions as default service object
const ambassadorService = {
  processWeeklyAmbassadorPayouts,
  getAmbassadors,
  getAllAmbassadorCodes,
  createAmbassadorCode,
  updateAmbassadorCode,
  deleteAmbassadorCode,
  toggleAmbassadorCodeStatus,
  initializeAmbassadorPayouts
};

export default ambassadorService;
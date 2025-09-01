import mongoose from 'mongoose';
import User from '../models/User.js';
import AmbassadorCode from '../models/AmbassadorCode.js';
import CommissionTransaction from '../models/CommissionTransaction.js';
import logger from '../utils/logger.js';

export const getAmbassadors = async (req, res) => {
  try {
    // Query for ambassadors with complete setup
    const withPayoutQuery = {
      role: { $in: ['affiliate', 'coach'] },
      $and: [
        { payoutSetupComplete: true },
        { stripeAccountId: { $exists: true, $ne: null } },
        { isEmailVerified: true }
      ]
    };

    const ambassadors = await User.find(withPayoutQuery)
      .select('firstName lastName email stripeAccountId payoutSetupComplete role')
      .sort({ role: 1, firstName: 1 });

    // FIXED: Better query for those without complete setup - exclude those who already have complete setup
    const ambassadorIdsWithSetup = ambassadors.map(a => a._id);
    
    const withoutPayoutQuery = {
      role: { $in: ['affiliate', 'coach'] },
      isEmailVerified: true,
      _id: { $nin: ambassadorIdsWithSetup }, 
      $or: [
        { payoutSetupComplete: { $ne: true } },
        { stripeAccountId: { $exists: false } },
        { stripeAccountId: null }
      ]
    };

    const ambassadorsWithoutPayout = await User.countDocuments(withoutPayoutQuery);

    const responseData = {
      success: true,
      data: ambassadors,
      meta: {
        totalAmbassadors: ambassadors.length,
        ambassadorsWithoutPayout,
        roleGroups: {
          coaches: ambassadors.filter(a => a.role === 'coach'),
          affiliates: ambassadors.filter(a => a.role === 'affiliate')
        },
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    logger.error('Error fetching ambassadors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambassadors',
      error: error.message
    });
  }
};

export const getAllAmbassadorCodes = async (req, res) => {
  try {
    const codes = await AmbassadorCode.find({})
      .populate({
        path: 'ambassador',
        select: 'firstName lastName email payoutSetupComplete stripeAccountId role' // Added role
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: codes
    });
  } catch (error) {
    logger.error('Error fetching ambassador codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambassador codes',
      error: error.message
    });
  }
};

export const createAmbassadorCode = async (req, res) => {
  try {
    const { ambassadorId, code, discountPercentage, validFor, maxUses, expiryDate } = req.body;

    if (!ambassadorId || !code || !discountPercentage) {
      return res.status(400).json({
        success: false,
        message: 'Ambassador, code, and discount percentage are required'
      });
    }

    // Check if code already exists
    const existingCode = await AmbassadorCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Code already exists'
      });
    }

    // Verify ambassador exists, has correct role, AND has completed payout setup
    const ambassador = await User.findById(ambassadorId);
    if (!ambassador) {
      return res.status(400).json({
        success: false,
        message: 'Ambassador not found'
      });
    }

    // FIXED: Allow both affiliate and coach roles
    if (!['affiliate', 'coach'].includes(ambassador.role)) {
      return res.status(400).json({
        success: false,
        message: 'User must be an approved ambassador (affiliate or coach)'
      });
    }

    // Check if payout setup is complete
    if (!ambassador.payoutSetupComplete) {
      return res.status(400).json({
        success: false,
        message: 'Ambassador must complete payout setup before codes can be created. Please ask the ambassador to set up their payout information in their profile.'
      });
    }

    // Additional validation - check if Stripe account exists
    if (!ambassador.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Ambassador does not have a valid Stripe account. Please ask them to complete their payout setup.'
      });
    }

    const ambassadorCode = new AmbassadorCode({
      code: code.toUpperCase(),
      ambassador: ambassadorId,
      discountPercentage: parseInt(discountPercentage),
      validFor: validFor === 'all' ? ['all'] : [validFor],
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiryDate: expiryDate || null
    });

    await ambassadorCode.save();
    await ambassadorCode.populate('ambassador', 'firstName lastName email payoutSetupComplete stripeAccountId role');

    logger.info(`[AMBASSADOR] Created code ${ambassadorCode.code} for ${ambassador.role} ${ambassador.email} with confirmed payout setup`);

    res.status(201).json({
      success: true,
      message: 'Ambassador code created successfully',
      data: ambassadorCode
    });
  } catch (error) {
    logger.error('Error creating ambassador code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ambassador code',
      error: error.message
    });
  }
};

export const updateAmbassadorCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.code) {
      updates.code = updates.code.toUpperCase();
      const existingCode = await AmbassadorCode.findOne({ 
        code: updates.code, 
        _id: { $ne: id } 
      });
      
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Code already exists'
        });
      }
    }

    if (updates.validFor && updates.validFor !== 'all') {
      updates.validFor = [updates.validFor];
    } else if (updates.validFor === 'all') {
      updates.validFor = ['all'];
    }

    if (updates.discountPercentage) {
      updates.discountPercentage = parseInt(updates.discountPercentage);
    }
    if (updates.maxUses) {
      updates.maxUses = parseInt(updates.maxUses);
    }

    const ambassadorCode = await AmbassadorCode.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('ambassador', 'firstName lastName email role');

    if (!ambassadorCode) {
      return res.status(404).json({
        success: false,
        message: 'Ambassador code not found'
      });
    }

    logger.info(`[AMBASSADOR] Updated code ${ambassadorCode.code}`);

    res.status(200).json({
      success: true,
      message: 'Ambassador code updated successfully',
      data: ambassadorCode
    });
  } catch (error) {
    logger.error('Error updating ambassador code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambassador code',
      error: error.message
    });
  }
};

export const deleteAmbassadorCode = async (req, res) => {
  try {
    const { id } = req.params;

    const ambassadorCode = await AmbassadorCode.findById(id);
    if (!ambassadorCode) {
      return res.status(404).json({
        success: false,
        message: 'Ambassador code not found'
      });
    }

    await AmbassadorCode.findByIdAndDelete(id);

    logger.info(`[AMBASSADOR] Deleted code ${ambassadorCode.code}`);

    res.status(200).json({
      success: true,
      message: 'Ambassador code deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting ambassador code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ambassador code',
      error: error.message
    });
  }
};

// Toggle ambassador code status (admin/taskforce only)
export const toggleAmbassadorCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const ambassadorCode = await AmbassadorCode.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).populate('ambassador', 'firstName lastName email');

    if (!ambassadorCode) {
      return res.status(404).json({
        success: false,
        message: 'Ambassador code not found'
      });
    }

    logger.info(`[AMBASSADOR] ${isActive ? 'Activated' : 'Deactivated'} code ${ambassadorCode.code}`);

    res.status(200).json({
      success: true,
      message: `Ambassador code ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: ambassadorCode
    });
  } catch (error) {
    logger.error('Error updating ambassador code status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambassador code status',
      error: error.message
    });
  }
};

export const processCommission = async (ambassadorCodeId, orderOrSubscription, type, monthNumber = null) => {
  try {
    const ambassadorCode = await AmbassadorCode.findById(ambassadorCodeId)
      .populate('ambassador', 'payoutSetupComplete stripeAccountId email firstName lastName');
    
    if (!ambassadorCode) {
      throw new Error('Ambassador code not found');
    }

    if (!ambassadorCode.ambassador.payoutSetupComplete || !ambassadorCode.ambassador.stripeAccountId) {
      logger.error(`[COMMISSION ERROR] Ambassador ${ambassadorCode.ambassador.email} does not have payout setup complete. Skipping commission.`);
      throw new Error('Ambassador payout setup not complete - cannot process commission');
    }

    let originalAmount, commissionAmount, relatedId, customerInfo;
    
    if (type === 'coaching_monthly') {
      const PLANS = {
        basic: { price: 39.99 },
        premium: { price: 69.99 },
        elite: { price: 89.99 }
      };
      
      const planPrice = PLANS[orderOrSubscription.subscription]?.price || 0;
      originalAmount = Math.round(planPrice * 100); // in cents
      
      // Calculate commission amount properly - 10% of the price
      const discountAmount = Math.round(planPrice * (ambassadorCode.discountPercentage / 100) * 100); // in cents
      commissionAmount = discountAmount; // The commission equals the discount amount
      
      relatedId = orderOrSubscription._id;
      
      // Fix: For subscription, we need to handle the email differently since user is just an ID reference
      let customerEmail;
      if (orderOrSubscription.guestEmail) {
        // Guest user case
        customerEmail = orderOrSubscription.guestEmail;
      } else if (orderOrSubscription.user) {
        // If we have a user reference, we need to fetch the user to get their email
        const User = mongoose.model('User');
        const userDoc = await User.findById(orderOrSubscription.user);
        customerEmail = userDoc ? userDoc.email : null;
      }
      
      if (!customerEmail) {
        throw new Error('Could not determine customer email for commission transaction');
      }
      
      customerInfo = {
        customer: orderOrSubscription.user,
        customerEmail: customerEmail
      };
    } else {
      // For product purchases - straight commission = discount amount
      originalAmount = orderOrSubscription.totalAmount; // already in cents
      commissionAmount = Math.round(originalAmount * (ambassadorCode.discountPercentage / 100));
      relatedId = orderOrSubscription._id;
      
      // Fix: For product purchases, handle email similarly
      let customerEmail;
      if (orderOrSubscription.guestEmail) {
        // Guest user case
        customerEmail = orderOrSubscription.guestEmail;
      } else if (orderOrSubscription.user) {
        // If we have a user reference, we need to fetch the user to get their email
        const User = mongoose.model('User');
        const userDoc = await User.findById(orderOrSubscription.user);
        customerEmail = userDoc ? userDoc.email : null;
      }
      
      if (!customerEmail) {
        throw new Error('Could not determine customer email for commission transaction');
      }
      
      customerInfo = {
        customer: orderOrSubscription.user,
        customerEmail: customerEmail
      };
    }

    const commission = new CommissionTransaction({
      ambassador: ambassadorCode.ambassador._id,
      ambassadorCode: ambassadorCode._id,
      customer: customerInfo.customer,
      customerEmail: customerInfo.customerEmail,
      type,
      originalAmount,
      discountAmount: commissionAmount,
      commissionAmount,
      orderId: type === 'product_purchase' ? relatedId : null,
      subscriptionId: type === 'coaching_monthly' ? relatedId : null,
      monthNumber,
      status: 'pending'
    });

    await commission.save();

    // Update ambassador code stats
    ambassadorCode.totalUses += 1;
    ambassadorCode.totalCommissionEarned += commissionAmount;
    await ambassadorCode.save();

    // Update the ambassador's pending amount in their earnings object
    await User.findByIdAndUpdate(
      ambassadorCode.ambassador._id,
      {
        $inc: { 'earnings.pendingAmount': commissionAmount }
      }
    );

    logger.info(`[COMMISSION] Created ${type} commission: $${(commissionAmount/100).toFixed(2)} for ${ambassadorCode.code} - Ambassador has verified payout setup, added to pending amount`);
    
    return commission;
  } catch (error) {
    logger.error('Error processing commission:', error);
    throw error;
  }
};

export const clawbackAmbassadorCommissions = async (subscriptionId, ambassadorCodeId) => {
  try {
    logger.info(`[CLAWBACK] Starting commission clawback for subscription ${subscriptionId}`);
    
    // Find all commission transactions for this subscription
    const commissions = await CommissionTransaction.find({
      subscriptionId: subscriptionId,
      ambassadorCode: ambassadorCodeId,
      type: 'coaching_monthly'
    }).populate('ambassador', 'firstName lastName email');

    if (commissions.length === 0) {
      logger.info(`[CLAWBACK] No commissions found for subscription ${subscriptionId}`);
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let totalClawbackAmount = 0;
      const ambassador = commissions[0].ambassador; // All commissions should have same ambassador

      for (const commission of commissions) {
        logger.info(`[CLAWBACK] Processing commission ${commission._id} for month ${commission.monthNumber}, amount: $${(commission.commissionAmount / 100).toFixed(2)}`);
        
        // Only clawback pending commissions (not already paid out)
        if (commission.status === 'pending') {
          totalClawbackAmount += commission.commissionAmount;
          
          // Mark commission as failed/clawed back
          await CommissionTransaction.findByIdAndUpdate(
            commission._id,
            {
              status: 'failed',
              failureReason: 'Subscription cancelled within refund period - commission clawed back',
              clawbackDate: new Date()
            },
            { session }
          );
        } else {
          logger.warn(`[CLAWBACK] Commission ${commission._id} already paid out, cannot clawback`);
        }
      }

      // Remove the clawed back amount from ambassador's pending amount
      if (totalClawbackAmount > 0 && ambassador) {
        await User.findByIdAndUpdate(
          ambassador._id,
          {
            $inc: { 'earnings.pendingAmount': -totalClawbackAmount }
          },
          { session }
        );

        // Also update the ambassador code's total commission earned
        await AmbassadorCode.findByIdAndUpdate(
          ambassadorCodeId,
          {
            $inc: { totalCommissionEarned: -totalClawbackAmount }
          },
          { session }
        );

        logger.info(`[CLAWBACK] Removed $${(totalClawbackAmount / 100).toFixed(2)} from ambassador ${ambassador.firstName} ${ambassador.lastName} (${ambassador.email})`);
      }

      await session.commitTransaction();
      
      logger.info(`[CLAWBACK] Successfully processed clawback for subscription ${subscriptionId}. Total amount: $${(totalClawbackAmount / 100).toFixed(2)}`);
      
      return {
        totalClawbackAmount,
        commissionsProcessed: commissions.length,
        ambassador: `${ambassador?.firstName} ${ambassador?.lastName}`
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    logger.error(`[CLAWBACK] Error processing commission clawback for subscription ${subscriptionId}:`, error);
    throw error;
  }
};

// Also update the handleCoachingRenewalCommission to only pay for first 3 months
export const handleCoachingRenewalCommission = async (subscription, monthNumber) => {
  try {
    // Only pay commission for first 3 months
    if (monthNumber > 3) {
      logger.info(`Subscription ${subscription._id} - Month ${monthNumber}: No ambassador commission (beyond 3 months)`);
      return;
    }

    // Check if this subscription used an ambassador code
    if (!subscription.ambassadorCode) {
      return; // No ambassador code was used
    }

    // Check if commission for this month already exists
    const existingCommission = await CommissionTransaction.findOne({
      subscriptionId: subscription._id,
      type: 'coaching_monthly',
      monthNumber: monthNumber
    });

    if (existingCommission) {
      logger.info(`Commission for month ${monthNumber} already exists for subscription ${subscription._id}`);
      return;
    }

    // Verify the ambassador code is still active and ambassador has payout setup
    const ambassadorCode = await AmbassadorCode.findById(subscription.ambassadorCode)
      .populate('ambassador', 'payoutSetupComplete stripeAccountId firstName lastName email');

    if (!ambassadorCode || !ambassadorCode.isActive) {
      logger.warn(`Ambassador code no longer active for subscription ${subscription._id}`);
      return;
    }

    if (!ambassadorCode.ambassador?.payoutSetupComplete || !ambassadorCode.ambassador?.stripeAccountId) {
      logger.error(`Ambassador ${ambassadorCode.ambassador?.email} does not have complete payout setup for renewal commission`);
      return;
    }

    // Create commission for this month
    await processCommission(ambassadorCode._id, subscription, 'coaching_monthly', monthNumber);
    
    logger.info(`Successfully processed ambassador renewal commission for subscription ${subscription._id}, month ${monthNumber}`);
    
  } catch (error) {
    logger.error('Error handling coaching renewal commission:', error);
  }
};
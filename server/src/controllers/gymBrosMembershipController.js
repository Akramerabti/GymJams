// server/src/controllers/gymBrosMembershipController.js
import GymBrosMembership from '../models/GymBrosMembership.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import User from '../models/User.js';
import { getEffectiveUser } from '../middleware/guestUser.middleware.js';
import { handleError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';
import stripe from '../config/stripe.js';

// Purchase a membership
export const purchaseMembership = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    const { membershipType, paymentMethod, pointsUsed, paymentIntentId, usePoints } = req.body;
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to purchase membership'
      });
    }
    
    // Find the profile
    let profileId;
    let userId = null;
    
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      userId = effectiveUser.userId;
      const profile = await GymBrosProfile.findOne({ userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      profileId = profile._id;
    }
    
    // Check if there's an active membership
    const activeMembership = await GymBrosMembership.findOne({
      profileId,
      isActive: true,
      endDate: { $gt: new Date() }
    });
    
    if (activeMembership) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active membership',
        membership: {
          id: activeMembership._id,
          membershipType: activeMembership.membershipType,
          endDate: activeMembership.endDate,
          remainingDays: activeMembership.remainingDays
        }
      });
    }
    
    // Calculate duration and benefits based on membership type
    let durationDays = 0;
    let amountPaid = 0;
    const benefits = {
        unlimitedLikes: true,
        unlimitedSuperLikes: true,
        profileBoost: 10 // 10x boost for all membership types
      };
    
      switch (membershipType) {
        case 'membership-week':
          durationDays = 7;
          amountPaid = 4.99;
          break;
        case 'membership-month':
          durationDays = 30;
          amountPaid = 14.99;
          break;
        case 'membership-platinum':
          durationDays = 30;
          amountPaid = 24.99;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid membership type'
          });
      }
    
    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Check if user can afford it
    if (paymentMethod === 'points' || usePoints === true) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Guest users cannot use points to purchase memberships'
        });
      }
      
      const user = await User.findById(userId);
      if (!user || user.points < pointsUsed) {
        return res.status(400).json({
          success: false,
          message: 'Not enough points to purchase membership'
        });
      }
      
      // Deduct points
      user.points -= pointsUsed;
      await user.save();
    } else if (paymentMethod === 'stripe') {
      // Verify payment intent if using Stripe
      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required for Stripe payments'
        });
      }
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: 'Payment has not been completed'
          });
        }
      } catch (stripeError) {
        logger.error('Stripe error:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Error verifying payment'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }
    
    // Create membership
    const membership = new GymBrosMembership({
      userId,
      profileId,
      membershipType,
      startDate: new Date(),
      endDate,
      paymentMethod,
      pointsUsed: paymentMethod === 'points' ? pointsUsed : 0,
      amountPaid: paymentMethod === 'stripe' ? amountPaid : 0,
      benefits,
      isActive: true
    });
    
    await membership.save();
    
    // Return the membership
    res.status(201).json({
      success: true,
      message: 'Membership purchased successfully',
      membership: {
        id: membership._id,
        membershipType: membership.membershipType,
        startDate: membership.startDate,
        endDate: membership.endDate,
        benefits: membership.benefits
      }
    });
  } catch (error) {
    logger.error('Error in purchaseMembership:', error);
    handleError(error, req, res);
  }
};

// Get active membership
export const getActiveMembership = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the profile
    let profileId;
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      profileId = profile._id;
    }
    
    // Find active membership
    const membership = await GymBrosMembership.findOne({
      profileId,
      isActive: true,
      endDate: { $gt: new Date() }
    });
    
    if (!membership) {
      return res.json({
        success: true,
        hasMembership: false
      });
    }
    
    // Return membership details
    res.json({
      success: true,
      hasMembership: true,
      membership: {
        id: membership._id,
        membershipType: membership.membershipType,
        startDate: membership.startDate,
        endDate: membership.endDate,
        remainingDays: membership.remainingDays,
        benefits: membership.benefits,
        paymentMethod: membership.paymentMethod
      }
    });
  } catch (error) {
    logger.error('Error in getActiveMembership:', error);
    handleError(error, req, res);
  }
};

// Cancel membership
export const cancelMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the membership
    const membership = await GymBrosMembership.findById(membershipId);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }
    
    // Verify ownership
    let profileId;
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      profileId = profile?._id;
    }
    
    if (!profileId || !membership.profileId.equals(profileId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this membership'
      });
    }
    
    // Cancel the membership but allow it to remain active until end date
    membership.cancellationDate = new Date();
    await membership.save();
    
    // If this was a recurring membership, cancel the subscription
    if (membership.recurringId) {
      try {
        await stripe.subscriptions.update(membership.recurringId, {
          cancel_at_period_end: true
        });
      } catch (stripeError) {
        logger.error('Error cancelling Stripe subscription:', stripeError);
      }
    }
    
    // Return success
    res.json({
      success: true,
      message: 'Membership cancelled successfully. Benefits will remain active until the end date.'
    });
  } catch (error) {
    logger.error('Error in cancelMembership:', error);
    handleError(error, req, res);
  }
};

// Get all membership types with pricing
export const getMembershipTypes = async (req, res) => {
  try {
    // Define membership types and benefits
    const membershipTypes = [
        {
          id: 'membership-week',
          name: 'Weekly Gold',
          description: 'Premium features for 7 days',
          duration: '7 days',
          price: 4.99,
          pointsPrice: 500,
          benefits: {
            unlimitedLikes: true,
            unlimitedSuperLikes: true,
            profileBoost: 10 // 10x profile visibility
          }
        },
        {
          id: 'membership-month',
          name: 'Monthly Gold',
          description: '30 days (Best Value)',
          duration: '30 days',
          price: 14.99,
          pointsPrice: 1500,
          popular: true,
          benefits: {
            unlimitedLikes: true,
            unlimitedSuperLikes: true,
            profileBoost: 10 // 10x profile visibility
          }
        },
        {
          id: 'membership-platinum',
          name: 'Platinum',
          description: 'Extended premium membership',
          duration: '30 days',
          price: 24.99,
          pointsPrice: 2500,
          benefits: {
            unlimitedLikes: true,
            unlimitedSuperLikes: true,
            profileBoost: 10 // 10x profile visibility
          }
        }
      ];
      
    // Return membership types
    res.json({
      success: true,
      membershipTypes
    });
  } catch (error) {
    logger.error('Error in getMembershipTypes:', error);
    handleError(error, req, res);
  }
};

// Get membership history
export const getMembershipHistory = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the profile
    let profileId;
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      profileId = profile._id;
    }
    
    // Get membership history
    const memberships = await GymBrosMembership.find({
      profileId
    }).sort({ startDate: -1 });
    
    // Return membership history
    res.json({
      success: true,
      memberships: memberships.map(membership => ({
        id: membership._id,
        membershipType: membership.membershipType,
        startDate: membership.startDate,
        endDate: membership.endDate,
        isActive: membership.isActive && membership.endDate > new Date(),
        paymentMethod: membership.paymentMethod,
        pointsUsed: membership.pointsUsed,
        amountPaid: membership.amountPaid,
        cancellationDate: membership.cancellationDate
      }))
    });
  } catch (error) {
    logger.error('Error in getMembershipHistory:', error);
    handleError(error, req, res);
  }
};
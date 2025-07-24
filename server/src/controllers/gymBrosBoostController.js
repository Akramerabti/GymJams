// server/src/controllers/gymBrosBoostController.js
import GymBrosBoost from '../models/GymBrosBoost.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosMembership from '../models/GymBrosMembership.js';
import GymBrosFeatureUsage from '../models/GymBrosFeatureUsage.js';
import User from '../models/User.js';
import { getEffectiveUser } from '../middleware/guestUser.middleware.js';
import { handleError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

// Helper function to get active boost
const getActiveBoostForProfile = async (profileId) => {
  try {
    return await GymBrosBoost.findOne({
      profileId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ boostFactor: -1 }); // Get the highest boost factor
  } catch (error) {
    logger.error('Error in getActiveBoostForProfile:', error);
    return null;
  }
};

// Activate a boost
export const activateBoost = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to activate boost'
      });
    }
    
    // Extract request data
    const { boostType, boostFactor, duration, paymentMethod, pointsUsed, amount } = req.body;
    
    // Basic validation
    if (!boostType || !boostFactor || !duration || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required boost parameters'
      });
    }
    
    // Find the profile to boost
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
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    
    // Check for existing active boost
    const activeBoost = await getActiveBoostForProfile(profileId);
    
    if (activeBoost) {
      // If the new boost factor is higher, cancel the old boost and create a new one
      if (boostFactor > activeBoost.boostFactor) {
        activeBoost.isActive = false;
        await activeBoost.save();
      } else {
        return res.status(400).json({
          success: false,
          message: 'A higher boost is already active',
          activeBoost
        });
      }
    }
    
    // Create the new boost
    const boost = new GymBrosBoost({
      profileId,
      userId: effectiveUser.userId || null,
      boostType,
      boostFactor,
      expiresAt,
      paymentMethod,
      pointsUsed: paymentMethod === 'points' ? pointsUsed : 0,
      amountPaid: paymentMethod === 'stripe' ? amount : 0
    });
    
    // If boost is from membership, link it
    if (paymentMethod === 'membership') {
      const membership = await GymBrosMembership.findOne({
        profileId,
        isActive: true,
        endDate: { $gt: new Date() }
      });
      
      if (membership) {
        boost.membershipId = membership._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'No active membership found'
        });
      }
      
      // Track feature usage for membership
      await trackFeatureUsage(profileId, effectiveUser.userId, 'boost', membership._id);
    }
    
    // Save the boost
    await boost.save();
    
    // If using points, update user's points balance
    if (paymentMethod === 'points' && effectiveUser.userId) {
      const user = await User.findById(effectiveUser.userId);
      if (user) {
        user.points -= pointsUsed;
        await user.save();
      }
    }
    
    // Return the created boost
    res.status(201).json({
      success: true,
      message: 'Boost activated successfully',
      boost: {
        id: boost._id,
        boostType,
        boostFactor,
        expiresAt,
        remainingTime: boost.remainingTime
      }
    });
  } catch (error) {
    logger.error('Error in activateBoost:', error);
    handleError(error, req, res);
  }
};

// Get active boosts for a profile
export const getActiveBoosts = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to get boosts'
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
    
    // Find all active boosts
    const boosts = await GymBrosBoost.find({
      profileId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ boostFactor: -1 });
    
    // Return the boosts
    res.json({
      success: true,
      boosts: boosts.map(boost => ({
        id: boost._id,
        boostType: boost.boostType,
        boostFactor: boost.boostFactor,
        expiresAt: boost.expiresAt,
        activatedAt: boost.activatedAt,
        paymentMethod: boost.paymentMethod
      }))
    });
  } catch (error) {
    logger.error('Error in getActiveBoosts:', error);
    handleError(error, req, res);
  }
};

// Cancel a boost
export const cancelBoost = async (req, res) => {
  try {
    const { boostId } = req.params;
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to cancel boost'
      });
    }
    
    // Find the boost
    const boost = await GymBrosBoost.findById(boostId);
    
    if (!boost) {
      return res.status(404).json({
        success: false,
        message: 'Boost not found'
      });
    }
    
    // Verify that the boost belongs to the user
    let profileId;
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      profileId = profile?._id;
    }
    
    if (!profileId || !boost.profileId.equals(profileId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this boost'
      });
    }
    
    // Mark the boost as inactive
    boost.isActive = false;
    await boost.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Boost cancelled successfully'
    });
  } catch (error) {
    logger.error('Error in cancelBoost:', error);
    handleError(error, req, res);
  }
};

// Track feature usage for membership benefits
const trackFeatureUsage = async (profileId, userId, featureType, membershipId) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate reset date
    const resetDate = new Date();
    if (featureType === 'superlike') {
      // Reset daily
      resetDate.setDate(resetDate.getDate() + 1);
    } else if (featureType === 'boost') {
      // Reset weekly
      resetDate.setDate(resetDate.getDate() + 7);
    }
    resetDate.setHours(0, 0, 0, 0);
    
    // Find existing usage record for today
    let usage = await GymBrosFeatureUsage.findOne({
      profileId,
      featureType,
      date: {
        $gte: today
      }
    });
    
    if (usage) {
      // Update existing usage
      usage.count += 1;
      await usage.save();
    } else {
      // Create new usage record
      usage = new GymBrosFeatureUsage({
        profileId,
        userId,
        featureType,
        resetDate,
        membershipId
      });
      await usage.save();
    }
    
    return usage;
  } catch (error) {
    logger.error('Error tracking feature usage:', error);
    throw error;
  }
};

// Get boost limit information for a user
export const getBoostLimits = async (req, res) => {
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
    
    const membership = await GymBrosMembership.findOne({
      profileId,
      isActive: true,
      endDate: { $gt: new Date() }
    });
    
    let profileBoostFactor = 1; // Default (no boost)
    let isMembershipBoost = false;
    
    if (membership && membership.benefits.profileBoost) {
      profileBoostFactor = membership.benefits.profileBoost;
      isMembershipBoost = true;
    }
    
    res.json({
      success: true,
      boost: {
        profileBoostFactor,
        isMembershipBoost,
        hasMembership: !!membership,
        membershipType: membership?.membershipType
      }
    });
  } catch (error) {
    logger.error('Error in getBoostLimits:', error);
    handleError(error, req, res);
  }
};
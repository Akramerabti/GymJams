// server/src/controllers/gymBrosBoostController.js

import GymBrosBoost from '../models/GymBrosBoost.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import User from '../models/User.js';
import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Create a new boost
export const activateBoost = async (req, res) => {
  try {
    const { boostType, boostFactor, duration, paymentMethod, pointsUsed, amount, currency, stripePaymentId } = req.body;
    
    // Validate the request
    if (!boostType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Boost type and payment method are required'
      });
    }

    // Get effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to activate boost'
      });
    }

    // Get user's profile if authenticated
    let userProfile;
    if (effectiveUser.userId) {
      userProfile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    } else if (effectiveUser.profileId) {
      userProfile = await GymBrosProfile.findById(effectiveUser.profileId);
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Please complete your profile first.'
      });
    }

    // Calculate the expiration time based on duration (in minutes)
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + (duration * 60 * 1000));

    // Create boost record
    const boost = new GymBrosBoost({
      userId: effectiveUser.userId || null,
      profileId: userProfile._id,
      boostType,
      boostFactor: boostFactor || getDefaultBoostFactor(boostType),
      startedAt: startDate,
      expiresAt: expiryDate,
      active: true,
      paymentMethod,
      pointsUsed: pointsUsed || 0,
      amount: amount || 0,
      currency: currency || 'USD',
      stripePaymentId: stripePaymentId || null
    });

    await boost.save();

    // Update notification setting for front-end to know a boost was activated
    if (effectiveUser.userId) {
      // Update user's last activity timestamp
      await User.findByIdAndUpdate(effectiveUser.userId, {
        lastBoostActivated: new Date()
      });
    }

    // Generate guest token if applicable
    const responseData = {
      success: true,
      message: 'Boost activated successfully',
      boost: {
        id: boost._id,
        boostType: boost.boostType,
        boostFactor: boost.boostFactor,
        startedAt: boost.startedAt,
        expiresAt: boost.expiresAt
      }
    };

    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
    }

    res.status(201).json(responseData);
  } catch (error) {
    logger.error('Error activating boost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate boost'
    });
  }
};

// Get active boosts for a user
export const getActiveBoosts = async (req, res) => {
  try {
    // Get effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view boosts'
      });
    }

    const now = new Date();
    
    // Query for active boosts
    const query = {
      active: true,
      expiresAt: { $gt: now }
    };

    // Add user identifier to query
    if (effectiveUser.userId) {
      query.userId = effectiveUser.userId;
    } else if (effectiveUser.profileId) {
      query.profileId = effectiveUser.profileId;
    }

    // Find active boosts
    const boosts = await GymBrosBoost.find(query).sort({ expiresAt: 1 });

    // Generate guest token if applicable
    const responseData = {
      success: true,
      boosts
    };

    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error fetching active boosts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active boosts'
    });
  }
};

// Cancel a boost
export const cancelBoost = async (req, res) => {
  try {
    const { boostId } = req.params;
    
    // Get effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
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

    // Check if the boost belongs to the user
    const isOwner = (effectiveUser.userId && boost.userId && boost.userId.toString() === effectiveUser.userId.toString()) ||
                    (effectiveUser.profileId && boost.profileId && boost.profileId.toString() === effectiveUser.profileId.toString());
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this boost'
      });
    }

    // Cancel the boost
    boost.active = false;
    await boost.save();

    // Generate guest token if applicable
    const responseData = {
      success: true,
      message: 'Boost cancelled successfully'
    };

    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error cancelling boost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel boost'
    });
  }
};

// Helper function to get the default boost factor based on boost type
const getDefaultBoostFactor = (boostType) => {
  switch (boostType) {
    case 'boost-basic':
      return 3;
    case 'boost-premium':
      return 5;
    case 'boost-ultra':
      return 10;
    default:
      return 1;
  }
};

// Helper function to get boost duration in minutes based on boost type
export const getBoostDuration = (boostType) => {
  switch (boostType) {
    case 'boost-basic':
      return 30; // 30 minutes
    case 'boost-premium':
      return 60; // 1 hour
    case 'boost-ultra':
      return 180; // 3 hours
    default:
      return 30; // Default to 30 minutes
  }
};

// Helper function to get boost cost in points based on boost type
export const getBoostCost = (boostType) => {
  switch (boostType) {
    case 'boost-basic':
      return 50;
    case 'boost-premium':
      return 100;
    case 'boost-ultra':
      return 200;
    default:
      return 50;
  }
};

// Helper function to get boost price in USD based on boost type
export const getBoostPrice = (boostType) => {
  switch (boostType) {
    case 'boost-basic':
      return 0.50;
    case 'boost-premium':
      return 1.00;
    case 'boost-ultra':
      return 2.00;
    default:
      return 0.50;
  }
};
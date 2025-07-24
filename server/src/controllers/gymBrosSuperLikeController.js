// server/src/controllers/gymBrosSuperLikeController.js
import GymBrosSuperLike from '../models/GymBrosSuperLike.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosMembership from '../models/GymBrosMembership.js';
import GymBrosFeatureUsage from '../models/GymBrosFeatureUsage.js';
import GymBrosMatch from '../models/GymBrosMatch.js';
import User from '../models/User.js';
import { getEffectiveUser } from '../middleware/guestUser.middleware.js';
import { handleError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

// Send a super like
export const sendSuperLike = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    const { recipientId, message, superLikeType = 'superlike-basic' } = req.body;
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to send super like'
      });
    }
    
    // Find sender profile
    let senderProfileId;
    if (effectiveUser.isGuest) {
      senderProfileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Sender profile not found'
        });
      }
      senderProfileId = profile._id;
    }
    
    // Find recipient profile
    const recipientProfile = await GymBrosProfile.findById(recipientId);
    if (!recipientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Recipient profile not found'
      });
    }
    
    // Check if a super like was already sent recently (past 24 hours)
    const recentSuperLike = await GymBrosSuperLike.findOne({
      senderId: senderProfileId,
      recipientId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (recentSuperLike) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a super like to this user in the past 24 hours'
      });
    }
    
    const membership = await GymBrosMembership.findOne({
        profileId: senderProfileId,
        isActive: true,
        endDate: { $gt: new Date() }
      });
      
      let paymentMethod = 'points';
      let pointsUsed = 0;
      let canSendSuperLike = false;
      
      if (membership) {
        // Check if user has unlimited super likes from membership
        if (membership.benefits.unlimitedSuperLikes) {
          paymentMethod = 'membership';
          canSendSuperLike = true;
        }
      }
      
      // If not covered by membership, use points
      if (!canSendSuperLike) {
        // Determine points cost
        pointsUsed = superLikeType === 'superlike-basic' ? 20 : 50;
        
        // Check if user has enough points
        if (effectiveUser.userId) {
          const user = await User.findById(effectiveUser.userId);
          if (!user || user.points < pointsUsed) {
            return res.status(400).json({
              success: false,
              message: 'Not enough points to send super like'
            });
          }
          
          // Deduct points
          user.points -= pointsUsed;
          await user.save();
          canSendSuperLike = true;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Guest users need an active membership to send super likes'
          });
        }
      }
      
      // Only proceed if the user can send a super like
      if (!canSendSuperLike) {
        return res.status(400).json({
          success: false,
          message: 'Unable to send super like'
        });
      }
    
    // Create the super like
    const superLike = new GymBrosSuperLike({
      senderId: senderProfileId,
      recipientId,
      message: superLikeType === 'superlike-premium' ? message : null,
      paymentMethod,
      pointsUsed,
      superLikeType
    });
    
    await superLike.save();
    
    // Check if there's already a match
    const existingMatch = await GymBrosMatch.findOne({
      users: { $all: [senderProfileId, recipientId] }
    });
    
    // Return appropriate response based on match status
    if (existingMatch) {
      res.status(201).json({
        success: true,
        message: 'Super like sent! You are already matched with this user.',
        superLike: superLike,
        match: true,
        matchId: existingMatch._id
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Super like sent!',
        superLike: superLike,
        match: false
      });
    }
  } catch (error) {
    logger.error('Error in sendSuperLike:', error);
    handleError(error, req, res);
  }
};

// Get received super likes
export const getReceivedSuperLikes = async (req, res) => {
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
    
    // Get super likes received
    const superLikes = await GymBrosSuperLike.find({
      recipientId: profileId
    })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name age profileImage'); // Populate sender details
    
    // Return super likes
    res.json({
      success: true,
      superLikes: superLikes.map(like => ({
        id: like._id,
        sender: like.senderId,
        message: like.message,
        createdAt: like.createdAt,
        viewed: like.viewed,
        responded: like.responded,
        responseType: like.responseType,
        superLikeType: like.superLikeType
      }))
    });
  } catch (error) {
    logger.error('Error in getReceivedSuperLikes:', error);
    handleError(error, req, res);
  }
};

// Mark super like as viewed
export const markSuperLikeViewed = async (req, res) => {
  try {
    const { superLikeId } = req.params;
    const effectiveUser = getEffectiveUser(req);
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the super like
    const superLike = await GymBrosSuperLike.findById(superLikeId);
    
    if (!superLike) {
      return res.status(404).json({
        success: false,
        message: 'Super like not found'
      });
    }
    
    // Find the profile
    let profileId;
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      profileId = profile?._id;
    }
    
    // Ensure the super like is for this profile
    if (!profileId || !superLike.recipientId.equals(profileId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this super like'
      });
    }
    
    // Mark as viewed
    superLike.viewed = true;
    await superLike.save();
    
    // Return success
    res.json({
      success: true,
      message: 'Super like marked as viewed'
    });
  } catch (error) {
    logger.error('Error in markSuperLikeViewed:', error);
    handleError(error, req, res);
  }
};

// Respond to a super like
export const respondToSuperLike = async (req, res) => {
  try {
    const { superLikeId } = req.params;
    const { response } = req.body; // 'like' or 'dislike'
    const effectiveUser = getEffectiveUser(req);
    
    // Validate response
    if (response !== 'like' && response !== 'dislike') {
      return res.status(400).json({
        success: false,
        message: 'Response must be either "like" or "dislike"'
      });
    }
    
    // Validate if user is authenticated or guest
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the super like
    const superLike = await GymBrosSuperLike.findById(superLikeId);
    
    if (!superLike) {
      return res.status(404).json({
        success: false,
        message: 'Super like not found'
      });
    }
    
    // Find the profile
    let profileId;
    if (effectiveUser.isGuest) {
      profileId = effectiveUser.profileId;
    } else {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      profileId = profile?._id;
    }
    
    // Ensure the super like is for this profile
    if (!profileId || !superLike.recipientId.equals(profileId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this super like'
      });
    }
    
    // Update the super like
    superLike.viewed = true;
    superLike.responded = true;
    superLike.responseType = response;
    await superLike.save();
    
    // If the response is 'like', create a match
    let match = null;
    if (response === 'like') {
      // Check if match already exists
      match = await GymBrosMatch.findOne({
        users: { $all: [profileId, superLike.senderId] }
      });
      
      if (!match) {
        // Create new match
        match = new GymBrosMatch({
          users: [profileId, superLike.senderId],
          lastMessage: new Date(),
          quality: 7 // Higher initial quality for super like matches
        });
        
        await match.save();
      }
    }
    
    // Return response
    res.json({
      success: true,
      message: response === 'like' ? 'Super like accepted' : 'Super like declined',
      match: response === 'like' ? match : null
    });
  } catch (error) {
    logger.error('Error in respondToSuperLike:', error);
    handleError(error, req, res);
  }
};

// Get super like limit information for a user
export const getSuperLikeLimits = async (req, res) => {
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
    
    // Get active membership
    const membership = await GymBrosMembership.findOne({
      profileId,
      isActive: true,
      endDate: { $gt: new Date() }
    });
    
    // Get current usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const superLikeUsage = await GymBrosFeatureUsage.find({
      profileId,
      featureType: 'superlike',
      date: { $gte: today }
    });
    
    const usedSuperLikes = superLikeUsage.reduce((sum, item) => sum + item.count, 0);
    
    let superLikesLimit = 0;
let hasUnlimitedSuperLikes = false;

if (membership) {
  // Check for unlimited superlikes
  hasUnlimitedSuperLikes = membership.benefits.unlimitedSuperLikes === true;
  // Only set a numerical limit if not unlimited
  if (!hasUnlimitedSuperLikes) {
    superLikesLimit = 0; // Default to 0 if not unlimited
  }
}

// Return limits
res.json({
  success: true,
  limits: {
    hasUnlimitedSuperLikes,
    superLikesPerDay: superLikesLimit,
    superLikesUsed: usedSuperLikes,
    superLikesRemaining: hasUnlimitedSuperLikes ? 999 : Math.max(0, superLikesLimit - usedSuperLikes),
    hasMembership: !!membership,
    membershipType: membership?.membershipType,
    nextResetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000)
  }
});
  } catch (error) {
    logger.error('Error in getSuperLikeLimits:', error);
    handleError(error, req, res);
  }
};

// Helper function to track feature usage
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
      date: { $gte: today }
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
// server/src/controllers/notificationController.js
import admin from '../config/firebase.js';
import NotificationToken from '../models/NotificationToken.js';
import User from '../models/User.js';

const DEFAULT_ICON_URL = 'https://www.gymtonic.ca/Picture2.png';

// ADD THIS HELPER FUNCTION AT THE TOP
const sanitizeDataForFCM = (data) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
    } else if (typeof value === 'object' && value.toString) {
      // Handle ObjectIds and Dates
      sanitized[key] = value.toString();
    } else if (typeof value === 'object') {
      // Handle other objects by stringifying
      sanitized[key] = JSON.stringify(value);
    } else {
      // Convert all other types to string
      sanitized[key] = String(value);
    }
  }
  return sanitized;
};

export const registerToken = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    // Use findOneAndUpdate with upsert to handle duplicates atomically
    const result = await NotificationToken.findOneAndUpdate(
      { fcmToken }, // Find by token
      { 
        userId,
        platform: platform || 'android',
        isActive: true,
        lastUsed: new Date()
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true,    // Return updated document
        setDefaultsOnInsert: true
      }
    );

    console.log(`FCM token registered for user ${userId}: ${fcmToken.substring(0, 20)}...`);
    res.json({ success: true, message: 'Token registered successfully' });
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
};

// Unregister FCM token
export const unregisterToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const result = await NotificationToken.updateOne(
      { fcmToken, userId },
      { 
        isActive: false,
        lastUsed: new Date()
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    console.log(`FCM token unregistered for user ${userId}: ${fcmToken.substring(0, 20)}...`);
    res.json({ success: true, message: 'Token unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering token:', error);
    res.status(500).json({ error: 'Failed to unregister token' });
  }
};

// Get notification preferences
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      preferences: user.notificationPreferences || {}
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

// Update notification preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          notificationPreferences: preferences 
        }
      },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

export const sendToUser = async (userId, notification, options = {}) => {
  try {
    // Get user with notification preferences
    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      console.log(`User ${userId} not found`);
      return { success: false, error: 'User not found' };
    }

    // Check if user should receive this notification
    const { category, subType } = notification;
    if (!shouldReceiveNotification(user, category, subType)) {
      console.log(`Notification ${category}${subType ? `.${subType}` : ''} disabled for user ${userId}`);
      return { success: true, skipped: true, reason: 'User preferences' };
    }

    // Get active tokens for user
    const tokens = await NotificationToken.find({ 
      userId, 
      isActive: true 
    });

    if (tokens.length === 0) {
      console.log(`No active tokens found for user ${userId}`);
      return { success: true, noTokens: true };
    }

    const fcmTokens = tokens.map(token => token.fcmToken);
    
    // Sanitize notification data to ensure all values are strings
    const sanitizedData = sanitizeDataForFCM({
      type: notification.type,
      timestamp: new Date().toISOString(),
      // Include title and body in data payload for client-side handling
      title: notification.title,
      body: notification.body,
      ...(notification.icon && { icon: notification.icon }),
      ...(notification.image && { image: notification.image }),
      ...(notification.color && { color: notification.color }),
      ...notification.data
    });

    // Create DATA-ONLY message (no notification payload)
    const message = {
      // Remove notification payload entirely - let client handle all display logic
      data: sanitizedData,
      android: {
        // Set priority but no notification config
        priority: 'high',
        data: sanitizedData,
        // Optional: Set collapse key for message grouping
        ...(notification.collapseKey && { collapseKey: notification.collapseKey })
      },
      apns: {
        // For iOS, use content-available for background processing
        headers: {
          'apns-push-type': 'background',
          'apns-priority': '5'
        },
        payload: {
          aps: {
            'content-available': 1,
            // Don't include alert - let client decide
            badge: 1
          }
        }
      },
      tokens: fcmTokens
    };

    // Add custom options
    if (options.ttl) {
      message.android.ttl = options.ttl;
      if (!message.apns.headers) message.apns.headers = {};
      message.apns.headers['apns-expiration'] = Math.floor(Date.now() / 1000) + options.ttl;
    }

    // Send notification
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Handle failed tokens
if (response.failureCount > 0) {
  const failedTokens = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      console.error(`Failed to send to token ${fcmTokens[idx]}: ${resp.error}`);
      
      // Check if token is invalid (includes "Requested entity was not found")
      if (resp.error.code === 'messaging/invalid-registration-token' ||
          resp.error.code === 'messaging/registration-token-not-registered' ||
          resp.error.message?.includes('Requested entity was not found')) {
        failedTokens.push(fcmTokens[idx]);
      }
    }
  });
  
  // Remove invalid tokens
  if (failedTokens.length > 0) {
    await NotificationToken.updateMany(
      { fcmToken: { $in: failedTokens } },
      { isActive: false }
    );
    console.log(`Deactivated ${failedTokens.length} invalid tokens`);
  }
}

    console.log(`Data-only notification sent to user ${userId}: ${response.successCount}/${fcmTokens.length} successful`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalCount: fcmTokens.length
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Helper function to check if user should receive notification
const shouldReceiveNotification = (user, category, subType) => {
  const prefs = user.notificationPreferences;
  
  // Check if push notifications are enabled globally
  if (!prefs?.pushNotifications) {
    return false;
  }
  
  // Check specific category and subtype
  if (category && prefs[category] && subType) {
    return prefs[category][subType] !== false;
  }
  
  return true; // Default to allowing notifications
};

// Helper function for notification channels
const getChannelId = (category, subType) => {
  if (category === 'gymBros') {
    switch (subType) {
      case 'matches': return 'matches';
      case 'messages': return 'messages';
      case 'workoutInvites': return 'workout_invites';
      case 'boosts': return 'boosts';
      default: return 'gymbros';
    }
  }
  
  switch (category) {
    case 'coaching': return 'coaching';
    case 'games': return 'games';
    case 'shop': return 'shop';
    case 'general': return 'general';
    default: return 'general';
  }
};

// GymBros notification functions
export const sendMatchNotification = async (userId, matchData) => {
  try {
    return await sendToUser(userId, {
      title: '🎉 New Match!',
      body: `You matched with ${matchData.name}!`,
      type: 'match',
      category: 'gymBros',
      subType: 'matches',
      icon: matchData.avatar,
      color: '#3B82F6',
      data: {
        matchId: matchData.id,
        partnerId: matchData.userId,
        partnerName: matchData.name
      }
    });
  } catch (error) {
    console.error('Error sending match notification:', error);
    throw error;
  }
};

export const sendMessageNotification = async (userId, messageData) => {
  try {
    return await sendToUser(userId, {
      title: `💬 ${messageData.senderName}`,
      body: messageData.message,
      type: 'message',
      category: 'gymBros',
      subType: 'messages',
      icon: messageData.senderAvatar,
      color: '#10B981',
      data: {
        chatId: messageData.chatId,
        senderId: messageData.senderId,
        senderName: messageData.senderName
      }
    });
  } catch (error) {
    console.error('Error sending message notification:', error);
    throw error;
  }
};

export const sendWorkoutInvite = async (userId, inviteData) => {
  try {
    return await sendToUser(userId, {
      title: '🏋️ Workout Invitation',
      body: `${inviteData.senderName} invited you to workout at ${inviteData.gymName}`,
      type: 'workout_invite',
      category: 'gymBros',
      subType: 'workoutInvites',
      icon: inviteData.senderAvatar,
      color: '#F59E0B',
      data: {
        inviteId: inviteData.id,
        gymId: inviteData.gymId,
        gymName: inviteData.gymName,
        senderId: inviteData.senderId,
        senderName: inviteData.senderName,
        scheduledTime: inviteData.scheduledTime
      }
    });
  } catch (error) {
    console.error('Error sending workout invite notification:', error);
    throw error;
  }
};

// Subscription-related notification functions
export const sendSubscriptionCancellationNotification = async (userId, cancellationData) => {
  try {
    const isRefund = cancellationData.isRefundEligible;
    return await sendToUser(userId, {
      title: 'Subscription Cancelled',
      body: isRefund 
        ? 'Your subscription has been cancelled and refund processed'
        : 'Your subscription will end at the current billing period',
      type: 'subscription_cancelled',
      category: 'general', 
      subType: 'accountUpdates',
      color: '#F59E0B',
      data: {
        subscriptionId: cancellationData.subscriptionId,
        isRefund: isRefund,
        endDate: cancellationData.endDate,
        refundAmount: cancellationData.refundAmount
      }
    });
  } catch (error) {
    console.error('Error sending subscription cancellation notification:', error);
    throw error;
  }
};

export const sendNewClientAssignmentNotification = async (coachId, assignmentData) => {
  try {
    return await sendToUser(coachId, {
      title: 'New Client Assigned!',
      body: `${assignmentData.clientName} has been assigned to you`,
      type: 'client_assignment',
      category: 'coaching',
      subType: 'newClients',
      icon: assignmentData.clientProfileImage,
      color: '#059669',
      data: {
        subscriptionId: assignmentData.subscriptionId,
        clientId: assignmentData.clientId,
        clientName: assignmentData.clientName,
        assignmentDate: assignmentData.assignmentDate,
        planType: assignmentData.planType
      }
    });
  } catch (error) {
    console.error('Error sending new client assignment notification:', error);
    throw error;
  }
};

// Goal-related notification functions
export const sendNewGoalNotification = async (clientId, goalData) => {
  try {
    return await sendToUser(clientId, {
      title: 'New Goal Added!',
      body: `${goalData.title} - Earn ${goalData.points || 0} points when completed`,
      type: 'new_goal',
      category: 'coaching',
      subType: 'newGoals',
      color: '#3B82F6',
      data: {
        goalId: goalData.id,
        title: goalData.title,
        description: goalData.description,
        points: goalData.points || 0,
        subscriptionId: goalData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending new goal notification:', error);
    throw error;
  }
};

export const sendGoalUpdatedNotification = async (clientId, goalData) => {
  try {
    return await sendToUser(clientId, {
      title: 'Goal Updated',
      body: `${goalData.title} has been updated by your coach`,
      type: 'goal_updated',
      category: 'coaching',
      subType: 'newGoals',
      color: '#F59E0B',
      data: {
        goalId: goalData.id,
        title: goalData.title,
        description: goalData.description,
        points: goalData.points || 0,
        subscriptionId: goalData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending goal updated notification:', error);
    throw error;
  }
};

export const sendGoalRemovedNotification = async (clientId, goalData) => {
  try {
    return await sendToUser(clientId, {
      title: 'Goal Removed',
      body: `${goalData.title} has been removed by your coach`,
      type: 'goal_removed',
      category: 'coaching',
      subType: 'newGoals',
      color: '#EF4444',
      data: {
        goalId: goalData.id,
        title: goalData.title,
        subscriptionId: goalData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending goal removed notification:', error);
    throw error;
  }
};

export const sendGoalCompletionRequestNotification = async (coachId, requestData) => {
  try {
    return await sendToUser(coachId, {
      title: 'Goal Completion Request',
      body: `${requestData.clientName} has requested completion of: ${requestData.goalTitle}`,
      type: 'goal_completion_request',
      category: 'coaching',
      subType: 'goalCompletionRequests',
      icon: requestData.clientProfileImage,
      color: '#8B5CF6',
      data: {
        goalId: requestData.goalId,
        goalTitle: requestData.goalTitle,
        clientId: requestData.clientId,
        clientName: requestData.clientName,
        subscriptionId: requestData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending goal completion request notification:', error);
    throw error;
  }
};

export const sendGoalApprovedNotification = async (clientId, approvalData) => {
  try {
    return await sendToUser(clientId, {
      title: 'Goal Completed!',
      body: `${approvalData.goalTitle} approved! You earned ${approvalData.pointsAwarded} points`,
      type: 'goal_approved',
      category: 'coaching',
      subType: 'acceptedGoals',
      color: '#10B981',
      data: {
        goalId: approvalData.goalId,
        goalTitle: approvalData.goalTitle,
        pointsAwarded: approvalData.pointsAwarded,
        subscriptionId: approvalData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending goal approved notification:', error);
    throw error;
  }
};

export const sendGoalRejectedNotification = async (clientId, rejectionData) => {
  try {
    return await sendToUser(clientId, {
      title: 'Goal Completion Rejected',
      body: `${rejectionData.goalTitle} - ${rejectionData.reason}`,
      type: 'goal_rejected',
      category: 'coaching',
      subType: 'acceptedGoals',
      color: '#EF4444',
      data: {
        goalId: rejectionData.goalId,
        goalTitle: rejectionData.goalTitle,
        reason: rejectionData.reason,
        subscriptionId: rejectionData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending goal rejected notification:', error);
    throw error;
  }
};

// Session-related notification functions
export const sendSessionRequestNotification = async (coachId, sessionData) => {
  try {
    return await sendToUser(coachId, {
      title: 'New Session Request',
      body: `${sessionData.clientName} requested a ${sessionData.sessionType} session on ${sessionData.date} at ${sessionData.time}`,
      type: 'session_request',
      category: 'coaching',
      subType: 'sessionReminders',
      icon: sessionData.clientProfileImage,
      color: '#6366F1',
      data: {
        sessionId: sessionData.sessionId,
        clientId: sessionData.clientId,
        clientName: sessionData.clientName,
        date: sessionData.date,
        time: sessionData.time,
        sessionType: sessionData.sessionType,
        subscriptionId: sessionData.subscriptionId
      }
    });
  } catch (error) {
    console.error('Error sending session request notification:', error);
    throw error;
  }
};

export const sendNewMessageNotification = async (userId, messageData) => {
  try {
    return await sendToUser(userId, {
      title: `New message from ${messageData.senderName}`,
      body: messageData.message.length > 100 
        ? messageData.message.substring(0, 100) + '...' 
        : messageData.message,
      type: 'new_message',
      category: 'coaching',
      subType: messageData.isCoachSender ? 'coachMessages' : 'clientMessages',
      icon: messageData.senderAvatar,
      color: '#3B82F6',
      data: {
        subscriptionId: messageData.subscriptionId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        messageId: messageData.messageId
      }
    });
  } catch (error) {
    console.error('Error sending new message notification:', error);
    throw error;
  }
};

export const sendSubscriptionRenewalNotification = async (userId, renewalData) => {
  try {
    return await sendToUser(userId, {
      title: 'Subscription Renewed',
      body: `Your ${renewalData.planType} subscription has been renewed`,
      type: 'subscription_renewed',
      category: 'general',
      subType: 'accountUpdates',
      color: '#10B981',
      data: {
        subscriptionId: renewalData.subscriptionId,
        planType: renewalData.planType,
        nextBillingDate: renewalData.nextBillingDate
      }
    });
  } catch (error) {
    console.error('Error sending subscription renewal notification:', error);
    throw error;
  }
};

export const sendSubscriptionEndedNotification = async (userId, endData) => {
  try {
    return await sendToUser(userId, {
      title: 'Subscription Ended',
      body: 'Your GymTonic subscription has ended. Resubscribe to continue accessing premium features.',
      type: 'subscription_ended',
      category: 'general',
      subType: 'accountUpdates', 
      color: '#6B7280',
      data: {
        subscriptionId: endData.subscriptionId,
        endDate: endData.endDate,
        planType: endData.planType
      }
    });
  } catch (error) {
    console.error('Error sending subscription ended notification:', error);
    throw error;
  }
};

// Admin function to send notification to all users
export const sendToAllUsers = async (req, res) => {
  try {
    const { notification } = req.body;
    
    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }
    
    const activeTokens = await NotificationToken.find({ isActive: true }).distinct('userId');
    
    const results = await Promise.allSettled(
      activeTokens.map(userId => sendToUser(userId, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value.skipped).length;
    
    res.json({
      success: true,
      message: 'Notification sent to all users',
      stats: { successful, failed, skipped, total: activeTokens.length }
    });
  } catch (error) {
    console.error('Error sending notification to all users:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};
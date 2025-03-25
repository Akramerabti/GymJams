import mongoose from 'mongoose';
import GymBrosMatch from '../models/GymBrosMatch.js';
import logger from '../utils/logger.js';
import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import { activeUsers } from '../socketServer.js';

// Send a message to a match
export const sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content, file } = req.body;
    
    // Get effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required to send messages'
      });
    }
    
    // Find the match
    const match = await GymBrosMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if the user is part of the match
    const senderId = effectiveUser.userId || effectiveUser.profileId;
    const userInMatch = match.users.some(userId => userId.toString() === senderId.toString());
    
    if (!userInMatch) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this match'
      });
    }
    
    // Create and add the message
    const message = {
      sender: senderId,
      content: content || '',
      timestamp: new Date(),
      read: false,
      file: file || []
    };
    
    // Add message to the match
    match.messages.push(message);
    match.lastMessage = new Date();
    
    // Save the match
    await match.save();
    
    // Get the receiver ID
    const receiverId = match.users.find(userId => userId.toString() !== senderId.toString());
    
    // Notify the other user via socket if they're online
    if (receiverId) {
      // Get socket.io instance
      const { getIoInstance } = await import('../socketServer.js');
      const io = getIoInstance();
      
      if (io) {
        const receiverSocketId = activeUsers.get(receiverId.toString());
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', {
            _id: message._id,
            sender: senderId,
            content: message.content,
            timestamp: message.timestamp,
            read: message.read,
            file: message.file,
            matchId: matchId
          });
          
          logger.info(`Real-time message delivered to user ${receiverId}`);
        } else {
          logger.info(`User ${receiverId} is offline, message saved but not delivered in real-time`);
        }
      }
    }
    
    // Include guest token in response if applicable
    let responseData = {
      success: true,
      message: 'Message sent successfully',
      messageId: message._id
    };
    
    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
    }
    
    return res.status(201).json(responseData);
  } catch (error) {
    logger.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Get messages for a match
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    // Get effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required to get messages'
      });
    }
    
    // Find the match
    const match = await GymBrosMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if the user is part of the match
    const userId = effectiveUser.userId || effectiveUser.profileId;
    const userInMatch = match.users.some(matchUserId => matchUserId.toString() === userId.toString());
    
    if (!userInMatch) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this match'
      });
    }
    
    // Get messages with pagination
    let messagesQuery = match.messages || [];
    
    // Filter for unread messages if requested
    if (unreadOnly === 'true' || unreadOnly === true) {
      messagesQuery = messagesQuery.filter(msg => 
        !msg.read && msg.sender.toString() !== userId.toString()
      );
    }
    
    // Sort by timestamp (newest first) and apply pagination
    const sortedMessages = messagesQuery
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .reverse(); // Reverse to get chronological order again
    
    // Include guest token in response if applicable
    let responseData = sortedMessages;
    
    if (effectiveUser.isGuest) {
      responseData = {
        messages: sortedMessages,
        guestToken: generateGuestToken(effectiveUser.phone, effectiveUser.profileId)
      };
    }
    
    return res.json(responseData);
  } catch (error) {
    logger.error('Error getting messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving messages'
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs are required'
      });
    }
    
    // Get effective user (authenticated or guest)
    const effectiveUser = getEffectiveUser(req);
    
    // Need either userId or profileId
    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required to mark messages as read'
      });
    }
    
    // Find the match
    const match = await GymBrosMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if the user is part of the match
    const userId = effectiveUser.userId || effectiveUser.profileId;
    const userInMatch = match.users.some(matchUserId => matchUserId.toString() === userId.toString());
    
    if (!userInMatch) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this match'
      });
    }
    
    // Get the message sender ID for notification
    const otherUserId = match.users.find(id => id.toString() !== userId.toString());
    
    // Map message IDs to strings for comparison
    const messageIdsStr = messageIds.map(id => id.toString());
    
    // Update read status of messages
    let updatedCount = 0;
    
    match.messages.forEach(message => {
      // Only mark messages as read if they're in the provided list and not from the current user
      if (messageIdsStr.includes(message._id.toString()) && message.sender.toString() !== userId.toString()) {
        message.read = true;
        updatedCount++;
      }
    });
    
    // Save the match
    await match.save();
    
    // Notify the other user via socket if they're online
    if (otherUserId && updatedCount > 0) {
      // Get socket.io instance
      const { getIoInstance } = await import('../socketServer.js');
      const io = getIoInstance();
      
      if (io) {
        const otherUserSocketId = activeUsers.get(otherUserId.toString());
        
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('messagesRead', {
            matchId,
            messageIds,
            timestamp: new Date().toISOString()
          });
          
          logger.info(`Read receipts for ${updatedCount} messages sent to user ${otherUserId}`);
        }
      }
    }
    
    // Include guest token in response if applicable
    let responseData = {
      success: true,
      message: `Marked ${updatedCount} messages as read`,
      updated: updatedCount
    };
    
    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, effectiveUser.profileId);
    }
    
    return res.json(responseData);
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating messages'
    });
  }
};
// socketServer.js
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import Subscription from './models/Subscription.js';
import GymBrosMatch from './models/GymBrosMatch.js';

// Store active users and their socket connections
export const activeUsers = new Map();

// Store timeouts for disconnected users
const userTimeouts = new Map();

// Store the io instance
let ioInstance;

export const initializeSocket = (server) => {
  if (ioInstance) {
    logger.warn('Socket.io server already initialized, reusing existing instance');
    return ioInstance;
  }

  // Configure Socket.io
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [
            'https://gymtonic.ca',
            'https://www.gymtonic.ca',
            'https://gymtonic.onrender.com'
          ]
        : [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5000'
          ],
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-gymbros-guest-token']
    },
    pingTimeout: 60000, // 60s timeout
    pingInterval: 25000, // 25s ping interval
    transports: ['websocket', 'polling'], // Use websocket when possible, fallback to polling
    maxHttpBufferSize: 5e6, // 5MB max payload
    allowUpgrades: true,
    path: '/socket.io' // Default socket.io path
  });

  logger.info('Socket.io server initialized');

  // Connection handler
  ioInstance.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Send initial message to confirm connection
    socket.emit('debug', {
      message: 'Connected to server',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Register user with their ID
    socket.on('register', (userId) => {
      if (!userId) {
        logger.warn('Invalid user ID provided to socket registration');
        socket.emit('registrationError', { message: 'Invalid user ID' });
        return;
      }
      
      // Normalize userId to string
      const userIdStr = userId.toString();
      
      // Clear any pending timeout for this user
      if (userTimeouts.has(userIdStr)) {
        clearTimeout(userTimeouts.get(userIdStr));
        userTimeouts.delete(userIdStr);
        logger.info(`Cleared reconnection timeout for user ${userIdStr}`);
      }
      
      // Store previous socket ID if it exists
      const previousSocketId = activeUsers.get(userIdStr);
      
      // Update the socket ID for this user
      activeUsers.set(userIdStr, socket.id);
      
      // Log registration
      if (previousSocketId && previousSocketId !== socket.id) {
        logger.info(`User ${userIdStr} re-registered with new socket ${socket.id} (old: ${previousSocketId})`);
        
        // Disconnect the old socket if it still exists
        const oldSocket = ioInstance.sockets.sockets.get(previousSocketId);
        if (oldSocket) {
          logger.info(`Disconnecting old socket ${previousSocketId} for user ${userIdStr}`);
          oldSocket.disconnect(true);
        }
      } else {
        logger.info(`User ${userIdStr} registered with socket ${socket.id}`);
      }
      
      // Confirm registration success
      socket.emit('registrationSuccess', { userId: userIdStr });
      
      // Store user ID on the socket for quick lookup on disconnect
      socket.userId = userIdStr;
    });

    // Handle sending messages - unified to handle both subscription and match messages
    socket.on('sendMessage', async (messageData) => {
      console.log('sendMessage event received:', messageData);
      const { senderId, receiverId, content, timestamp, file, subscriptionId, matchId } = messageData;
      
      // Basic validation
      if (!senderId || !receiverId || (!subscriptionId && !matchId)) {
        logger.error('Missing required fields in sendMessage event');
        socket.emit('messageError', { error: 'Missing required fields' });
        return;
      }

      try {
        // Determine context type (subscription or match)
        const isSubscriptionMessage = !!subscriptionId;
        const isMatchMessage = !!matchId;
        
        // Log what type of message is being sent
        logger.debug(`Processing ${isSubscriptionMessage ? 'subscription' : 'match'} message 
                     from ${senderId} to ${receiverId} for ${isSubscriptionMessage ? 'subscription' : 'match'} 
                     ${isSubscriptionMessage ? subscriptionId : matchId}`);

        // NOTE: We're not creating or saving messages here anymore
        // Message creation will only happen through the API to avoid duplicates
        
        // Send acknowledgment to the sender
        socket.emit('messageSent', {
          status: 'received',
          subscriptionId: isSubscriptionMessage ? subscriptionId : undefined,
          matchId: isMatchMessage ? matchId : undefined,
          timestamp: new Date().toISOString()
        });
        
        // Forward message to receiver if they are online
        const receiverSocketId = activeUsers.get(receiverId.toString());
        if (receiverSocketId) {
          // Create a message object for the receiver without the pending flag
          const messageForReceiver = {
            _id: messageData._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: senderId,
            content: content || '',
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            file: Array.isArray(file) ? file : []
          };
          
          // Include the appropriate ID (subscription or match)
          if (isSubscriptionMessage) {
            messageForReceiver.subscriptionId = subscriptionId;
          } else if (isMatchMessage) {
            messageForReceiver.matchId = matchId;
          }
          
          // Send to the receiver
          ioInstance.to(receiverSocketId).emit('receiveMessage', messageForReceiver);
          logger.debug(`Message forwarded to receiver ${receiverId} (socket: ${receiverSocketId})`);
        } else {
          logger.debug(`Receiver ${receiverId} is offline, message will be delivered when they connect`);
        }
      } catch (error) {
        logger.error('Error in sendMessage socket event:', error);
        socket.emit('messageError', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { senderId, receiverId, isTyping, subscriptionId, matchId } = data;
      
      if (!senderId || !receiverId) {
        logger.warn('Missing required fields in typing event');
        return;
      }
      
      try {
        const receiverSocketId = activeUsers.get(receiverId.toString());
        
        if (receiverSocketId) {
          // Forward typing event with context information
          ioInstance.to(receiverSocketId).emit('typing', {
            senderId,
            isTyping,
            timestamp: Date.now(),
            subscriptionId: subscriptionId || undefined, // Will be undefined if not provided
            matchId: matchId || undefined // Will be undefined if not provided
          });
          
          logger.debug(`Typing event (${isTyping ? 'started' : 'stopped'}) sent from ${senderId} to ${receiverId}`);
        } else {
          logger.debug(`Typing event not sent: Receiver ${receiverId} is offline`);
        }
      } catch (error) {
        logger.error('Error handling typing event:', error);
      }
    });

    // Handle read receipts
    socket.on('messagesRead', (data) => {
      const { subscriptionId, matchId, messageIds, receiverId } = data;
      
      // Check if we have either a subscription ID or match ID
      if ((!subscriptionId && !matchId) || !messageIds || !messageIds.length || !receiverId) {
        logger.warn('Invalid messagesRead event data');
        return;
      }
      
      try {
        // Find the receiver's socket ID
        const receiverSocketId = activeUsers.get(receiverId.toString());
        
        // Acknowledge receipt to the sender
        socket.emit('readReceiptSent', {
          subscriptionId,
          matchId,
          messageIds,
          success: !!receiverSocketId
        });
        
        // If receiver is online, forward the read receipt
        if (receiverSocketId) {
          // Include context-specific IDs
          ioInstance.to(receiverSocketId).emit('messagesRead', {
            subscriptionId, // Will be undefined if not relevant
            matchId, // Will be undefined if not relevant
            messageIds,
            timestamp: new Date().toISOString()
          });
          
          logger.debug(`Read receipt for ${messageIds.length} messages sent to ${receiverId}`);
        } else {
          logger.debug(`Read receipt not delivered: Receiver ${receiverId} is offline`);
        }
      } catch (error) {
        logger.error('Error handling messagesRead event:', error);
      }
    });

    // Handle heartbeat pings
    socket.on('heartbeat', (data) => {
      logger.debug(`Heartbeat received from socket ${socket.id}, userId: ${socket.userId || 'unknown'}`);
      
      // Respond with a pong to confirm connection
      socket.emit('heartbeat-ack', {
        timestamp: new Date().toISOString(),
        received: data?.timestamp
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = socket.userId;
      
      if (userId) {
        logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        
        // Set a timeout to remove the user from active users
        // This gives them a chance to reconnect without losing their registered status
        const timeout = setTimeout(() => {
          // Only remove if the socket ID still matches
          if (activeUsers.get(userId) === socket.id) {
            activeUsers.delete(userId);
            logger.info(`User ${userId} removed from active users after timeout`);
          }
          userTimeouts.delete(userId);
        }, 5 * 60 * 1000); // 5 minutes
        
        userTimeouts.set(userId, timeout);
      } else {
        logger.info(`Socket ${socket.id} disconnected (no associated user)`);
      }
    });
    
    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Connection error handling
  ioInstance.on('connect_error', (error) => {
    logger.error('Socket.io connection error:', error);
  });

  return ioInstance;
};

// Export function to get the io instance
export const getIoInstance = () => {
  if (!ioInstance) {
    logger.warn('Attempting to get Socket.io instance before initialization!');
  }
  return ioInstance;
};

// Export function to emit to all users or specific users
export const emitToUsers = (event, data, userIds = null) => {
  if (!ioInstance) {
    logger.error('Socket.io instance not initialized');
    return;
  }
  
  try {
    // If specific user IDs provided, emit only to them
    if (userIds && Array.isArray(userIds)) {
      userIds.forEach(userId => {
        const socketId = activeUsers.get(userId.toString());
        if (socketId) {
          ioInstance.to(socketId).emit(event, data);
        }
      });
      
      logger.debug(`Emitted ${event} to ${userIds.length} specific users`);
    } 
    // Emit to all connected users
    else {
      ioInstance.emit(event, data);
      logger.debug(`Emitted ${event} to all connected users`);
    }
  } catch (error) {
    logger.error(`Error emitting ${event}:`, error);
  }
};

// Unified function to notify users about various events
export const notifyUser = (userId, eventType, data) => {
  if (!ioInstance) {
    logger.error('Socket.io instance not initialized');
    return false;
  }
  
  try {
    const socketId = activeUsers.get(userId.toString());
    if (socketId) {
      ioInstance.to(socketId).emit(eventType, data);
      logger.info(`${eventType} notification sent to user ${userId}`);
      return true;
    } else {
      logger.info(`User ${userId} is offline, ${eventType} notification will be delivered when they connect`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending ${eventType} notification:`, error);
    return false;
  }
};

// Specific function to notify a client about goal approval (preserved for backward compatibility)
export const notifyGoalApproval = (userId, goalData) => {
  return notifyUser(userId, 'goalApproved', goalData);
};

// Specific function to notify a client about goal rejection (preserved for backward compatibility)
export const notifyGoalRejection = (userId, goalData) => {
  return notifyUser(userId, 'goalRejected', goalData);
};

// New function to notify about a new match
export const notifyNewMatch = (userId, matchData) => {
  return notifyUser(userId, 'newMatch', matchData);
};
// socketServer.js
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import Subscription from './models/Subscription.js';

// Store active users and their socket connections
export const activeUsers = new Map();

// Store timeouts for disconnected users
const userTimeouts = new Map();

// Store the io instance
let ioInstance;

/**
 * Initialize the socket.io server
 * @param {Server} server - HTTP or HTTPS server instance
 * @returns {Server} - Socket.io server instance
 */
export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000, // 60s timeout
    pingInterval: 25000, // 25s ping interval
    transports: ['websocket', 'polling'], // Use websocket when possible, fallback to polling
  });

  ioInstance.on('connection', (socket) => {
    logger.info('New socket connection:', socket.id);

    // Register user with their ID
    socket.on('register', (userId) => {
      if (!userId) {
        logger.warn('Invalid user ID provided to socket registration');
        socket.emit('registrationError', { message: 'Invalid user ID' });
        return;
      }
      
      // Clear any pending timeout for this user
      if (userTimeouts.has(userId)) {
        clearTimeout(userTimeouts.get(userId));
        userTimeouts.delete(userId);
        logger.info(`Cleared reconnection timeout for user ${userId}`);
      }
      
      // Store previous socket ID if it exists
      const previousSocketId = activeUsers.get(userId);
      
      // Update the socket ID for this user
      activeUsers.set(userId, socket.id);
      
      // Log registration
      if (previousSocketId && previousSocketId !== socket.id) {
        logger.info(`User ${userId} re-registered with new socket ${socket.id} (old: ${previousSocketId})`);
        
        // Disconnect the old socket if it still exists
        const oldSocket = ioInstance.sockets.sockets.get(previousSocketId);
        if (oldSocket) {
          logger.info(`Disconnecting old socket ${previousSocketId} for user ${userId}`);
          oldSocket.disconnect(true);
        }
      } else {
        logger.info(`User ${userId} registered with socket ${socket.id}`);
      }
      
      // Confirm registration success
      socket.emit('registrationSuccess', { userId });
      
      // Store user ID on the socket for quick lookup on disconnect
      socket.userId = userId;
    });

    // Handle sending messages
    socket.on('sendMessage', async (messageData) => {
      const { senderId, receiverId, content, timestamp, file, subscriptionId } = messageData;
      
      // Basic validation
      if (!senderId || !receiverId || !subscriptionId) {
        logger.error('Missing required fields in sendMessage event');
        socket.emit('messageError', { error: 'Missing required fields' });
        return;
      }

      try {
        // NOTE: We're not creating or saving messages here anymore
        // Message creation will only happen through the API to avoid duplicates
        
        // We'll just acknowledge receipt to the sender
        socket.emit('messageSent', {
          status: 'received',
          subscriptionId,
          timestamp: new Date().toISOString()
        });
        
        logger.info(`Message event acknowledged from ${senderId} to ${receiverId}`);
      } catch (error) {
        logger.error('Error in sendMessage socket event:', error);
        socket.emit('messageError', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { senderId, receiverId, isTyping } = data;
      
      if (!senderId || !receiverId) {
        logger.warn('Missing required fields in typing event');
        return;
      }
      
      try {
        const receiverSocketId = activeUsers.get(receiverId);
        
        if (receiverSocketId) {
          ioInstance.to(receiverSocketId).emit('typing', {
            senderId,
            isTyping,
            timestamp: Date.now()
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
      const { subscriptionId, messageIds, receiverId } = data;
      
      if (!subscriptionId || !messageIds || !messageIds.length || !receiverId) {
        logger.warn('Invalid messagesRead event data');
        return;
      }
      
      try {
        // Find the receiver's socket ID
        const receiverSocketId = activeUsers.get(receiverId);
        
        // Acknowledge receipt to the sender
        socket.emit('readReceiptSent', {
          subscriptionId,
          messageIds,
          success: !!receiverSocketId
        });
        
        // If receiver is online, forward the read receipt
        if (receiverSocketId) {
          ioInstance.to(receiverSocketId).emit('messagesRead', {
            subscriptionId,
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
export const getIoInstance = () => ioInstance;

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
        const socketId = activeUsers.get(userId);
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

// Specific function to notify a client about goal approval
export const notifyGoalApproval = (userId, goalData) => {
  if (!ioInstance) {
    logger.error('Socket.io instance not initialized');
    return false;
  }
  
  try {
    const socketId = activeUsers.get(userId.toString());
    if (socketId) {
      ioInstance.to(socketId).emit('goalApproved', goalData);
      logger.info(`Goal approval notification sent to user ${userId}`);
      return true;
    } else {
      logger.info(`User ${userId} is offline, goal approval notification will be delivered when they connect`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending goal approval notification:`, error);
    return false;
  }
};

// Specific function to notify a client about goal rejection
export const notifyGoalRejection = (userId, goalData) => {
  if (!ioInstance) {
    logger.error('Socket.io instance not initialized');
    return false;
  }
  
  try {
    const socketId = activeUsers.get(userId.toString());
    if (socketId) {
      ioInstance.to(socketId).emit('goalRejected', goalData);
      logger.info(`Goal rejection notification sent to user ${userId}`);
      return true;
    } else {
      logger.info(`User ${userId} is offline, goal rejection notification will be delivered when they connect`);
      return false;
    }
  } catch (error) {
    logger.error(`Error sending goal rejection notification:`, error);
    return false;
  }
};
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import logger from './utils/logger.js';

// Store active users and their socket connections
export const activeUsers = new Map();
let ioInstance;

export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'], // Allow client URLs
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000, // Increase timeout to prevent frequent disconnections
    pingInterval: 25000, // More frequent pings to keep connections alive
  });

  ioInstance.on('connection', (socket) => {
    logger.info('A user connected:', socket.id);

    // Listen for user registration (when a user logs in)
    socket.on('register', (userId) => {
      if (!userId) {
        logger.warn('Attempted to register socket with invalid userId:', userId);
        return;
      }
      
      // Store the previous socket ID if it exists
      const previousSocketId = activeUsers.get(userId);
      
      // If there was a previous socket, log it
      if (previousSocketId && previousSocketId !== socket.id) {
        logger.info(`User ${userId} was already registered with socket ID ${previousSocketId}, updating to ${socket.id}`);
      }
      
      // Update the socket ID for this user
      activeUsers.set(userId, socket.id);
      logger.info(`User ${userId} registered with socket ID ${socket.id}`);
      
      // Immediately acknowledge registration success to the client
      socket.emit('registrationSuccess', { userId });
    });

    // Handle sending a message
    socket.on('sendMessage', async ({ senderId, receiverId, content, timestamp, file, subscriptionId }) => {
      try {
        // Basic validation
        if (!senderId || !receiverId) {
          logger.error('Missing required fields in sendMessage event');
          socket.emit('messageError', { error: 'Missing required fields' });
          return;
        }

        // Generate a unique ID for the message
        const messageId = new mongoose.Types.ObjectId().toString();

        // Create message object
        const messageObj = {
          _id: messageId,
          sender: senderId,
          content: content || '',
          timestamp: timestamp || new Date().toISOString(),
          read: false,
          file: Array.isArray(file) ? file : []
        };
        
        // Send a confirmation back to the sender
        socket.emit('messageSent', {
          messageId,
          receiverId,
          status: 'sent',
          subscriptionId
        });

        // Find the receiver's socket ID
        const receiverSocketId = activeUsers.get(receiverId);
        logger.info(`Receiver ${receiverId} socket ID:`, receiverSocketId);

        if (receiverSocketId) {
          // Emit the message to the receiver with the subscriptionId
          ioInstance.to(receiverSocketId).emit('receiveMessage', {
            ...messageObj,
            subscriptionId
          });
          
          // Update message status to delivered
          socket.emit('messageSent', {
            messageId,
            receiverId,
            status: 'delivered',
            subscriptionId
          });
          
          logger.info(`Message ${messageId} sent from ${senderId} to ${receiverId} in subscription ${subscriptionId}`);
        } else {
          logger.info(`Receiver ${receiverId} is offline, message will be delivered when they reconnect`);
        }
      } catch (error) {
        logger.error('Error handling sendMessage event:', error);
        socket.emit('messageError', { error: error.message });
      }
    });

    // Handle typing events
    socket.on('typing', ({ senderId, receiverId, isTyping }) => {
      if (!senderId || !receiverId) {
        logger.error('Missing required fields in typing event');
        return;
      }
      
      const receiverSocketId = activeUsers.get(receiverId);
      
      if (receiverSocketId) {
        ioInstance.to(receiverSocketId).emit('typing', {
          senderId,
          isTyping,
          timestamp: Date.now() // Add timestamp for freshness
        });
        logger.debug(`Typing event (${isTyping ? 'started' : 'stopped'}) sent from ${senderId} to ${receiverId}`);
      } else {
        logger.debug(`Cannot send typing event: Receiver ${receiverId} is offline`);
      }
    });

    // Listen for messagesRead event with immediate socket relay
    socket.on('messagesRead', ({ subscriptionId, messageIds, receiverId }) => {
      if (!subscriptionId || !messageIds || !Array.isArray(messageIds) || !messageIds.length) {
        logger.error('Invalid messagesRead event data');
        return;
      }

      if (!receiverId) {
        logger.error('Missing receiverId in messagesRead event');
        return;
      }

      const readerId = socket.userId || socket.handshake.auth.userId;
      
      // Log for debugging
      logger.info(`Read receipt requested: Subscription: ${subscriptionId}, Messages: ${messageIds.length}, To: ${receiverId}, From: ${readerId || 'unknown'}`);

      const receiverSocketId = activeUsers.get(receiverId);
      
      // Send read receipt to the sender of the message first (important for real-time updates)
      if (receiverSocketId) {
        // Extract the sender ID from the socket or request
        const senderId = readerId || 'unknown';
        
        // Send the read receipt to the message sender
        ioInstance.to(receiverSocketId).emit('messagesRead', {
          subscriptionId,
          messageIds,
          readerId: senderId,
          timestamp: Date.now()
        });
        
        logger.info(`Read receipts sent to ${receiverId} for ${messageIds.length} messages in subscription ${subscriptionId}`);
        
        // Also send confirmation back to the reader
        socket.emit('readReceiptSent', {
          subscriptionId,
          messageIds,
          receiverId,
          success: true
        });
      } else {
        logger.info(`Receiver ${receiverId} is offline, read receipts will be delivered when they reconnect`);
        
        // Send a failed confirmation back to the reader
        socket.emit('readReceiptSent', {
          subscriptionId, 
          messageIds,
          receiverId,
          success: false
        });
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      let disconnectedUser = null;
      
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUser = userId;
          break;
        }
      }
      
      if (disconnectedUser) {
        // Do not remove the user from activeUsers immediately
        // This allows the user to reconnect without losing their registered status
        logger.info(`User ${disconnectedUser} disconnected, but keeping record for potential reconnection`);
        
        // Set a timeout to remove the user if they don't reconnect within 5 minutes
        setTimeout(() => {
          // Only remove if the socket ID still matches
          if (activeUsers.get(disconnectedUser) === socket.id) {
            activeUsers.delete(disconnectedUser);
            logger.info(`User ${disconnectedUser} removed after timeout`);
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
      
      logger.info('Socket disconnected:', socket.id);
    });
  });

  return ioInstance;
};

// Export the io instance
export const getIoInstance = () => ioInstance;
import { Server } from 'socket.io';
import mongoose from 'mongoose';

// Store active users and their socket connections
export const activeUsers = new Map();
let ioInstance;

export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'], // Allow client URLs
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for user registration (when a user logs in)
    socket.on('register', (userId) => {
      if (!userId) {
        console.warn('Attempted to register socket with invalid userId:', userId);
        return;
      }
      
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ID ${socket.id}`);
      console.log('Current active users:', Array.from(activeUsers.entries()));
    });

    // Handle sending a message
    socket.on('sendMessage', async ({ senderId, receiverId, content, timestamp, file }) => {
      try {
        // Log incoming data for debugging
        console.log('sendMessage event received:', { senderId, receiverId });
        
        // Basic validation
        if (!senderId || !receiverId) {
          console.error('Missing required fields in sendMessage event');
          return;
        }

        // Find the receiver's socket ID
        const receiverSocketId = activeUsers.get(receiverId);
        console.log(`Receiver ${receiverId} socket ID:`, receiverSocketId);

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
          status: 'delivered'
        });

        if (receiverSocketId) {
          // Emit the message to the receiver
          ioInstance.to(receiverSocketId).emit('receiveMessage', messageObj);
          console.log(`Message sent from ${senderId} to ${receiverId}`);
        } else {
          console.log(`Receiver ${receiverId} is offline, message will be delivered when they reconnect`);
        }
      } catch (error) {
        console.error('Error handling sendMessage event:', error);
        socket.emit('messageError', { error: error.message });
      }
    });

    // Handle typing events
    socket.on('typing', ({ senderId, receiverId, isTyping }) => {
      if (!senderId || !receiverId) {
        console.error('Missing required fields in typing event');
        return;
      }
      
      const receiverSocketId = activeUsers.get(receiverId);
      console.log(`Typing event: ${senderId} is ${isTyping ? 'typing' : 'not typing'} for ${receiverId}`);
      
      if (receiverSocketId) {
        ioInstance.to(receiverSocketId).emit('typing', {
          senderId,
          isTyping,
          timestamp: Date.now() // Add timestamp for freshness
        });
        console.log(`Typing event sent to socket ${receiverSocketId}`);
      } else {
        console.log(`Receiver ${receiverId} is offline, typing event not delivered`);
      }
    });

    // Listen for messagesRead event
    socket.on('messagesRead', ({ subscriptionId, messageIds, receiverId }) => {
      if (!subscriptionId || !messageIds || !Array.isArray(messageIds)) {
        console.error('Invalid messagesRead event data');
        return;
      }

      if (!receiverId) {
        console.error('Missing receiverId in messagesRead event');
        return;
      }

      const receiverSocketId = activeUsers.get(receiverId);
      console.log(`Messages read event: Subscription ${subscriptionId}, messages: ${messageIds.join(', ')}`);
      console.log(`Receiver ${receiverId} socket ID:`, receiverSocketId);
      
      if (receiverSocketId) {
        ioInstance.to(receiverSocketId).emit('messagesRead', {
          subscriptionId,
          messageIds,
          timestamp: Date.now()
        });
        console.log(`Read receipts sent to ${receiverId}`);
      } else {
        console.log(`Receiver ${receiverId} is offline, read receipts not delivered`);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      let disconnectedUser = null;
      
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUser = userId;
          activeUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      
      console.log('Active users after disconnect:', Array.from(activeUsers.entries()));
    });
  });

  return ioInstance;
};

// Export the io instance
export const getIoInstance = () => ioInstance;
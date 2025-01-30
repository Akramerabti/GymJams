// socketServer.js
import { Server } from 'socket.io';

// Store active users and their socket connections
const activeUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for user registration (when a user logs in)
    socket.on('register', (userId) => {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ID ${socket.id}`);
    });

    // Listen for incoming messages
    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        // Emit the message to the receiver
        io.to(receiverSocketId).emit('receiveMessage', {
          senderId,
          content,
          timestamp: new Date(),
        });
        console.log(`Message sent from ${senderId} to ${receiverId}`);
      } else {
        console.log(`Receiver ${receiverId} is offline`);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};
import { Server } from 'socket.io';

// Store active users and their socket connections
const activeUsers = new Map();

let ioInstance;

export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
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
        ioInstance.to(receiverSocketId).emit('receiveMessage', {
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

  return ioInstance;
};

// Export the io instance
export const getIoInstance = () => ioInstance;
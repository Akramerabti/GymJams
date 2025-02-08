import { Server } from 'socket.io';

// Store active users and their socket connections
const activeUsers = new Map();
let ioInstance;

export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:5173'], // Allow client URLs
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
    socket.on('sendMessage', async ({ senderId, receiverId, content, timestamp, file }) => {

      console.log('files:', file);
      try {
        // Validate the files field
        if (file && !Array.isArray(file)) {
          console.error('Invalid files data. Expected an array.');
          return;
        }

        // Ensure each file has the required properties
        if (file?.some((file) => !file.path || !file.type)) {
          console.error('Invalid file metadata. Each file must have a path and type.');
          return;
        }

        // Find the receiver's socket ID
        const receiverSocketId = activeUsers.get(receiverId);

        if (receiverSocketId) {
          // Emit the message to the receiver
          console.log('filesssssssssssssssssssssssssss:', file);
          ioInstance.to(receiverSocketId).emit('receiveMessage', {
            senderId,
            content: content || '', // Optional content
            file: file || [], // Ensure files is always an array
            timestamp: timestamp, // Use ISO string for consistency
          });

          console.log(`Message sent from ${senderId} to ${receiverId}`);
        } else {
          console.log(`Receiver ${receiverId} is offline`);
        }
      } catch (error) {
        console.error('Error handling sendMessage event:', error);
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
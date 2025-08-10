import { Server } from 'socket.io';

export const setupGymBrosSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register user for location updates
    socket.on('register', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered for real-time updates`);
    });

    // Handle user location updates
    socket.on('update_location', (locationData) => {
      if (socket.userId) {
        // Broadcast location update to all connected clients
        socket.broadcast.emit('user_location_update', {
          userId: socket.userId,
          location: locationData,
          timestamp: new Date()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  return io;
};
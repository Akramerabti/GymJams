import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './stores/authStore';
import { toast } from 'sonner';
import { Award, AlertTriangle } from 'lucide-react';

// Create context with a default value
const SocketContext = createContext({
  socket: null,
  notifications: []
});

// Separate named export for the hook - this is important for Fast Refresh
export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  const [socketState, setSocketState] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null); // Keep a stable reference to socket
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket connection only once
    if (!socketRef.current) {
      console.log("Initializing socket connection...");
      
      // Extract the base URL without any paths
      const getBaseUrl = (url) => {
        if (!url) return 'http://localhost:5000';
        try {
          const parsed = new URL(url);
          return `${parsed.protocol}//${parsed.host}`;
        } catch (e) {
          console.error("Invalid URL:", url, e);
          return 'http://localhost:5000';
        }
      };
      
      const baseUrl = getBaseUrl(import.meta.env.VITE_API_URL);
      console.log("Using socket base URL:", baseUrl);
      
      // Create socket connection with the correct base URL
      const socketInstance = io(baseUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'], // Allow fallback to polling
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Setup socket event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully with ID:', socketInstance.id);
        
        // Register user with socket when authenticated
        if (isAuthenticated && user) {
          const userId = user.id || user._id;
          if (userId) {
            console.log('Registering user with socket on connect:', userId);
            socketInstance.emit('register', userId);
          }
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // Add listeners for goal approvals and rejections
      socketInstance.on('goalApproved', (data) => {
        console.log('Goal approved event received:', data);
        const { goalId, title, pointsAwarded } = data;
        
        // Show toast notification
        toast.success(
          `Goal Completed: ${title}`,
          {
            description: `Your coach approved your goal! You earned ${pointsAwarded} points.`,
            icon: <Award className="w-6 h-6 text-yellow-500" />,
            duration: 6000
          }
        );
        
        // Play success sound if available
        if (window.Audio) {
          try {
            const successSound = new Audio('/sounds/success.mp3');
            successSound.play().catch(e => console.log('Sound play failed:', e));
          } catch (e) {
            console.log('Sound initialization failed:', e);
          }
        }
        
        // Add notification
        setNotifications(prev => [
          ...prev,
          {
            type: 'goal-approval',
            goalId,
            title,
            pointsAwarded,
            timestamp: new Date().toISOString()
          }
        ]);
      });
      
      socketInstance.on('goalRejected', (data) => {
        console.log('Goal rejected event received:', data);
        const { goalId, title, reason } = data;
        
        // Show toast notification
        toast.error(
          `Goal Completion Rejected: ${title}`,
          {
            description: reason || 'Your coach has requested more progress on this goal.',
            duration: 6000
          }
        );
        
        // Add notification
        setNotifications(prev => [
          ...prev,
          {
            type: 'goal-rejection',
            goalId,
            title,
            reason,
            timestamp: new Date().toISOString()
          }
        ]);
      });
      
      // Store in both state and ref
      socketRef.current = socketInstance;
      setSocketState(socketInstance);
    }

    // Cleanup function - only runs when component unmounts
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket on cleanup");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Re-register user when auth state changes
  useEffect(() => {
    if (socketRef.current && isAuthenticated && user) {
      const userId = user.id || user._id;
      if (userId) {
        console.log('Re-registering user with socket on auth change:', userId);
        
        // Check if socket is connected
        if (socketRef.current.connected) {
          socketRef.current.emit('register', userId);
        } else {
          // Add one-time connect listener if not connected
          const handleConnect = () => {
            console.log('Socket reconnected, registering user:', userId);
            socketRef.current.emit('register', userId);
            socketRef.current.off('connect', handleConnect);
          };
          
          socketRef.current.once('connect', handleConnect);
        }
      }
    }
  }, [isAuthenticated, user]);

  // Create the context value object
  const contextValue = {
    socket: socketRef.current,
    notifications
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
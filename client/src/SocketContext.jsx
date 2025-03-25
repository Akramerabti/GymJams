import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './stores/authStore';
import { toast } from 'sonner';
import { Award, AlertTriangle, Wifi } from 'lucide-react';

// Create context with a default value
const SocketContext = createContext({
  socket: null,
  notifications: [],
  connected: false,
  connecting: false,
  reconnect: () => {}
});

// Separate named export for the hook - this is important for Fast Refresh
export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null); // Keep a stable reference to socket
  const initAttemptsRef = useRef(0);

  // Initialize or reconnect socket
  const initializeSocket = useCallback(() => {
    // Don't initialize multiple times
    if (connecting || (socketRef.current && socketRef.current.connected)) {
      return;
    }

    setConnecting(true);
    initAttemptsRef.current += 1;
    console.log(`Initializing socket connection (attempt #${initAttemptsRef.current})...`);
    
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
    
    try {
      // Create socket connection with the correct base URL
      const socketInstance = io(baseUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'], // Allow fallback to polling
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000, // 10 second connection timeout
      });

      // Setup socket event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully with ID:', socketInstance.id);
        setConnected(true);
        setConnecting(false);
        
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
        setConnected(false);
        setConnecting(false);
        
        if (initAttemptsRef.current < 3) {
          // Show error only after multiple failed attempts
          console.log("Will retry socket connection automatically");
        } else {
          toast.error('Connection issue', {
            description: 'Having trouble connecting to chat service',
            icon: <Wifi className="text-orange-500" />
          });
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        setConnecting(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setConnected(false);
        setConnecting(false);
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
    } catch (error) {
      console.error("Error initializing socket:", error);
      socketRef.current = null;
      setConnected(false);
      setConnecting(false);
      
      // Show error toast
      toast.error('Connection issue', {
        description: 'Having trouble connecting to chat service',
        icon: <Wifi className="text-orange-500" />
      });
    }
  }, [isAuthenticated, user]);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    // Cleanup function - only runs when component unmounts
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket on cleanup");
        try {
          socketRef.current.disconnect();
        } catch (err) {
          console.error("Error disconnecting socket:", err);
        }
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [initializeSocket]);

  // Re-register user when auth state changes
  useEffect(() => {
    if (socketRef.current && isAuthenticated && user) {
      const userId = user.id || user._id;
      if (userId) {
        console.log('Re-registering user with socket on auth change:', userId);
        
        // Check if socket is connected
        if (socketRef.current.connected) {
          try {
            socketRef.current.emit('register', userId);
          } catch (err) {
            console.error("Error emitting register event:", err);
          }
        } else {
          // Add one-time connect listener if not connected
          const handleConnect = () => {
            console.log('Socket reconnected, registering user:', userId);
            try {
              socketRef.current.emit('register', userId);
              socketRef.current.off('connect', handleConnect);
            } catch (err) {
              console.error("Error in connect handler:", err);
            }
          };
          
          try {
            socketRef.current.once('connect', handleConnect);
          } catch (err) {
            console.error("Error adding connect handler:", err);
          }
        }
      }
    }
  }, [isAuthenticated, user]);

  // Create the context value object
  const contextValue = {
    socket: socketRef.current, // Provide the socket instance
    notifications,
    connected,
    connecting,
    reconnect: initializeSocket
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './stores/authStore';
import { toast } from 'sonner';
import { Award, AlertTriangle } from 'lucide-react';

const SocketContext = createContext({
  socket: null,
  notifications: [],
  connected: false,
  connecting: false
});

export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize socket connection only once
    if (!socketRef.current) {
      setConnecting(true);
      //("Initializing socket connection...");
      
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
      //("Using socket base URL:", baseUrl);
      
      const socketInstance = io(baseUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        //('Socket connected successfully with ID:', socketInstance.id);
        setConnected(true);
        setConnecting(false);
        
        if (isAuthenticated && user) {
          const userId = user.id || user._id;
          if (userId) {
            //('Registering user with socket on connect:', userId);
            socketInstance.emit('register', userId);
          }
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
        setConnecting(false);
      });

      socketInstance.on('disconnect', (reason) => {
        //('Socket disconnected:', reason);
        setConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setConnected(false);
      });
      
      // Add listeners for goal approvals and rejections
      socketInstance.on('goalApproved', (data) => {
        //('Goal approved event received:', data);
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
        //('Goal rejected event received:', data);
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
      
      socketRef.current = socketInstance;
    }

    return () => {
      if (socketRef.current) {
        //("Disconnecting socket on cleanup");
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
        setConnecting(false);
      }
    };
  }, [isAuthenticated, user]);

  // Re-register user when auth state changes
  useEffect(() => {
    if (socketRef.current && isAuthenticated && user) {
      const userId = user.id || user._id;
      if (userId) {
        //('Re-registering user with socket on auth change:', userId);
        
        if (socketRef.current.connected) {
          socketRef.current.emit('register', userId);
        } else {
          const handleConnect = () => {
            socketRef.current.emit('register', userId);
            socketRef.current.off('connect', handleConnect);
          };
          socketRef.current.once('connect', handleConnect);
        }
      }
    }
  }, [isAuthenticated, user]);

  const contextValue = {
    socket: socketRef.current,
    notifications,
    connected,
    connecting
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
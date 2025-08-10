import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './stores/authStore';
import { toast } from 'sonner';
import { Award, AlertTriangle, MapPin, Users } from 'lucide-react';
import useGymBrosData from '../src/hooks/useGymBrosData';

const SocketContext = createContext({
  socket: null,
  notifications: [],
  connected: false,
  connecting: false,
  mapUpdates: {
    users: new Map(),
    gyms: new Map(),
    lastUpdate: null
  },
  subscribeToMapUpdates: () => {},
  unsubscribeFromMapUpdates: () => {},
  updateUserLocation: () => {},
  getRealtimeUsers: () => [],
  getRealtimeGyms: () => []
});

export function useSocket() {
  return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [mapUpdates, setMapUpdates] = useState({
    users: new Map(),
    gyms: new Map(),
    lastUpdate: null
  });
   const { invalidate } = useGymBrosData();
  const socketRef = useRef(null);
  const mapSubscriptionsRef = useRef(new Set());
  const lastLocationUpdateRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);
  
  const { user, isAuthenticated } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      setConnecting(true);
      
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
      
      const socketInstance = io(baseUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('🔌 Socket connected successfully with ID:', socketInstance.id);
        setConnected(true);
        setConnecting(false);
        
        if (isAuthenticated && user) {
          const userId = user.id || user._id;
          if (userId) {
            console.log('👤 Registering user with socket:', userId);
            socketInstance.emit('register', userId);
          }
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnected(false);
        setConnecting(false);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('❌ Socket error:', error);
        setConnected(false);
      });
      
      // Existing goal approval/rejection listeners
      socketInstance.on('goalApproved', (data) => {
        const { goalId, title, pointsAwarded } = data;
        
        toast.success(
          `Goal Completed: ${title}`,
          {
            description: `Your coach approved your goal! You earned ${pointsAwarded} points.`,
            icon: <Award className="w-6 h-6 text-yellow-500" />,
            duration: 6000
          }
        );
        
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
        const { goalId, title, reason } = data;
        
        toast.error(
          `Goal Completion Rejected: ${title}`,
          {
            description: reason || 'Your coach has requested more progress on this goal.',
            duration: 6000
          }
        );
        
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

        socketInstance.on('userLocationUpdate', (data) => {
        console.log('📍 Received user location update:', data);
        setMapUpdates(prev => {
          const newUsers = new Map(prev.users);
          newUsers.set(data.userId, {
            ...data,
            timestamp: Date.now()
          });
          
          return {
            ...prev,
            users: newUsers,
            lastUpdate: Date.now()
          };
        });

        invalidate('users');
      });

      socketInstance.on('userOffline', (data) => {
        console.log('😴 User went offline:', data.userId);
        setMapUpdates(prev => {
          const newUsers = new Map(prev.users);
          const existingUser = newUsers.get(data.userId);
          if (existingUser) {
            newUsers.set(data.userId, {
              ...existingUser,
              isOnline: false,
              timestamp: Date.now()
            });
          }
          
          return {
            ...prev,
            users: newUsers,
            lastUpdate: Date.now()
          };
        });
      });

      socketInstance.on('gymCreated', (data) => {
        console.log('🏋️ New gym created:', data.gym.name);
        setMapUpdates(prev => {
          const newGyms = new Map(prev.gyms);
          newGyms.set(data.gym._id, {
            ...data.gym,
            isNew: true,
            timestamp: Date.now()
          });
          
          return {
            ...prev,
            gyms: newGyms,
            lastUpdate: Date.now()
          };
        });

        // Show toast notification for nearby gym creation
        if (data.gym.distanceMiles && data.gym.distanceMiles < 5) {
          toast.info(
            `New gym nearby: ${data.gym.name}`,
            {
              description: `A new ${data.gym.type} was added ${data.gym.distanceMiles} miles away.`,
              icon: <MapPin className="w-5 h-5 text-blue-500" />,
              duration: 4000
            }
          );
        }
      });

      socketInstance.on('gymUpdated', (data) => {
        console.log('🏋️ Gym updated:', data.gym.name);
        setMapUpdates(prev => {
          const newGyms = new Map(prev.gyms);
          newGyms.set(data.gym._id, {
            ...data.gym,
            isUpdated: true,
            timestamp: Date.now()
          });
          
          return {
            ...prev,
            gyms: newGyms,
            lastUpdate: Date.now()
          };
        });
        invalidate('gyms');
      });

      // Listen for match notifications with location context
      socketInstance.on('newMatch', (data) => {
        console.log('💪 New match:', data);
        
        toast.success(
          `New Gym Partner Match!`,
          {
            description: `You matched with ${data.matchedUser.name} nearby!`,
            icon: <Users className="w-5 h-5 text-green-500" />,
            duration: 6000
          }
        );

        setNotifications(prev => [
          ...prev,
          {
            type: 'new-match',
            match: data,
            timestamp: new Date().toISOString()
          }
        ]);

        invalidate('profiles');
        invalidate('matches');
      });
      
      socketRef.current = socketInstance;
    }

    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket on cleanup");
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
        console.log('👤 Re-registering user with socket:', userId);
        
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

  // Subscribe to map updates for a specific viewport
  const subscribeToMapUpdates = useCallback((bounds, zoom) => {
    if (!socketRef.current || !connected) return;

    const subscription = {
      bounds: {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west
      },
      zoom: zoom,
      timestamp: Date.now()
    };

    console.log('🗺️ Subscribing to map updates:', subscription);
    socketRef.current.emit('subscribeToMapUpdates', subscription);
    mapSubscriptionsRef.current.add(JSON.stringify(subscription));
  }, [connected]);

  // Unsubscribe from map updates
  const unsubscribeFromMapUpdates = useCallback(() => {
    if (!socketRef.current || !connected) return;

    console.log('🗺️ Unsubscribing from map updates');
    socketRef.current.emit('unsubscribeFromMapUpdates');
    mapSubscriptionsRef.current.clear();
  }, [connected]);

  // Send real-time location update
  const updateUserLocation = useCallback((location, accuracy = 'medium') => {
    if (!socketRef.current || !connected || !user) return;

    // Throttle location updates to prevent spam (max once per 30 seconds)
    const now = Date.now();
    if (lastLocationUpdateRef.current && now - lastLocationUpdateRef.current < 30000) {
      return;
    }

    const locationData = {
      lat: location.lat,
      lng: location.lng,
      accuracy: accuracy,
      timestamp: now
    };

    console.log('📍 Sending location update:', locationData);
    socketRef.current.emit('locationUpdate', locationData);
    lastLocationUpdateRef.current = now;

    // Also send to our REST API for persistence
    if (typeof updateUserLocationRealtime === 'function') {
      updateUserLocationRealtime(locationData);
    }
  }, [connected, user]);

  // Get current real-time users in map area
  const getRealtimeUsers = useCallback((bounds) => {
    if (!bounds) return [];

    const users = Array.from(mapUpdates.users.values()).filter(user => {
      if (!user.location) return false;
      
      const { lat, lng } = user.location;
      return lat >= bounds.south && 
             lat <= bounds.north && 
             lng >= bounds.west && 
             lng <= bounds.east;
    });

    // Remove stale entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return users.filter(user => user.timestamp > fiveMinutesAgo);
  }, [mapUpdates.users]);

  // Get current real-time gyms in map area
  const getRealtimeGyms = useCallback((bounds) => {
    if (!bounds) return [];

    const gyms = Array.from(mapUpdates.gyms.values()).filter(gym => {
      if (!gym.location) return false;
      
      const { lat, lng } = gym.location;
      return lat >= bounds.south && 
             lat <= bounds.north && 
             lng >= bounds.west && 
             lng <= bounds.east;
    });

    // Keep gym updates for longer (30 minutes)
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    return gyms.filter(gym => gym.timestamp > thirtyMinutesAgo);
  }, [mapUpdates.gyms]);

  // Cleanup stale map data periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const thirtyMinutesAgo = now - 30 * 60 * 1000;

      setMapUpdates(prev => {
        const newUsers = new Map();
        const newGyms = new Map();

        // Keep recent user updates
        for (const [id, user] of prev.users.entries()) {
          if (user.timestamp > fiveMinutesAgo) {
            newUsers.set(id, user);
          }
        }

        // Keep recent gym updates
        for (const [id, gym] of prev.gyms.entries()) {
          if (gym.timestamp > thirtyMinutesAgo) {
            newGyms.set(id, gym);
          }
        }

        return {
          users: newUsers,
          gyms: newGyms,
          lastUpdate: prev.lastUpdate
        };
      });
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  // Auto-send location updates when user is active
  useEffect(() => {
    if (!connected || !user) return;

    // Get user location and send updates every 2 minutes when active
    if (navigator.geolocation) {
      const startLocationTracking = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }, position.coords.accuracy < 100 ? 'high' : 'medium');
          },
          (error) => {
            console.warn('📍 Location access denied or failed:', error);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
        );
      };

      // Send initial location
      startLocationTracking();

      // Set up interval for periodic updates
      locationUpdateIntervalRef.current = setInterval(startLocationTracking, 2 * 60 * 1000);
    }

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [connected, user, updateUserLocation]);

  const contextValue = {
    socket: socketRef.current,
    notifications,
    connected,
    connecting,
    mapUpdates,
    subscribeToMapUpdates,
    unsubscribeFromMapUpdates,
    updateUserLocation,
    getRealtimeUsers,
    getRealtimeGyms
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
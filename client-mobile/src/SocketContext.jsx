// Updated SocketContext.jsx - Uses PermissionsContext instead of direct GPS
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './stores/authStore';
import { usePermissions } from './contexts/PermissionContext'; // 🚀 NEW - Use PermissionsContext
import { toast } from 'sonner';
import { Award, AlertTriangle, MapPin, Users } from 'lucide-react';
import useGymBrosData from '../src/hooks/useGymBrosData';
import gymBrosLocationService from './services/gymBrosLocation.service';

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
  
  // 🚀 Smart Location Update States
  const [isAppActive, setIsAppActive] = useState(true);
  const [isMapActive, setIsMapActive] = useState(false);
  const [isOnHomePage, setIsOnHomePage] = useState(false);
  const [isOnCoachingPage, setIsOnCoachingPage] = useState(false);
  const [userActivity, setUserActivity] = useState('normal'); // 'active', 'normal', 'background'
  
  const { invalidate } = useGymBrosData();
  const socketRef = useRef(null);
  const mapSubscriptionsRef = useRef(new Set());
  const lastLocationUpdateRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  
  const { user, isAuthenticated } = useAuth();
  
  // 🚀 NEW - Use PermissionsContext instead of direct GPS
  const { 
    hasLocationPermission, 
    currentLocation, 
    updateLocation,
    isInitialized: permissionsInitialized 
  } = usePermissions();

  // 🚀 Smart Update System - Track app and map activity
  useEffect(() => {
    // Track app state changes (foreground/background)
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsAppActive(isVisible);
      lastActivityRef.current = Date.now();
      
      console.log('📱 App visibility changed:', isVisible ? 'foreground' : 'background');
      
      // Update activity level
      if (isVisible && isMapActive) {
        setUserActivity('active');
      } else if (isVisible) {
        setUserActivity('normal');
      } else {
        setUserActivity('background');
      }
    };

    // Track user interactions (mouse, touch, scroll)
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      if (isAppActive) {
        setUserActivity(isMapActive ? 'active' : 'normal');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);

    // Check for inactivity every minute
    const inactivityChecker = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const isInactive = timeSinceActivity > 5 * 60 * 1000; // 5 minutes of inactivity
      
      if (isInactive && userActivity === 'active') {
        console.log('😴 User inactive for 5+ minutes, reducing location frequency');
        setUserActivity(isAppActive ? 'normal' : 'background');
      }
    }, 60 * 1000); // Check every minute

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      clearInterval(inactivityChecker);
    };
  }, [isAppActive, isMapActive, userActivity]);

  // 🚀 Helper function to get smart update interval
  const getUpdateInterval = useCallback(() => {
    switch (userActivity) {
      case 'active':   // User actively using map
        return 1 * 60 * 1000;    // 1 minute
      case 'normal':   // App open but not actively using map
        return 3 * 60 * 1000;    // 3 minutes  
      case 'background': // App in background
        return 10 * 60 * 1000;   // 10 minutes
      default:
        return 5 * 60 * 1000;    // 5 minutes default
    }
  }, [userActivity]);

  // 🚀 Function to set map activity (call this from GymBrosMap)
  const setMapActivityState = useCallback((isActive) => {
    setIsMapActive(isActive);
    lastActivityRef.current = Date.now();
    
    if (isActive && isAppActive) {
      setUserActivity('active');
      console.log('🗺️ Map is now active - increasing location update frequency');
    } else if (isAppActive) {
      setUserActivity('normal');
      console.log('🗺️ Map is now inactive - normal location update frequency');
    }
  }, [isAppActive]);

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
      
      // Clear location tracking
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
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

  // Send real-time location update with better throttling
  const updateUserLocation = useCallback((location, accuracy = 'medium') => {
    if (!socketRef.current || !connected || !user) return;

    // More aggressive throttling to prevent spam (max once per 5 minutes for home page)
    const now = Date.now();
    const minInterval = isOnHomePage ? 300000 : 120000; // 5 minutes on home, 2 minutes elsewhere
    if (lastLocationUpdateRef.current && now - lastLocationUpdateRef.current < minInterval) {
      console.log('📍 Location update skipped (too recent)', {
        isOnHomePage,
        minInterval: `${minInterval / 1000}s`,
        timeSinceLastUpdate: `${(now - lastLocationUpdateRef.current) / 1000}s`
      });
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

  // 🚀 SMART - Use PermissionsContext location for adaptive auto-updates
  useEffect(() => {
    if (!connected || !user || !permissionsInitialized) {
      console.log('🔄 SocketContext: Skipping location update - not ready', {
        connected,
        hasUser: !!user,
        permissionsInitialized
      });
      return;
    }

    // Only proceed if we have location permission
    if (!hasLocationPermission) {
      console.log('🔄 SocketContext: Skipping location update - no permission');
      return;
    }

    // Function to send location update to socket
    const sendLocationUpdate = async (forceRefresh = false) => {
      try {
        // 🚫 Skip location updates when on home or coaching pages
        if (isOnHomePage || isOnCoachingPage) {
          console.log('🚫 SocketContext: Skipping location update - on home or coaching page', {
            isOnHomePage,
            isOnCoachingPage,
            forceRefresh
          });
          return;
        }

        console.log('📍 SocketContext: Proceeding with location update (not on restricted pages)', {
          isOnHomePage,
          isOnCoachingPage,
          forceRefresh
        });

        console.log('📍 SocketContext: Preparing to send location update', {
          forceRefresh,
          currentLocation: !!currentLocation,
          userActivity,
          updateInterval: getUpdateInterval(),
          timestamp: new Date().toISOString()
        });
        
        let locationToUse = currentLocation;
        
        // Force a fresh location update if requested or if we don't have current location
        if (forceRefresh || !currentLocation) {
          console.log('🛰️ SocketContext: Requesting fresh location from PermissionsContext');
          locationToUse = await updateLocation(true); // Force fresh location
        }
        
        if (!locationToUse) {
          console.warn('⚠️ SocketContext: No location available after update attempt');
          return;
        }
        
        // Process location for backend compatibility
        const processedLocation = gymBrosLocationService.processLocationFromPermissions(locationToUse);
        
        if (processedLocation) {
          console.log('📤 SocketContext: Sending location update', {
            socketConnected: !!socketRef.current && connected,
            userActivity,
            processedLocation: {
              lat: processedLocation.lat,
              lng: processedLocation.lng,
              source: processedLocation.source,
              accuracy: processedLocation.accuracy,
              city: processedLocation.city
            }
          });
          
          // Send to socket if connected
          if (socketRef.current && connected) {
            updateUserLocation({
              lat: processedLocation.lat,
              lng: processedLocation.lng
            }, processedLocation.accuracy);
          }

          // Also sync with backend API
          const result = await gymBrosLocationService.updateUserLocationRealtime(processedLocation);
          
          if (result.success !== false) {
            console.log('✅ SocketContext: Location update completed successfully');
          } else {
            console.error('❌ SocketContext: Backend location update failed:', result);
          }
        }
      } catch (error) {
        console.error('❌ SocketContext: Location update failed:', {
          error: error.message,
          stack: error.stack
        });
        // Don't show toast for background sync failures unless it's critical
      }
    };

    // Clear existing interval
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }

    // 🚫 Skip location updates completely when on home or coaching pages
    if (isOnHomePage || isOnCoachingPage) {
      console.log('🚫 SocketContext: Skipping location update setup - on home or coaching page', {
        isOnHomePage,
        isOnCoachingPage
      });
      return () => {}; // Return empty cleanup function
    }

    // Send immediate location update on first connection (with forced refresh)
    const initialTimeout = setTimeout(() => {
      // Skip initial location update if on home page or coaching page
      if (isOnHomePage || isOnCoachingPage) {
        console.log('📍 SocketContext: Skipping initial location update (on home or coaching page)', {
          isOnHomePage,
          isOnCoachingPage
        });
        return;
      }
      
      console.log('🚀 SocketContext: Sending initial location update with fresh GPS');
      sendLocationUpdate(true); // Force fresh location on initial update
    }, 5000); // Wait 5 seconds for app to stabilize

    // Set up smart interval based on user activity
    const currentInterval = getUpdateInterval();
    console.log(`⚡ SocketContext: Setting up smart location updates`, {
      userActivity,
      interval: `${currentInterval / 1000}s`,
      description: userActivity === 'active' ? 'High frequency (map active)' :
                   userActivity === 'normal' ? 'Normal frequency (app active)' :
                   'Low frequency (background)'
    });

    let updateCount = 0;
    locationUpdateIntervalRef.current = setInterval(() => {
      updateCount++;
      // Force refresh more often when user is active
      const refreshFrequency = userActivity === 'active' ? 2 : 3; // Every 2 updates when active, 3 when normal
      const shouldForceRefresh = updateCount % refreshFrequency === 0;
      
      console.log(`⏰ SocketContext: Smart location update #${updateCount}`, {
        userActivity,
        willForceRefresh: shouldForceRefresh,
        currentInterval: `${currentInterval / 1000}s`
      });
      
      sendLocationUpdate(shouldForceRefresh);
    }, currentInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [connected, user, permissionsInitialized, hasLocationPermission, currentLocation, updateUserLocation, updateLocation, userActivity, getUpdateInterval, isOnHomePage, isOnCoachingPage]);

  // 🏠 Page tracking for smart location updates
  const setPageState = useCallback((pageName) => {
    const isHome = pageName === 'home' || pageName === '/';
    const isCoaching = pageName === 'coaching' || pageName.includes('coaching');
    setIsOnHomePage(isHome);
    setIsOnCoachingPage(isCoaching);
    console.log('📄 SocketContext: Page state updated', { 
      pageName, 
      isOnHomePage: isHome,
      isOnCoachingPage: isCoaching,
      willSkipLocationUpdates: isHome || isCoaching 
    });
  }, []);

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
    getRealtimeGyms,
    // 🚀 Smart location update controls
    setMapActivityState,
    setPageState,
    userActivity,
    isAppActive,
    isMapActive,
    isOnHomePage
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
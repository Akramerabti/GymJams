import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, AlertTriangle } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import { renderMouseAvatar, createMouseIcon, createGymIcon, createWavingMouseSVG } from './components/MouseAvatarUtils';
import MapSidePanel from './components/MapSidePanel';
import gymbrosService from '../../services/gymbros.service';
import { useSocket } from '../../SocketContext';
import { toast } from 'sonner';
import gymBrosLocationService from '../../services/gymBrosLocation.service';
import useGymBrosData from '../../hooks/useGymBrosData';

// Import clustering if available
let MarkerClusterGroup;
try {
  MarkerClusterGroup = require('react-leaflet-cluster').default;
} catch (e) {
  MarkerClusterGroup = null;
}

const DEFAULT_CENTER = [45.5017, -73.5673]; 

// Error display component
const ErrorDisplay = ({ error, onRetry, type = 'general' }) => {
  const getErrorMessage = () => {
    switch (type) {
      case 'users':
        return 'Failed to load gym partners';
      case 'gyms':
        return 'Failed to load gyms';
      case 'events':
        return 'Failed to load events';
      case 'location':
        return 'Failed to get your location';
      default:
        return 'Something went wrong';
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="font-medium text-red-800">{getErrorMessage()}</h3>
      </div>
      <p className="text-sm text-red-600 mb-3">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

const MapControls = ({ onSearch, onFilterToggle, loading, onRefresh, avatar, onAvatarClick, isTracking, onToggleTracking, trackingError }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 items-center">
      {/* Avatar Circle Button with tracking indicator */}
      <div className="relative">
        <button
          className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${
            isTracking ? 'border-green-400 shadow-green-200' : 'border-blue-400'
          } bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform mr-2 overflow-hidden`}
          onClick={onAvatarClick}
          title="Edit your Gym Mouse avatar"
          style={{ padding: '2px' }}
        >
          {renderMouseAvatar(avatar || {}, 44)}
        </button>
        
        {/* Tracking indicator */}
        {isTracking && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
            <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* Error indicator */}
        {trackingError && !isTracking && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white">
            <div className="w-full h-full bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
          placeholder="Search gym partners, gyms, or events..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* Location tracking toggle button */}
      <button
        onClick={onToggleTracking}
        className={`p-2 rounded-lg border shadow-lg transition-colors ${
          isTracking 
            ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
        title={isTracking ? 'Stop location tracking' : 'Start location tracking'}
      >
        <MapPin className={`h-5 w-5 ${isTracking ? 'animate-pulse' : ''}`} />
      </button>

      <button
        onClick={onFilterToggle}
        className="bg-white p-2 rounded-lg border border-gray-300 shadow-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="h-5 w-5 text-gray-600" />
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="bg-white p-2 rounded-lg border border-gray-300 shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

// Map Update Component (handles center changes and zoom)
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};



// Filter Modal Component
const MapFilters = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Map Filters</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Show on Map</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.showUsers}
                  onChange={(e) => setLocalFilters({...localFilters, showUsers: e.target.checked})}
                  className="mr-2"
                />
                <Users className="h-4 w-4 mr-1" />
                Gym Partners
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.showGyms}
                  onChange={(e) => setLocalFilters({...localFilters, showGyms: e.target.checked})}
                  className="mr-2"
                />
                <Dumbbell className="h-4 w-4 mr-1" />
                Gyms
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.showEvents}
                  onChange={(e) => setLocalFilters({...localFilters, showEvents: e.target.checked})}
                  className="mr-2"
                />
                <Calendar className="h-4 w-4 mr-1" />
                Events
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.showCommunity}
                  onChange={(e) => setLocalFilters({...localFilters, showCommunity: e.target.checked})}
                  className="mr-2"
                />
                <Users className="h-4 w-4 mr-1 text-green-600" />
                Community Centers
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.showSportCenters}
                  onChange={(e) => setLocalFilters({...localFilters, showSportCenters: e.target.checked})}
                  className="mr-2"
                />
                <Building2 className="h-4 w-4 mr-1 text-orange-600" />
                Sport Centers
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.showOther}
                  onChange={(e) => setLocalFilters({...localFilters, showOther: e.target.checked})}
                  className="mr-2"
                />
                <MapPin className="h-4 w-4 mr-1 text-gray-600" />
                Other Locations
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Max Distance</label>
            <input
              type="range"
              min="1"
              max="100"
              value={localFilters.maxDistance}
              onChange={(e) => setLocalFilters({...localFilters, maxDistance: parseInt(e.target.value)})}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{localFilters.maxDistance} km</span>
          </div>
        </div>
        
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const TileLoadingIndicator = ({ isLoading, tileCount }) => {
  // Only show if we have a significant number of tiles loading AND it's been loading for a bit
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    let timer;
    
    if (isLoading && tileCount > 3) {
      timer = setTimeout(() => {
        setShowLoading(true);
      }, 800); // Wait 800ms before showing
    } else {
      setShowLoading(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, tileCount]);
  
  if (!showLoading) return null;
  
  return (
    <div className="absolute top-16 right-4 z-30 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs pointer-events-none">
      <div className="flex items-center gap-1">
        <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
        <span>Loading tiles...</span>
      </div>
    </div>
  );
};

// Update your enhancedMapStyles to hide the tile grid lines
const enhancedMapStyles = `
  .custom-leaflet-map .leaflet-control-zoom {
    display: none !important;
  }
  
  .custom-leaflet-map .leaflet-container {
    border-radius: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    background: #1e293b; /* Dark background */
    transition: filter 0.3s;
  }
  
  .gymbros-map-dark .leaflet-container {
    background: #1e293b !important; /* Force dark background */
  }
  
  /* HIDE THE WHITE GRID LINES */
  .custom-leaflet-map .leaflet-tile-pane {
    filter: none !important;
  }
  
  .custom-leaflet-map .leaflet-tile {
    border: none !important; /* Remove tile borders */
    outline: none !important; /* Remove tile outlines */
    box-shadow: none !important; /* Remove any shadows */
  }
  
  /* Hide tile container borders */
  .custom-leaflet-map .leaflet-tile-container {
    border: none !important;
    outline: none !important;
  }
  
  /* Force dark background for the entire map */
  .gymbros-map-dark {
    background: #1e293b !important;
  }
  
  .gymbros-map-dark .leaflet-tile-pane {
    background: #1e293b !important;
  }
  
  /* Remove any white backgrounds that might show through */
  .gymbros-map-dark .leaflet-map-pane {
    background: #1e293b !important;
  }
  
  /* Smooth tile transitions */
  .custom-leaflet-map .leaflet-tile-container {
    transition: opacity 0.3s ease-in-out !important;
  }
  
  .custom-leaflet-map .leaflet-tile {
    transition: opacity 0.2s ease-in-out !important;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
  }
  
  /* Loading state for tiles */
  .custom-leaflet-map .leaflet-tile-loaded {
    opacity: 1 !important;
  }
  
  .custom-leaflet-map .leaflet-tile-loading {
    opacity: 0.5 !important;
  }
  
  /* Custom marker optimizations */
  .custom-mouse-icon,
  .custom-gym-icon,
  .custom-event-icon,
  .custom-community-icon,
  .custom-sport-center-icon,
  .custom-other-icon {
    background: transparent !important;
    border: none !important;
    will-change: transform;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  
  /* Improve clustering performance */
  .marker-cluster {
    will-change: transform;
    transform: translateZ(0);
  }
  
  /* Smooth panning */
  .custom-leaflet-map .leaflet-map-pane {
    will-change: transform;
  }
`;

const MapEventHandler = ({ onMarkerClick, currentUserLocation, setTilesLoading }) => {
  const map = useMapEvents({
    click: (e) => {
      // Handle map clicks if needed
    },
    zoomstart: (e) => {
      // Only show loading for significant zoom changes
      const currentZoom = e.target.getZoom();
      // Don't show loading for small zoom changes
      if (Math.abs(e.target._zoom - currentZoom) > 1) {
        setTilesLoading(true);
      }
    },
    zoomend: (e) => {
      // Hide loading after zoom completes with delay
      setTimeout(() => setTilesLoading(false), 200);
    },
    movestart: (e) => {
      // Only show loading for significant moves (not small pans)
      // Don't trigger on small movements
    },
    moveend: (e) => {
      // Only trigger loading check if we moved significantly
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      
      // Much shorter delay and don't always trigger loading
      setTimeout(() => {
        setTilesLoading(false);
      }, 100);
    },
    // Remove the wheel handler - it's too aggressive
  });

  return null;
};


const isValidCoordinate = (lat, lng) => {
  return typeof lat === 'number' && typeof lng === 'number' && 
         !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Main GymBrosMap Component
const GymBrosMap = ({ userProfile }) => {
  const { 
    users, 
    gyms, 
    loading: dataLoading,
    fetchUsers, 
    fetchGyms,
    invalidate
  } = useGymBrosData();

  const [loading, setLoading] = useState(true);
  
  // Local state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef();
  const { socket, connected, subscribeToMapUpdates, unsubscribeFromMapUpdates } = useSocket();
  const [isLocationTracking, setIsLocationTracking] = useState(false);
const [trackingWatchId, setTrackingWatchId] = useState(null);
const [trackingError, setTrackingError] = useState(null);
const [tilesLoading, setTilesLoading] = useState(false);
const [tileLoadCount, setTileLoadCount] = useState(0);

  // Error states
  const [errors, setErrors] = useState({
    users: null,
    gyms: null,
    location: null
  });

  // Side panel state
  const [sidePanel, setSidePanel] = useState({
    isOpen: false,
    data: null,
    type: null
  });

  const [filters, setFilters] = useState({
    showUsers: true,
    showGyms: true,
    showEvents: true,
    showCommunity: true,
    showSportCenters: true,
    showOther: true,
    maxDistance: 25
  });

  // Avatar designer modal state
  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);

  // Use theme context for dark mode
  const { darkMode } = useTheme();

  const isLoading = loading || dataLoading.users || dataLoading.gyms;

  useEffect(() => {
  let watchId = null;
  
  const startLocationTracking = async () => {
    try {
      // Check if user wants location tracking (could be a setting)
      const shouldTrack = localStorage.getItem('gymBrosAutoTrack') !== 'false'; // Default to true
      
      if (!shouldTrack) {
        console.log('🚗 Auto-tracking disabled by user preference');
        return;
      }

      // Check location permission first
      const permissionState = await gymBrosLocationService.checkLocationPermission();
      
      if (permissionState === 'denied') {
        console.log('🚗 Location permission denied, cannot auto-track');
        setTrackingError('Location permission denied');
        return;
      }

      if (!navigator.geolocation) {
        console.log('🚗 Geolocation not supported');
        setTrackingError('Geolocation not supported');
        return;
      }

      console.log('🚗 Starting automatic location tracking...');
      setIsLocationTracking(true);
      setTrackingError(null);

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: Date.now()
          };

          console.log('🚗 Location update:', newLocation);

          // Check if location changed significantly (>10 meters)
          if (currentLocation) {
            const distance = gymBrosLocationService.calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              newLocation.lat,
              newLocation.lng
            );

            // Only update if moved more than 10 meters
            if (distance < 10) {
              console.log('🚗 Location change too small, skipping update');
              return;
            }
          }

          // Update local state
          setCurrentLocation(newLocation);
          
          // Smoothly move map center (don't change zoom)
          if (mapRef.current) {
            const map = mapRef.current;
            map.panTo([newLocation.lat, newLocation.lng], {
              animate: true,
              duration: 1.0 // 1 second smooth pan
            });
          }

          // Send to socket for real-time updates to other users
          if (socket && connected) {
            socket.emit('locationUpdate', {
              lat: newLocation.lat,
              lng: newLocation.lng,
              accuracy: newLocation.accuracy,
              speed: newLocation.speed,
              heading: newLocation.heading,
              timestamp: newLocation.timestamp,
              userId: userProfile?.userId || userProfile?._id
            });
          }

          // Update backend location (throttled)
          try {
            await gymBrosLocationService.updateUserLocationRealtime({
              lat: newLocation.lat,
              lng: newLocation.lng,
              accuracy: convertAccuracyToEnum(newLocation.accuracy),
              source: 'gps',
              timestamp: new Date(newLocation.timestamp).toISOString()
            });
          } catch (error) {
            console.warn('Failed to update backend location:', error);
            // Don't show error to user for background updates
          }
        },
        (error) => {
          console.error('🚗 Location tracking error:', error);
          
          let errorMessage = 'Location tracking failed';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied';
              localStorage.setItem('gymBrosAutoTrack', 'false'); // Remember user denied
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location timeout';
              break;
          }
          
          setTrackingError(errorMessage);
          setIsLocationTracking(false);
          
          // Show error only for permission denied
          if (error.code === error.PERMISSION_DENIED) {
            toast.error('Location tracking disabled. Enable in settings to track your movement.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds
          maximumAge: 10000 // Use cached location if less than 10 seconds old
        }
      );

      setTrackingWatchId(watchId);
      console.log('🚗 Location tracking started with watchId:', watchId);

    } catch (error) {
      console.error('🚗 Failed to start location tracking:', error);
      setTrackingError('Failed to start tracking');
      setIsLocationTracking(false);
    }
  };

  // Start tracking when component mounts and user/socket is ready
  if (userProfile && socket) {
    startLocationTracking();
  }

  // Cleanup function
  return () => {
    if (watchId) {
      console.log('🚗 Stopping location tracking...');
      navigator.geolocation.clearWatch(watchId);
      setIsLocationTracking(false);
      setTrackingWatchId(null);
    }
  };
}, [userProfile, socket, connected]);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchGyms()
      ]);
    };
    
    initializeData();
  }, [fetchUsers, fetchGyms]);

  useEffect(() => {
    if (socket && connected) {
      const handleUserLocationUpdate = (data) => {
        // Handle real-time user location updates
      };

      socket.on('userLocationUpdate', handleUserLocationUpdate);
      
      return () => {
        socket.off('userLocationUpdate', handleUserLocationUpdate);
      };
    }
  }, [socket, connected]);

  useEffect(() => {
    if (userProfile?.avatar) {
      setAvatar(userProfile.avatar);
    }
  }, [userProfile]);

  // Initialize map center and current location
  useEffect(() => {
    const initializeLocation = async () => {
  try {
    // Use the enhanced service
    const bestLocation = await gymBrosLocationService.getBestLocation(
      userProfile?.user, 
      userProfile?.phone
    );
    
    if (bestLocation && bestLocation.lat && bestLocation.lng) {
      setMapCenter([bestLocation.lat, bestLocation.lng]);
      setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
      setErrors(prev => ({ ...prev, location: null }));
    } else {
      setErrors(prev => ({ ...prev, location: 'Could not determine your location' }));
    }
  } catch (error) {
    console.error('Error initializing location:', error);
    setErrors(prev => ({ ...prev, location: error.message }));
  }
};

    initializeLocation();
  }, [userProfile]);

  const toggleLocationTracking = () => {
  if (isLocationTracking && trackingWatchId) {
    // Stop tracking
    navigator.geolocation.clearWatch(trackingWatchId);
    setIsLocationTracking(false);
    setTrackingWatchId(null);
    localStorage.setItem('gymBrosAutoTrack', 'false');
    toast.info('Location tracking stopped');
  } else {
    // Start tracking
    localStorage.setItem('gymBrosAutoTrack', 'true');
    // Trigger re-render to start tracking
    window.location.reload();
  }
};

  // Fetch map data
  const fetchMapData = async () => {
  setLoading(true);
  try {
    const mapFilters = {
      ...filters,
      maxDistance: filters.maxDistance,
      includeRecommendations: true
    };
    
    await Promise.all([
      fetchUsers(mapFilters),
      fetchGyms()
    ]);
  } catch (error) {
    console.error('Error fetching map data:', error);
  } finally {
    setLoading(false);
  }
};

  const requestLocationPermission = async () => {
  try {
    // Check permission first
    const permissionState = await gymBrosLocationService.checkLocationPermission();
    
    if (permissionState === 'denied') {
      toast.error('Location access was denied. Please enable in browser settings.');
      return;
    }
    
    const location = await gymBrosLocationService.getCurrentLocation({
      priority: 'balanced',
      force: true // Force new request for manual permission request
    });
    
    if (location) {
      const newLocation = {
        lat: location.lat,
        lng: location.lng
      };
      
      setCurrentLocation(newLocation);
      setMapCenter([newLocation.lat, newLocation.lng]);
      toast.success('Location updated successfully');
      
      // Invalidate users when location changes
      invalidate('users');
      
      // Send to socket for real-time updates
      if (socket && connected) {
        socket.emit('locationUpdate', {
          lat: newLocation.lat,
          lng: newLocation.lng,
          timestamp: Date.now()
        });
      }
    }
  } catch (error) {
    console.error('Location request failed:', error);
    
    if (error.code === 1) {
      toast.error('Location access denied');
    } else if (error.code === 3) {
      toast.error('Location request timed out. Using fallback location.');
      
      // Try to use cached/stored location as fallback
      const fallback = gymBrosLocationService.getCachedLocation() || 
                      gymBrosLocationService.getStoredLocation();

      if (fallback) {
        setCurrentLocation({ lat: fallback.lat, lng: fallback.lng });
        setMapCenter([fallback.lat, fallback.lng]);
        toast.info('Using last known location');
      }
    } else {
      toast.error('Could not get your location. Using default location.');
    }
  }
};

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/gym-bros/map/events');
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setEvents(data);
          setErrors(prev => ({ ...prev, events: null }));
        } else {
          throw new Error('Invalid response format for events');
        }
      } else {
        throw new Error(`Events API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setEvents([]);
      setErrors(prev => ({ 
        ...prev, 
        events: error.message || 'Failed to load events. API endpoint not available.' 
      }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMapData();
  }, []);

  // Filter data based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.workoutTypes?.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return filters.showUsers && matchesSearch;
  });

  // Filter gyms by type and search
  const allFilteredGyms = gyms.filter(gym => {
    const matchesSearch = !searchQuery || 
      gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Separate gyms by type
  const filteredGyms = allFilteredGyms.filter(gym => 
    (gym.type === 'gym' && filters.showGyms) ||
    (gym.type === 'sport_center' && filters.showSportCenters) ||
    (gym.type === 'other' && filters.showOther)
  );

  const filteredEvents = allFilteredGyms.filter(gym => 
    gym.type === 'event' && filters.showEvents
  );

  const filteredCommunity = allFilteredGyms.filter(gym => 
    gym.type === 'community' && filters.showCommunity
  );

  // Helper function to get appropriate icon for gym type
  const getGymTypeIcon = (gym) => {
    switch (gym.type) {
      case 'event':
        return L.divIcon({
          html: `<div style="background: #8B5CF6; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📅</div>`,
          className: 'custom-event-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      case 'community':
        return L.divIcon({
          html: `<div style="background: #10B981; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏘️</div>`,
          className: 'custom-community-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      case 'sport_center':
        return L.divIcon({
          html: `<div style="background: #F59E0B; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏟️</div>`,
          className: 'custom-sport-center-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      case 'other':
        return L.divIcon({
          html: `<div style="background: #6B7280; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
          className: 'custom-other-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      case 'gym':
      default:
        return createGymIcon(gym); // Use existing gym icon
    }
  };

  // Helper function to get marker click type based on gym type
  const getMarkerClickType = (gym) => {
    return gym.type === 'event' ? 'event' : 'gym';
  };

  // MOVED renderMarkers function to the correct scope
  const renderMarkers = () => {
    const markers = [];
    
    // Current user location mouse
    if (currentLocation) {
      markers.push(
        <Marker
          key="current-user-location"
          position={[currentLocation.lat, currentLocation.lng]}
          icon={createMouseIcon(avatar || {}, true)}
          eventHandlers={{
            click: handleCurrentUserClick
          }}
        >
          <Popup>
            <div className="text-center">
              <div className="mb-2">
                {renderMouseAvatar(avatar || {}, 60)}
              </div>
              <p className="text-sm text-gray-600">Click to customize your mouse</p>
            </div>
          </Popup>
        </Marker>
      );
    }
    
     filteredUsers
    .filter(user => isValidCoordinate(user.lat, user.lng))
    .forEach(user => {
      // Determine user type and styling
      const isMatch = user.source === 'match' || user.isMatch;
      const isGymMember = user.source === 'gym_member' || user.sharedGym;
      const isRecommendation = user.source === 'recommendation' || user.isRecommendation;
      
      console.log(`🗺️ Rendering user ${user.name}: match=${isMatch}, gymMember=${isGymMember}, recommendation=${isRecommendation}`);
      
      markers.push(
        <Marker 
          key={`user-${user.id || user._id}`} 
          position={[user.lat, user.lng]} 
          icon={createMouseIcon(user.avatar || {}, false, { 
            isMatch, 
            isGymMember, 
            isRecommendation 
          })}
          eventHandlers={{
            click: () => handleMarkerClick('user', user)
          }}
        >
          <Popup>
            <div className="min-w-48 text-center">
              <div className="mb-2">
                {isRecommendation ? (
                  // Show waving mouse for recommendations
                  <div dangerouslySetInnerHTML={{ 
                    __html: createWavingMouseSVG(60) 
                  }} />
                ) : (
                  // Show actual avatar for matches and gym members
                  renderMouseAvatar(user.avatar || {}, 60)
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.age} • {user.experienceLevel}</p>
              
              {/* Enhanced relationship indicators */}
              <div className="mt-2 mb-2 space-y-1">
                {isMatch && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                    <span>❤️</span>
                    <span className="font-medium">It's a Match!</span>
                  </div>
                )}
                
                {isGymMember && !isMatch && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    <span>🏋️</span>
                    <span className="font-medium">Gym Buddy</span>
                  </div>
                )}
                
                {isRecommendation && !isMatch && !isGymMember && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    <span>⭐</span>
                    <span className="font-medium">Recommended</span>
                  </div>
                )}
              </div>
              
              {/* Workout types */}
              {user.workoutTypes && user.workoutTypes.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.workoutTypes.slice(0, 2).map(type => (
                      <span key={type} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {type}
                      </span>
                    ))}
                    {user.workoutTypes.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        +{user.workoutTypes.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Match score for recommendations */}
              {isRecommendation && user.matchScore && (
                <div className="mb-2">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium text-purple-600">{user.matchScore}% match</span>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => handleMarkerClick('user', user)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Profile →
              </button>
            </div>
          </Popup>
        </Marker>
      );
    });
  
    
    // Gym Markers (including all types: gym, event, community, sport_center, other)
    [...filteredGyms, ...filteredEvents, ...filteredCommunity]
      .filter(gym => {
        if (gym.location?.coordinates && Array.isArray(gym.location.coordinates)) {
          const [lng, lat] = gym.location.coordinates;
          return isValidCoordinate(lat, lng);
        }
        const lat = gym.lat || gym.location?.lat;
        const lng = gym.lng || gym.location?.lng;
        return isValidCoordinate(lat, lng);
      })
      .forEach(gym => {
        let lat, lng;
        if (gym.location?.coordinates && Array.isArray(gym.location.coordinates)) {
          [lng, lat] = gym.location.coordinates;
        } else {
          lat = gym.lat || gym.location?.lat;
          lng = gym.lng || gym.location?.lng;
        }
        
        const gymId = gym._id || gym.id;
        const markerType = getMarkerClickType(gym);
        
        markers.push(
          <Marker 
            key={`${gym.type}-${gymId}`} 
            position={[lat, lng]} 
            icon={getGymTypeIcon(gym)}
            eventHandlers={{
              click: () => handleMarkerClick(markerType, { ...gym, lat, lng })
            }}
          >
            <Popup>
              <div className="min-w-48">
                <div className="flex items-center gap-2 mb-2">
                  {gym.type === 'event' ? (
                    <Calendar className="h-5 w-5 text-purple-500" />
                  ) : gym.type === 'community' ? (
                    <Users className="h-5 w-5 text-green-500" />
                  ) : (
                    <Building2 className="h-5 w-5 text-blue-500" />
                  )}
                  <h3 className="font-semibold">{gym.name}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                    {gym.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{gym.description}</p>
                {gym.type !== 'event' && (
                  <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                    <Users className="h-4 w-4" />
                    <span>{gym.memberCount || 0} members active</span>
                  </div>
                )}
                {gym.type === 'event' && gym.date && (
                  <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(gym.date).toLocaleDateString()}</span>
                  </div>
                )}
                <button 
                  onClick={() => handleMarkerClick(markerType, { ...gym, lat, lng })}
                  className={`text-sm hover:underline ${
                    gym.type === 'event' ? 'text-purple-500' : 'text-blue-500'
                  }`}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      });
    
    return markers;
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsers(true), 
      fetchGyms(true)
    ]);
    setLoading(false);
  };

  const handleGymCheckIn = async (gymId) => {
    try {
      await gymBrosLocationService.checkInToGym(gymId);
      
      // Invalidate gym cache after check-in
      invalidate('gyms');
      invalidate('users'); // Users count at gym might change
      
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error('Check-in failed');
    }
  };

  const preloadTiles = (map, center, zooms = []) => {
  if (!map || !center) return;
  
  zooms.forEach(zoom => {
    const bounds = map.getBounds();
    const tileLayer = map._layers[Object.keys(map._layers)[0]]; // Get tile layer
    
    if (tileLayer && tileLayer._url) {
      // Preload tiles for this zoom level
      const tiles = [];
      const pixelBounds = map.getPixelBounds();
      const tileSize = tileLayer.options.tileSize || 256;
      
      for (let x = Math.floor(pixelBounds.min.x / tileSize); x <= Math.ceil(pixelBounds.max.x / tileSize); x++) {
        for (let y = Math.floor(pixelBounds.min.y / tileSize); y <= Math.ceil(pixelBounds.max.y / tileSize); y++) {
          const tileUrl = tileLayer._url
            .replace('{z}', zoom)
            .replace('{x}', x)
            .replace('{y}', y)
            .replace('{s}', 'a'); // Use first subdomain
          
          // Preload tile
          const img = new Image();
          img.src = tileUrl;
        }
      }
    }
  });
};

const handleMarkerClick = (type, data) => {
  if (mapRef.current) {
    const map = mapRef.current;
    const currentZoom = map.getZoom();
    const targetZoom = 16;
    
    // Calculate zoom difference for smooth animation
    const zoomDiff = Math.abs(targetZoom - currentZoom);
    const duration = Math.min(2.0, 0.8 + (zoomDiff * 0.2)); // Longer for bigger zoom changes
    
    // Preload tiles for target zoom level
    preloadTiles(map, [data.lat, data.lng], [targetZoom - 1, targetZoom, targetZoom + 1]);
    
    // Use flyTo for smooth animated movement
    map.flyTo([data.lat, data.lng], targetZoom, {
      animate: true,
      duration: duration,
      easeLinearity: 0.15, // Smoother easing
      noMoveStart: false
    });
  }

  // Open side panel with data
  setSidePanel({
    isOpen: true,
    data,
    type
  });
};

  const handleCurrentUserClick = () => {
  if (currentLocation && mapRef.current) {
    const map = mapRef.current;
    map.flyTo([currentLocation.lat, currentLocation.lng], 18, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25
    });
  }
};

const convertAccuracyToEnum = (numericAccuracy) => {
  if (typeof numericAccuracy !== 'number' || isNaN(numericAccuracy)) {
    return 'medium';
  }
  
  if (numericAccuracy < 10) return 'high';
  if (numericAccuracy < 100) return 'medium';
  if (numericAccuracy < 500) return 'low';
  return 'approximate';
};

  // Save avatar handler
  const handleAvatarSave = async (newAvatar) => {
    try {
      setAvatar(newAvatar);
      setShowAvatarDesigner(false);
      
      // Save avatar to backend (extend the profile update API)
      await gymbrosService.updateProfile({
        avatar: newAvatar
      });
      
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  if (loading && users.length === 0 && gyms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="relative w-full h-full">
    <MapControls 
      onSearch={handleSearch}
      onFilterToggle={() => setShowFilters(true)}
      loading={isLoading}
      onRefresh={handleRefresh}
      avatar={avatar}
      onAvatarClick={() => setShowAvatarDesigner(true)}
      isTracking={isLocationTracking}
      onToggleTracking={toggleLocationTracking}
      trackingError={trackingError}
    />

<TileLoadingIndicator isLoading={tilesLoading} tileCount={tileLoadCount} />
      
      {/* Error displays */}
      {Object.entries(errors).map(([type, error]) => 
        error && (
          <div key={type} className="absolute top-20 left-4 right-4 z-30">
            <ErrorDisplay 
              error={error} 
              type={type}
              onRetry={() => {
                switch(type) {
                  case 'users': fetchUsers(); break;
                  case 'gyms': fetchGyms(); break;
                  case 'location': 
                    const initializeLocation = async () => {
                      try {
                        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
                        if (bestLocation && bestLocation.lat && bestLocation.lng) {
                          setMapCenter([bestLocation.lat, bestLocation.lng]);
                          setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
                          setErrors(prev => ({ ...prev, location: null }));
                        }
                      } catch (error) {
                        setErrors(prev => ({ ...prev, location: error.message }));
                      }
                    };
                    initializeLocation();
                    break;
                }
              }}
            />
          </div>
        )
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
        ref={mapRef}
        className={`z-10 custom-leaflet-map${darkMode ? ' gymbros-map-dark' : ''}`}
        zoomControl={false}
      >
        <TileLayer
          url={darkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
          attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a>"
        />
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <MapEventHandler onMarkerClick={handleMarkerClick} currentUserLocation={currentLocation} />
        
        {MarkerClusterGroup ? (
          <MarkerClusterGroup>
            {renderMarkers()}
          </MarkerClusterGroup>
        ) : (
          renderMarkers()
        )}
      </MapContainer>
      
      {/* Side Panel */}
      <MapSidePanel 
        isOpen={sidePanel.isOpen}
        onClose={() => setSidePanel({ isOpen: false, data: null, type: null })}
        data={sidePanel.data}
        type={sidePanel.type}
      />
      
      {/* Map Filters Modal */}
      <MapFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFiltersApply}
      />
      
      {/* Mouse Avatar Designer Modal */}
      {showAvatarDesigner && (
        <MouseAvatarDesigner
          currentAvatar={avatar}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarDesigner(false)}
        />
      )}

      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-20 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-sm z-40">
    <h4 className="font-bold mb-2">🐛 Debug Info</h4>
    <div className="space-y-1">
      <div>Users: {users.length} ({filteredUsers.length} filtered)</div>
      <div>Gyms: {filteredGyms.length} | Events: {filteredEvents.length} | Community: {filteredCommunity.length}</div>
      <div>Total Locations: {gyms.length}</div>
      <div>Location: {currentLocation ? `[${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}]` : 'None'}</div>
      <div>Search: "{searchQuery}"</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div className={`${isLocationTracking ? 'text-green-300' : 'text-red-300'}`}>
        Tracking: {isLocationTracking ? 'Active' : 'Inactive'}
        {trackingError && ` (${trackingError})`}
      </div>
      <div className="text-red-300">
        Errors: {Object.keys(errors).filter(key => errors[key]).join(', ') || 'None'}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

// Add styles
const style = document.createElement('style');
style.innerHTML = enhancedMapStyles;

if (!document.head.querySelector('style[data-gymbros-map]')) {
  style.setAttribute('data-gymbros-map', '');
  document.head.appendChild(style);
}

export default GymBrosMap;
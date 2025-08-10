import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, AlertTriangle } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import { renderMouseAvatar, createMouseIcon, createGymIcon } from './components/MouseAvatarUtils';
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

// Search/Filter Bar Component with Avatar
const MapControls = ({ onSearch, onFilterToggle, loading, onRefresh, avatar, onAvatarClick }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 items-center">
      {/* Avatar Circle Button */}
      <button
        className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-blue-400 bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform mr-2 overflow-hidden"
        onClick={onAvatarClick}
        title="Edit your Gym Mouse avatar"
        style={{ padding: '2px' }}
      >
        {renderMouseAvatar(avatar || {}, 44)}
      </button>
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

// Custom Map Event Handler
const MapEventHandler = ({ onMarkerClick, currentUserLocation }) => {
  const map = useMapEvents({
    click: (e) => {
      // Handle map clicks if needed
    },
    zoom: (e) => {
      // Handle zoom changes if needed
    },
    moveend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      // Handle map move end if needed
    }
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
        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
        
        if (bestLocation && bestLocation.lat && bestLocation.lng) {
          setMapCenter([bestLocation.lat, bestLocation.lng]);
          setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
          setErrors(prev => ({ ...prev, location: null }));
        } else {
          setErrors(prev => ({ ...prev, location: 'Could not determine your location' }));
        }
      } catch (error) {
        setErrors(prev => ({ ...prev, location: error.message }));
      }
    };

    initializeLocation();
  }, [userProfile]);

  // Fetch map data
  const fetchMapData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
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
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000
        });
      });
      
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
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
    } catch (error) {
      toast.error('Location access denied');
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
    
    // User Markers
    filteredUsers
      .filter(user => isValidCoordinate(user.lat, user.lng))
      .forEach(user => {
        markers.push(
          <Marker 
            key={`user-${user.id}`} 
            position={[user.lat, user.lng]} 
            icon={createMouseIcon(user.avatar || {})}
            eventHandlers={{
              click: () => handleMarkerClick('user', user)
            }}
          >
            <Popup>
              <div className="min-w-48 text-center">
                <div className="mb-2">
                  {renderMouseAvatar(user.avatar || {}, 60)}
                </div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.age} • {user.experienceLevel}</p>
                <button 
                  onClick={() => handleMarkerClick('user', user)}
                  className="mt-2 text-blue-500 hover:underline text-sm"
                >
                  View Details →
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

  // Handle marker clicks
  const handleMarkerClick = (type, data) => {
    // Center and zoom on the clicked location
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView([data.lat, data.lng], 16);
    }

    // Open side panel with data
    setSidePanel({
      isOpen: true,
      data,
      type
    });
  };

  // Handle current user mouse click - zoom to location
  const handleCurrentUserClick = () => {
    if (currentLocation && mapRef.current) {
      const map = mapRef.current;
      map.setView([currentLocation.lat, currentLocation.lng], 18);
    }
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
      />
      
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
style.innerHTML = `
  .custom-leaflet-map .leaflet-control-zoom {
    display: none !important;
  }
  .custom-leaflet-map .leaflet-container {
    border-radius: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    background: #f8fafc;
    transition: filter 0.3s;
  }
  .gymbros-map-dark .leaflet-container {
    filter: grayscale(0.15) brightness(0.95) sepia(0.15) hue-rotate(185deg) saturate(1.2) contrast(1.08);
    background: #1e293b;
  }
  .custom-mouse-icon {
    background: transparent !important;
    border: none !important;
  }
  .custom-gym-icon {
    background: transparent !important;
    border: none !important;
  }
  .custom-event-icon {
    background: transparent !important;
    border: none !important;
  }
  .custom-community-icon {
    background: transparent !important;
    border: none !important;
  }
  .custom-sport-center-icon {
    background: transparent !important;
    border: none !important;
  }
  .custom-other-icon {
    background: transparent !important;
    border: none !important;
  }
`;

if (!document.head.querySelector('style[data-gymbros-map]')) {
  style.setAttribute('data-gymbros-map', '');
  document.head.appendChild(style);
}

export default GymBrosMap;
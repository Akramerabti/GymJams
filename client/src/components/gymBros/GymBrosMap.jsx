import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, AlertTriangle } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import { renderMouseAvatar, createMouseIcon, createGymIcon } from './components/MouseAvatarUtils';
import gymbrosService from '../../services/gymbros.service';
import gymBrosLocationService from '../../services/gymBrosLocation.service';

// Import clustering if available
let MarkerClusterGroup;
try {
  MarkerClusterGroup = require('react-leaflet-cluster').default;
} catch (e) {
  MarkerClusterGroup = null;
}

const DEFAULT_CENTER = [45.5017, -73.5673]; 

// Debug logging utility
const debugLog = (category, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `🗺️ [GymBrosMap][${category}] ${timestamp}: ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

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
    debugLog('SEARCH', `Search query: "${value}"`);
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
      debugLog('MAP', `Updating map center to [${center[0]}, ${center[1]}] with zoom ${zoom || map.getZoom()}`);
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

// Side Panel Component
const SidePanel = ({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

  debugLog('SIDEPANEL', `Opening side panel for ${type}`, data);

  const renderContent = () => {
    switch(type) {
      case 'gym':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
                <p className="text-sm text-gray-500">{data.type || 'Fitness Center'}</p>
              </div>
            </div>

            {data.address && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">📍 Location</h3>
                <p className="text-gray-600">{data.address}</p>
              </div>
            )}

            {data.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                <p className="text-gray-600">{data.description}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">💪 Active Members</h3>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold text-blue-600">{data.memberCount || 0}</span>
                <span className="text-gray-500">members nearby</span>
              </div>
            </div>

            {data.hours && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">🕒 Hours</h3>
                <p className="text-gray-600">{data.hours}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                Check In Here
              </button>
              <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Get Directions
              </button>
            </div>
          </div>
        );
      
      case 'event':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
                <p className="text-sm text-gray-500">{data.type || 'Fitness Event'}</p>
              </div>
            </div>

            {data.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">📝 Description</h3>
                <p className="text-gray-600">{data.description}</p>
              </div>
            )}

            {data.date && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">📅 Date & Time</h3>
                <p className="text-gray-600">{new Date(data.date).toLocaleDateString()} at {data.time || 'TBD'}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">👥 Participants</h3>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-lg font-bold text-purple-600">{data.participants || 0}</span>
                <span className="text-gray-500">interested</span>
              </div>
            </div>

            <button className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors">
              Join Event
            </button>
          </div>
        );

      case 'user':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-blue-200 overflow-hidden bg-gray-50">
                {data.avatar ? renderMouseAvatar(data.avatar, 60) : (
                  <img 
                    src={data.profileImage || '/default-avatar.png'} 
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
                <p className="text-sm text-gray-500">{data.age} • {data.experienceLevel}</p>
              </div>
            </div>

            {data.bio && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                <p className="text-gray-600">{data.bio}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">💪 Workout Types</h3>
              <div className="flex flex-wrap gap-1">
                {data.workoutTypes?.slice(0, 4).map((type, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {data.preferredTime && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">🕒 Preferred Time</h3>
                <p className="text-gray-600">{data.preferredTime}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                View Profile
              </button>
              <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                Message
              </button>
            </div>
          </div>
        );

      default:
        return <p>No data available</p>;
    }
  };

  return (
    <div className={`fixed top-0 left-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Details</h2>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto h-full">
        {renderContent()}
      </div>
    </div>
  );
};

// Filter Modal Component
const MapFilters = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      debugLog('FILTERS', 'Opening filter modal', filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    debugLog('FILTERS', 'Applying filters', localFilters);
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
      debugLog('MAP_EVENT', `Map clicked at: [${e.latlng.lat}, ${e.latlng.lng}]`);
    },
    zoom: (e) => {
      debugLog('MAP_EVENT', `Map zoom changed to: ${e.target.getZoom()}`);
    },
    moveend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      debugLog('MAP_EVENT', `Map moved to: [${center.lat}, ${center.lng}], zoom: ${zoom}`);
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
  // Track current user location for map dot
  const [currentLocation, setCurrentLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef();

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

  // Error states
  const [errors, setErrors] = useState({
    users: null,
    gyms: null,
    events: null,
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
    maxDistance: 25
  });

  // Avatar designer modal state
  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);

  // Use theme context for dark mode
  const { darkMode } = useTheme();

  // Debug logging for userProfile
  useEffect(() => {
    debugLog('INIT', 'userProfile prop received', userProfile);
  }, [userProfile]);

  useEffect(() => {
    debugLog('INIT', 'Avatar state updated', avatar);
  }, [avatar]);

  // Initialize map center and current location
  useEffect(() => {
    const initializeLocation = async () => {
      debugLog('LOCATION', 'Starting location initialization...');
      try {
        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
        debugLog('LOCATION', 'getBestLocation result', bestLocation);
        
        if (bestLocation && bestLocation.lat && bestLocation.lng) {
          debugLog('LOCATION', 'Setting map center to user location', bestLocation);
          setMapCenter([bestLocation.lat, bestLocation.lng]);
          setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
          setErrors(prev => ({ ...prev, location: null }));
        } else {
          debugLog('LOCATION', 'No location found, using default center');
          setErrors(prev => ({ ...prev, location: 'Could not determine your location' }));
        }
      } catch (error) {
        debugLog('LOCATION', 'Error getting user location', error);
        setErrors(prev => ({ ...prev, location: error.message }));
      }
    };

    initializeLocation();
  }, [userProfile]);

  // Fetch map data
  const fetchMapData = async () => {
    debugLog('DATA', 'Starting map data fetch...');
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchGyms(), 
        fetchEvents()
      ]);
      debugLog('DATA', 'All map data fetch completed');
    } catch (error) {
      debugLog('DATA', 'Error in fetchMapData', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
  debugLog('USERS', 'Fetching users...');
  try {
    const response = await gymbrosService.getGymBrosProfiles();
    debugLog('USERS', 'Successfully fetched users', response);

    // Extract the recommendations array
    const usersArray = response?.data?.recommendations || [];
    setUsers(usersArray);
    setErrors(prev => ({ ...prev, users: null }));
  } catch (error) {
    debugLog('USERS', 'Error fetching users', error);
    setUsers([]);
    setErrors(prev => ({
      ...prev,
      users: error.message || 'Failed to load gym partners. API endpoint not implemented.'
    }));
  }
};

  const fetchGyms = async () => {
    debugLog('GYMS', 'Fetching gyms...');
    try {
      // Use gymBrosLocationService to fetch gyms for the map
      // For now, fetch all gyms (no bounds/zoom filtering)
      const data = await gymBrosLocationService.getGymsForMap({}, 13, {});
      debugLog('GYMS', 'Successfully fetched gyms', data);

      // Accept both array and object with gyms property
      let gymsArray = Array.isArray(data) ? data : data.gyms;
      if (Array.isArray(gymsArray)) {
        setGyms(gymsArray);
        setErrors(prev => ({ ...prev, gyms: null }));
      } else {
        throw new Error('Invalid response format for gyms');
      }
    } catch (error) {
      debugLog('GYMS', 'Error fetching gyms', error);
      setGyms([]);
      setErrors(prev => ({ 
        ...prev, 
        gyms: error.message || 'Failed to load gyms. API endpoint not available.' 
      }));
    }
  };

  const fetchEvents = async () => {
    debugLog('EVENTS', 'Fetching events...');
    try {
      const response = await fetch('/api/gym-bros/map/events');
      debugLog('EVENTS', `Events API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        debugLog('EVENTS', 'Successfully fetched events', data);
        
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
      debugLog('EVENTS', 'Error fetching events', error);
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

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = !searchQuery || 
      gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return filters.showGyms && matchesSearch;
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return filters.showEvents && matchesSearch;
  });

  // Debug filtered data
  useEffect(() => {
    debugLog('FILTER', `Filtered data - Users: ${filteredUsers.length}, Gyms: ${filteredGyms.length}, Events: ${filteredEvents.length}`);
  }, [filteredUsers.length, filteredGyms.length, filteredEvents.length]);

  // Handle marker clicks
  const handleMarkerClick = (type, data) => {
    debugLog('MARKER', `Marker clicked - Type: ${type}`, data);
    
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
    debugLog('USER', 'Current user location clicked');
    if (currentLocation && mapRef.current) {
      const map = mapRef.current;
      map.setView([currentLocation.lat, currentLocation.lng], 18);
    }
  };

  // Save avatar handler
  const handleAvatarSave = async (newAvatar) => {
    debugLog('AVATAR', 'Saving new avatar', newAvatar);
    try {
      setAvatar(newAvatar);
      setShowAvatarDesigner(false);
      
      // Save avatar to backend (extend the profile update API)
      await gymbrosService.updateProfile({
        avatar: newAvatar
      });
      
      debugLog('AVATAR', 'Avatar saved successfully', newAvatar);
    } catch (error) {
      debugLog('AVATAR', 'Error saving avatar', error);
    }
  };

  const handleRefresh = () => {
    debugLog('REFRESH', 'Manual refresh triggered');
    fetchMapData();
  };

  const handleFiltersApply = (newFilters) => {
    debugLog('FILTERS', 'New filters applied', newFilters);
    setFilters(newFilters);
  };

  const handleSearch = (query) => {
    debugLog('SEARCH', `Search query changed: "${query}"`);
    setSearchQuery(query);
  };

  // Debug component state
  useEffect(() => {
    debugLog('STATE', 'Component state update', {
      loading,
      usersCount: users.length,
      gymsCount: gyms.length,
      eventsCount: events.length,
      errors: Object.keys(errors).filter(key => errors[key]).join(', ') || 'none',
      currentLocation,
      mapCenter,
      searchQuery
    });
  }, [loading, users.length, gyms.length, events.length, errors, currentLocation, mapCenter, searchQuery]);

  if (loading && users.length === 0 && gyms.length === 0 && events.length === 0) {
    debugLog('RENDER', 'Showing loading state');
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  debugLog('RENDER', 'Rendering main map component');

  return (
    <div className="relative w-full h-full">
      <MapControls 
        onSearch={handleSearch}
        onFilterToggle={() => setShowFilters(true)}
        loading={loading}
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
                  case 'events': fetchEvents(); break;
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
            {/* Current user location mouse */}
            {currentLocation && (
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
            )}
            
            {/* User Markers */}
            {filteredUsers
  .filter(user => isValidCoordinate(user.lat, user.lng))
  .map(user => (
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
              ))}
            
            {/* Gym Markers */}
            {filteredGyms
  .filter(gym => isValidCoordinate(gym.lat, gym.lng))
  .map(gym => (
    <Marker 
      key={`gym-${gym.id}`} 
      position={[gym.lat, gym.lng]} 
      icon={createGymIcon(gym)}
      eventHandlers={{
        click: () => handleMarkerClick('gym', gym)
      }}
    >
                  <Popup>
                    <div className="min-w-48">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">{gym.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{gym.description}</p>
                      <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                        <Users className="h-4 w-4" />
                        <span>{gym.memberCount} members active</span>
                      </div>
                      <button 
                        onClick={() => handleMarkerClick('gym', gym)}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            
            {/* Event Markers */}
          {filteredEvents
  .filter(event => isValidCoordinate(event.lat, event.lng))
  .map(event => (
    <Marker 
      key={`event-${event.id}`} 
      position={[event.lat, event.lng]} 
                icon={L.divIcon({
                  html: `<div style="background: #8B5CF6; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📅</div>`,
                  className: 'custom-event-icon',
                  iconSize: [40, 40],
                  iconAnchor: [20, 20],
                })}
                 eventHandlers={{
        click: () => handleMarkerClick('event', event)
      }}
    >
                <Popup>
                  <div className="min-w-48">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold">{event.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span>{event.participants} interested</span>
                    </div>
                    <button 
                      onClick={() => handleMarkerClick('event', event)}
                      className="text-purple-500 hover:underline text-sm"
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {/* Fallback without clustering */}
            {currentLocation && (
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
                    <p className="text-sm text-gray-600">Your location</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Users without clustering */}
            {filteredUsers
  .filter(user => isValidCoordinate(user.lat, user.lng))
  .map(user => (
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
            ))}
            
            {/* Gyms without clustering */}
            {filteredGyms
  .filter(gym => isValidCoordinate(gym.lat, gym.lng))
  .map(gym => (
    <Marker 
      key={`gym-${gym.id}`} 
      position={[gym.lat, gym.lng]} 
      icon={createGymIcon(gym)}
      eventHandlers={{
        click: () => handleMarkerClick('gym', gym)
      }}
    >
                <Popup>
                  <div className="min-w-48">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold">{gym.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{gym.description}</p>
                    <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span>{gym.memberCount} members active</span>
                    </div>
                    <button 
                      onClick={() => handleMarkerClick('gym', gym)}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Events without clustering */}
            {filteredEvents
  .filter(event => isValidCoordinate(event.lat, event.lng))
  .map(event => (
    <Marker 
      key={`event-${event.id}`} 
      position={[event.lat, event.lng]} 
                  icon={L.divIcon({
                    html: `<div style=\"background: #8B5CF6; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);\">📅</div>`,
                    className: 'custom-event-icon',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                  })}
                  eventHandlers={{
                    click: () => handleMarkerClick('event', event)
                  }}
                >
                  <Popup>
                    <div className="min-w-48">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <h3 className="font-semibold">{event.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                        <Users className="h-4 w-4" />
                        <span>{event.participants} interested</span>
                      </div>
                      <button 
                        onClick={() => handleMarkerClick('event', event)}
                        className="text-purple-500 hover:underline text-sm"
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </>
        )}
      </MapContainer>
      
      {/* Side Panel */}
      <SidePanel 
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
            <div>Gyms: {gyms.length} ({filteredGyms.length} filtered)</div>
            <div>Events: {events.length} ({filteredEvents.length} filtered)</div>
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

// Custom styles
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
`;

if (!document.head.querySelector('style[data-gymbros-map]')) {
  style.setAttribute('data-gymbros-map', '');
  document.head.appendChild(style);
}

export default GymBrosMap;
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, AlertTriangle, Loader, MapPinIcon } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import AvatarDisplay from './components/AvatarDisplay';
import MapSidePanel from './components/MapSidePanel';
import { ImageService, DistanceUtils, FilterUtils } from './components/ImageUtils';
import gymbrosService from '../../services/gymbros.service';
import { useSocket } from '../../SocketContext';
import { toast } from 'sonner';
import gymBrosLocationService from '../../services/gymBrosLocation.service';
import useGymBrosData from '../../hooks/useGymBrosData';
let MarkerClusterGroup;
try {
  MarkerClusterGroup = require('react-leaflet-cluster').default;
} catch (e) {
  MarkerClusterGroup = null;
}

const DEFAULT_CENTER = [45.5017, -73.5673]; 

// Geolocation Loading Screen Component (NO SKIP OPTION)
const GeolocationLoadingScreen = ({ onLocationFound, onLocationError }) => {
  const [status, setStatus] = useState('requesting'); // requesting, loading, error
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        setStatus('requesting');
        setProgress(10);

        // Check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        setProgress(30);

        // Request location with timeout
        const location = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Location request timed out'));
          }, 15000);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            (error) => {
              clearTimeout(timeoutId);
              let message = 'Unable to get your location';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  message = 'Location access is required to use GymBros Map. Please enable location access in your browser settings and refresh the page.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  message = 'Location information is unavailable. Please check your device settings.';
                  break;
                case error.TIMEOUT:
                  message = 'Location request timed out. Please try again.';
                  break;
              }
              reject(new Error(message));
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 60000
            }
          );
        });

        setProgress(70);
        setStatus('loading');

        // Simulate additional loading for a smooth UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(100);

        onLocationFound(location);

      } catch (error) {
        console.error('Geolocation error:', error);
        setStatus('error');
        setErrorMessage(error.message);
        onLocationError(error);
      }
    };

    requestLocation();
  }, [onLocationFound, onLocationError]);

  const handleRetry = () => {
    setStatus('requesting');
    setErrorMessage('');
    setProgress(0);
    // Restart the location request
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          {status === 'requesting' && (
            <MapPinIcon className="h-16 w-16 text-blue-500 mx-auto animate-pulse" />
          )}
          {status === 'loading' && (
            <Loader className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
          )}
          {status === 'error' && (
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          )}
        </div>

        <div className="mb-6">
          {status === 'requesting' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Finding Your Location
              </h2>
              <p className="text-gray-600 mb-4">
                We need your location to show nearby gyms and workout partners
              </p>
            </>
          )}
          
          {status === 'loading' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Loading Map
              </h2>
              <p className="text-gray-600 mb-4">
                Setting up your personalized gym map...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Location Required
              </h2>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
        </div>

        {/* Action buttons */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Location access is required to use GymBros Map. Please enable location in your browser settings.
            </p>
          </div>
        )}

        {status !== 'error' && (
          <p className="text-xs text-gray-400 mt-4">
            Your location is only used to find nearby gyms and is not shared with other users without your permission.
          </p>
        )}
      </div>
    </div>
  );
};

// Map Controls Component
const MapControls = ({ onSearch, onFilterToggle, loading, onRefresh, avatar, userGender, onAvatarClick }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 items-center">
      {/* Avatar Circle Button */}
      <div className="relative">
        <button
          className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-blue-400 bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform mr-2 overflow-hidden"
          onClick={onAvatarClick}
          title="Edit your avatar"
          style={{ padding: '2px' }}
        >
          <AvatarDisplay 
            avatar={avatar} 
            userGender={userGender} 
            size={44} 
          />
        </button>
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
          
          {/* User Type Visibility Toggles */}
          <div>
            <label className="block text-sm font-medium mb-2">User Types Visibility</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-pink-600 mr-2">❤️</span>
                  <span>Matches</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.showMatches}
                    onChange={(e) => setLocalFilters({...localFilters, showMatches: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-purple-600 mr-2">⭐</span>
                  <span>Recommended</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.showRecommended}
                    onChange={(e) => setLocalFilters({...localFilters, showRecommended: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-orange-600 mr-2">🏋️</span>
                  <span>Gym Members</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.showGymMembers}
                    onChange={(e) => setLocalFilters({...localFilters, showGymMembers: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Toggle which user types appear on the map</p>
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

          {/* Search filters */}
          <div>
            <label className="block text-sm font-medium mb-2">Search Options</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search by name, gym, or workout type..."
                value={localFilters.searchQuery || ''}
                onChange={(e) => setLocalFilters({...localFilters, searchQuery: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Age range filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Age Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min="18"
                max="100"
                value={localFilters.ageRange?.min || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters, 
                  ageRange: { ...localFilters.ageRange, min: parseInt(e.target.value) || null }
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Max"
                min="18"
                max="100"
                value={localFilters.ageRange?.max || ''}
                onChange={(e) => setLocalFilters({
                  ...localFilters, 
                  ageRange: { ...localFilters.ageRange, max: parseInt(e.target.value) || null }
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Experience Level Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Experience Level</label>
            <select
              value={localFilters.experienceLevel || 'Any'}
              onChange={(e) => setLocalFilters({...localFilters, experienceLevel: e.target.value === 'Any' ? null : e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Any">Any Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          {/* Gym Rating Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Gym Rating</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={localFilters.minRating || 0}
              onChange={(e) => setLocalFilters({...localFilters, minRating: parseFloat(e.target.value)})}
              className="w-full"
            />
            <span className="text-sm text-gray-500">
              {localFilters.minRating || 0} stars and above
            </span>
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
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// Map Event Handler
const MapEventHandler = ({ onMarkerClick, currentUserLocation }) => {
  const map = useMapEvents({
    click: (e) => {
      // Handle map clicks if needed
    }
  });

  return null;
};

// Map Update Component
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

// Error Display Component
const ErrorDisplay = ({ error, onRetry, type = 'general' }) => {
  const getErrorMessage = () => {
    switch (type) {
      case 'users': return 'Failed to load gym partners';
      case 'gyms': return 'Failed to load gyms';
      case 'events': return 'Failed to load events';
      case 'location': return 'Failed to get your location';
      default: return 'Something went wrong';
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

// Main GymBrosMap Component
const GymBrosMap = ({ userProfile }) => {
  const { 
    users: rawUsers, 
    gyms: rawGyms, 
    loading: dataLoading,
    fetchUsers, 
    fetchGyms,
    invalidate
  } = useGymBrosData();

  // Location and loading states
  const [locationStatus, setLocationStatus] = useState('loading'); // loading, loaded, error
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Existing states...
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef();
  const { socket, connected } = useSocket();

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
    maxDistance: 25,
    searchQuery: '',
    ageRange: { min: null, max: null },
    experienceLevel: null,
    genderPreference: null,
    workoutTypes: [],
    // User type visibility toggles - only matches visible by default
    showRecommended: false,
    showMatches: true,
    showGymMembers: false,
    minRating: 0
  });

  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);

  const { darkMode } = useTheme();
  const userGender = userProfile?.gender || 'Male';

  // Apply filters and search to users and gyms
  const { filteredUsers, filteredGyms } = useMemo(() => {
    let users = [...rawUsers];
    let gyms = [...rawGyms];

    // Apply distance filter first (most efficient)
    if (currentLocation && filters.maxDistance) {
      users = DistanceUtils.filterByDistance(users, currentLocation, filters.maxDistance);
      gyms = DistanceUtils.filterByDistance(gyms, currentLocation, filters.maxDistance);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const userSearchFields = ['name', 'bio', 'experienceLevel', 'workoutTypes'];
      const gymSearchFields = ['name', 'description', 'type'];
      
      users = FilterUtils.searchItems(users, searchQuery, userSearchFields);
      gyms = FilterUtils.searchItems(gyms, searchQuery, gymSearchFields);
    }

    // Apply advanced filters from filter modal
    if (filters.searchQuery && filters.searchQuery !== searchQuery) {
      const userSearchFields = ['name', 'bio', 'experienceLevel', 'workoutTypes'];
      const gymSearchFields = ['name', 'description', 'type'];
      
      users = FilterUtils.searchItems(users, filters.searchQuery, userSearchFields);
      gyms = FilterUtils.searchItems(gyms, filters.searchQuery, gymSearchFields);
    }

    // Apply user-specific filters
    users = FilterUtils.filterUsers(users, filters);

    // Apply gym-specific filters
    gyms = FilterUtils.filterGyms(gyms, filters);

    // Apply visibility filters
    if (!filters.showUsers) users = [];
    if (!filters.showGyms) gyms = gyms.filter(gym => gym.type !== 'gym');
    if (!filters.showCommunity) gyms = gyms.filter(gym => gym.type !== 'community');
    if (!filters.showSportCenters) gyms = gyms.filter(gym => gym.type !== 'sport_center');
    if (!filters.showEvents) gyms = gyms.filter(gym => gym.type !== 'event');
    if (!filters.showOther) gyms = gyms.filter(gym => !['other'].includes(gym.type));

    return { filteredUsers: users, filteredGyms: gyms };
  }, [rawUsers, rawGyms, searchQuery, filters, currentLocation]);

  // Handle geolocation completion
  const handleLocationFound = async (location) => {
    try {
      setCurrentLocation(location);
      setMapCenter([location.lat, location.lng]);
      setLocationStatus('loaded');
      
      // Update backend with location
      try {
        await gymBrosLocationService.updateUserLocationRealtime({
          lat: location.lat,
          lng: location.lng,
          accuracy: convertAccuracyToEnum(location.accuracy),
          source: 'gps',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to update backend location:', error);
      }
      
      // Start fetching map data with location-based filters
      const locationFilters = {
        maxDistance: filters.maxDistance,
        lat: location.lat,
        lng: location.lng
      };
      
      await Promise.all([
        fetchUsers(locationFilters),
        fetchGyms()
      ]);
      
      setMapReady(true);
      setLoading(false);
      
    } catch (error) {
      console.error('Error handling location:', error);
      handleLocationError(error);
    }
  };

  const handleLocationError = (error) => {
    console.error('Location error:', error);
    setLocationStatus('error');
    toast.error('Location access is required to use GymBros Map');
  };

  // Render markers with enhanced image handling and random mirroring
  const renderMarkers = () => {
    const markers = [];

    // Current user marker
    if (currentLocation) {
      markers.push(
        <Marker
          key="current-user-location"
          position={[currentLocation.lat, currentLocation.lng]}
          icon={ImageService.createImageIcon(
            avatar, 
            userGender, 
            true, 
            {}, 
            userProfile?.id || userProfile?._id
          )}
          eventHandlers={{
            click: handleCurrentUserClick
          }}
        >
        </Marker>
      );
    }

    filteredUsers
      .filter(user => user.lat && user.lng)
      .forEach(user => {
        const userId = user.id || user._id;
        const isMatch = user.source === 'match' || user.isMatch;
        const isGymMember = user.source === 'gym_member' || user.sharedGym;
        const isRecommendation = user.source === 'recommendation' || user.isRecommendation;
        
        markers.push(
          <Marker 
            key={`user-${userId}`} 
            position={[user.lat, user.lng]} 
            icon={ImageService.createImageIcon(
              user.avatar, 
              user.gender || 'Male', 
              false, 
              { isMatch, isGymMember, isRecommendation },
              userId
            )}
            eventHandlers={{
              click: () => handleMarkerClick('user', user)
            }}
          >
            <Popup>
              <div className="min-w-48 text-center">
                <AvatarDisplay 
                  avatar={user.avatar} 
                  userGender={user.gender || 'Male'} 
                  userId={userId}
                  size={60} 
                />
                <h3 className="font-semibold text-gray-900 mt-2">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.age} • {user.experienceLevel}</p>
                
                {/* Distance indicator */}
                {currentLocation && (
                  <p className="text-xs text-gray-400 mt-1">
                    {DistanceUtils.calculateDistance(
                      currentLocation.lat, 
                      currentLocation.lng, 
                      user.lat, 
                      user.lng
                    ).toFixed(1)} km away
                  </p>
                )}
                
                {/* Enhanced relationship indicators */}
                <div className="mt-2 space-y-1">
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
                
                <button 
                  onClick={() => handleMarkerClick('user', user)}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View Profile →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      });
    
    // Gym markers with enhanced images
    filteredGyms
      .filter(gym => {
        if (gym.location?.coordinates && Array.isArray(gym.location.coordinates)) {
          const [lng, lat] = gym.location.coordinates;
          return lat && lng && !isNaN(lat) && !isNaN(lng);
        }
        const lat = gym.lat || gym.location?.lat;
        const lng = gym.lng || gym.location?.lng;
        return lat && lng && !isNaN(lat) && !isNaN(lng);
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
        
        markers.push(
          <Marker 
            key={`gym-${gymId}`} 
            position={[lat, lng]} 
            icon={ImageService.createGymImageIcon(gym)}
            eventHandlers={{
              click: () => handleMarkerClick('gym', { ...gym, lat, lng })
            }}
          >
            <Popup>
              <div className="min-w-48">
                <div className="mb-3 w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={ImageService.getGymImage(gym)}
                    alt={gym.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-4xl">{ImageService.getGymTypeInfo(gym.type).icon}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{gym.name}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                    {gym.type?.replace('_', ' ') || 'gym'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{gym.description}</p>
                
                {/* Distance indicator */}
                {currentLocation && (
                  <p className="text-xs text-gray-400 mb-2">
                    {DistanceUtils.calculateDistance(
                      currentLocation.lat, 
                      currentLocation.lng, 
                      lat, 
                      lng
                    ).toFixed(1)} km away
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-blue-600">
                    <Users className="h-4 w-4" />
                    <span>{gym.memberCount || 0} members</span>
                  </div>
                  
                  {gym.rating && typeof gym.rating === 'number' && !isNaN(gym.rating) && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <span>⭐</span>
                      <span>{gym.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleMarkerClick('gym', { ...gym, lat, lng })}
                  className="mt-3 w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
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

  // Helper functions
  const handleMarkerClick = (type, data) => {
    if (mapRef.current) {
      const map = mapRef.current;
      const targetZoom = 16;
      
      map.flyTo([data.lat, data.lng], targetZoom, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.15
      });
    }

    setSidePanel({
      isOpen: true,
      data,
      type
    });
  };

  const handleCurrentUserClick = () => {
    if (currentLocation && mapRef.current) {
      const map = mapRef.current;
      map.flyTo([currentLocation.lat, currentLocation.lng], 16, {
      animate: true,
      duration: 1.2, 
      easeLinearity: 0.1, 
      noMoveStart: false 
    });
    }
  };

  const handleAvatarSave = async (newAvatar) => {
    try {
      setAvatar(newAvatar);
      setShowAvatarDesigner(false);
      
      await gymbrosService.updateProfile({
        avatar: newAvatar
      });
      
      toast.success('Avatar saved successfully!');
      
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
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

  const handleRefresh = async () => {
    setLoading(true);
    
    // Fetch with current location and filters for optimized backend queries
    const locationFilters = currentLocation ? {
      maxDistance: filters.maxDistance,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      ...filters
    } : filters;
    
    await Promise.all([
      fetchUsers(locationFilters, true), 
      fetchGyms(true)
    ]);
    setLoading(false);
    toast.success('Map data refreshed!');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
    
    // If max distance changed significantly, refetch from backend
    if (Math.abs(newFilters.maxDistance - filters.maxDistance) > 10 && currentLocation) {
      const locationFilters = {
        maxDistance: newFilters.maxDistance,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        ...newFilters
      };
      
      fetchUsers(locationFilters, true);
    }
  };

  // Main render logic
  if (locationStatus === 'loading' || locationStatus === 'error') {
    return (
      <GeolocationLoadingScreen 
        onLocationFound={handleLocationFound}
        onLocationError={handleLocationError}
      />
    );
  }

  if (!mapReady || loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">
            {locationStatus === 'loaded' ? 'Loading map data...' : 'Preparing map...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapControls 
        onSearch={handleSearch}
        onFilterToggle={() => setShowFilters(true)}
        loading={dataLoading.users || dataLoading.gyms}
        onRefresh={handleRefresh}
        avatar={avatar}
        userGender={userGender}
        onAvatarClick={() => setShowAvatarDesigner(true)}
      />
        
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
        <MapEventHandler 
          onMarkerClick={handleMarkerClick} 
          currentUserLocation={currentLocation}
        />
        
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
      
      {/* Enhanced Avatar Designer Modal */}
      {showAvatarDesigner && (
        <MouseAvatarDesigner
          currentAvatar={avatar}
          userGender={userGender}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarDesigner(false)}
        />
      )}

      {/* Status indicator */}
      <div className="absolute bottom-4 left-4 z-30 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            locationStatus === 'loaded' ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span>
            {locationStatus === 'loaded' ? 'Location Active' : 'Location Error'}
          </span>
        </div>
      </div>

      {/* Results counter */}
      <div className="absolute bottom-4 right-4 z-30 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center gap-4">
          <span>👥 {filteredUsers.length}</span>
          <span>🏋️ {filteredGyms.length}</span>
        </div>
      </div>

      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-sm z-40">
          <h4 className="font-bold mb-2">🐛 Debug Info</h4>
          <div className="space-y-1">
            <div>Raw Users: {rawUsers.length} | Filtered: {filteredUsers.length}</div>
            <div>Raw Gyms: {rawGyms.length} | Filtered: {filteredGyms.length}</div>
            <div>Location Status: {locationStatus}</div>
            <div>Current Location: {currentLocation ? `[${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}]` : 'None'}</div>
            <div>Map Ready: {mapReady ? 'Yes' : 'No'}</div>
            <div>Search: "{searchQuery}"</div>
            <div>Max Distance: {filters.maxDistance}km</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymBrosMap;
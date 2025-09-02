import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../contexts/PermissionContext'; // Add this import
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, AlertTriangle, Loader, MapPinIcon } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import AvatarDisplay from './components/AvatarDisplay';
import MapSidePanel from './components/MapSidePanel';
import LocationRequiredModal from '../common/LocationRequestModal'; // Add this import
import { ImageService, DistanceUtils, FilterUtils } from './components/ImageUtils';
import gymbrosService from '../../services/gymbros.service';
import { useSocket } from '../../SocketContext';
import { toast } from 'sonner';
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


// Main GymBrosMap Component - CLEANED VERSION
const GymBrosMap = ({ userProfile }) => {
  const { 
    users: rawUsers, 
    gyms: rawGyms, 
    loading: dataLoading,
    fetchUsers, 
    fetchGyms,
    invalidate
  } = useGymBrosData();

  // PermissionsContext integration
  const {
    hasLocationPermission,
    currentLocation,
    locationError,
    requestLocationPermission,
    updateLocation,
    isInitialized: permissionsInitialized,
    permissions
  } = usePermissions();

  // Location modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationRequesting, setLocationRequesting] = useState(false);

  // Map states
  const [mapReady, setMapReady] = useState(false);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  
  // Existing states...
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [currentZoom, setCurrentZoom] = useState(13);
  const mapRef = useRef();
  const { socket, connected, setMapActivityState, userActivity } = useSocket();

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
    showRecommended: false,
    showMatches: true,
    showGymMembers: false,
    minRating: 0
  });

  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);

  const { darkMode } = useTheme();
  const userGender = userProfile?.gender || 'Male';

  // Check location permission and show modal if needed
  useEffect(() => {
    if (!permissionsInitialized) return;

    console.log('🗺️ GymBrosMap: Permission status check', {
      hasLocationPermission,
      permissionStatus: permissions.location.status,
      currentLocation: !!currentLocation
    });

    if (!hasLocationPermission && permissions.location.status !== 'granted') {
      // Show location modal if permission is not granted
      setShowLocationModal(true);
      setMapReady(false);
    } else if (hasLocationPermission && currentLocation) {
      // Permission granted and location available
      handleLocationReady(currentLocation);
    } else if (hasLocationPermission && !currentLocation) {
      // Permission granted but no location yet - trigger location update
      handleRequestLocationUpdate();
    }
  }, [permissionsInitialized, hasLocationPermission, currentLocation, permissions.location.status]);

  // 🚀 Smart Location: Notify SocketContext when map is active/inactive
  useEffect(() => {
    // Map becomes active when it's ready and visible
    if (mapReady && !showLocationModal && !loading) {
      console.log('🗺️ GymBrosMap: Map is now ACTIVE - increasing location update frequency');
      setMapActivityState(true);
    } else {
      console.log('🗺️ GymBrosMap: Map is now INACTIVE - normal location update frequency');
      setMapActivityState(false);
    }

    // Cleanup when component unmounts
    return () => {
      setMapActivityState(false);
    };
  }, [mapReady, showLocationModal, loading, setMapActivityState]);

  // 🚀 Smart Location: Track user interactions with map
  useEffect(() => {
    const mapElement = mapRef.current?._container;
    if (!mapElement) return;

    const handleMapInteraction = () => {
      // User is actively interacting with map
      setMapActivityState(true);
      console.log('🗺️ User interacting with map - boosting location frequency');
    };

    // Track map interactions
    mapElement.addEventListener('mousedown', handleMapInteraction);
    mapElement.addEventListener('touchstart', handleMapInteraction);
    mapElement.addEventListener('wheel', handleMapInteraction);

    return () => {
      mapElement.removeEventListener('mousedown', handleMapInteraction);
      mapElement.removeEventListener('touchstart', handleMapInteraction);
      mapElement.removeEventListener('wheel', handleMapInteraction);
    };
  }, [mapRef.current, setMapActivityState]);

  // Handle location ready
  const handleLocationReady = async (location) => {
    try {
      console.log('🗺️ GymBrosMap: Location ready', location);
      
      setMapCenter([location.lat, location.lng]);
      setShowLocationModal(false);
      
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
      console.error('Error handling location ready:', error);
      toast.error('Failed to load map data');
      setLoading(false);
    }
  };

  // Handle location permission request
  const handleLocationRequest = async () => {
    setLocationRequesting(true);
    
    try {
      console.log('🗺️ GymBrosMap: Requesting location permission');
      const granted = await requestLocationPermission(true);
      
      if (granted) {
        console.log('✅ Location permission granted');
        // The useEffect will handle the rest when currentLocation updates
      } else {
        console.log('❌ Location permission denied');
        toast.error('Location access is required to use GymBros Map');
      }
    } catch (error) {
      console.error('Failed to request location:', error);
      toast.error('Failed to request location permission');
    } finally {
      setLocationRequesting(false);
    }
  };

  // Handle location update request (when permission exists but no current location)
  const handleRequestLocationUpdate = async () => {
    try {
      console.log('🗺️ GymBrosMap: Updating location');
      // This will trigger the PermissionsContext to get fresh location
      // The location will be provided via currentLocation when ready
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Close location modal (for "Not Now" option)
  const handleCloseLocationModal = () => {
    setShowLocationModal(false);
    toast.info('GymBros Map requires location access to show nearby gyms and partners');
    // Optionally redirect user away from map or show alternative content
  };

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

  // REMOVE these old functions - they're from the old geolocation system:
  // - handleLocationFound (not needed with PermissionsContext)
  // - handleLocationError (not needed with PermissionsContext)
  
  const handleProfileUpdate = () => {
    // Trigger a profile refresh
    setProfileRefreshTrigger(prev => prev + 1);
    
    // Emit event to parent to refresh profiles
    const event = new CustomEvent('refreshProfiles');
    window.dispatchEvent(event);
  };

  const getUserGymIds = (userProfile) => {
    const gymIds = new Set();
    
    // Early return if userProfile is null or undefined
    if (!userProfile) {
      return [];
    }
    
    // Add primary gym
    if (userProfile.primaryGym) {
      gymIds.add(userProfile.primaryGym.toString());
    }
    
    // Add gyms from the gyms array
    if (userProfile.gyms && Array.isArray(userProfile.gyms)) {
      userProfile.gyms.forEach((gymAssoc) => {
        // Check if gym is active
        const isActiveGym = 
          (gymAssoc.isActive === true) && // Must be explicitly true
          gymAssoc.gym; // gym exists
          
        if (isActiveGym) {
          const gymId = gymAssoc.gym._id || gymAssoc.gym;
          gymIds.add(gymId.toString());
        }
      });
    }
    
    return Array.from(gymIds);
  };

  const MapZoomHandler = ({ onZoomChange }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;
      
      const handleZoom = () => {
        onZoomChange(map.getZoom());
      };
      
      // Initial zoom
      handleZoom();
      
      map.on('zoomend', handleZoom);
      
      return () => {
        map.off('zoomend', handleZoom);
      };
    }, [map, onZoomChange]);
    
    return null;
  };

const addLocationOffsets = (users, currentLocation, userProfile) => {
  if (!users || users.length === 0) return users;

  const processedUsers = [...users];
  const locationGroups = new Map();

  // First pass: group ALL users by similar locations (including main user for grouping purposes)
  processedUsers.forEach((user, index) => {
    if (!user.lat || !user.lng) return;

    const locationKey = `${Math.round(user.lat * 1000)}_${Math.round(user.lng * 1000)}`;
    if (!locationGroups.has(locationKey)) {
      locationGroups.set(locationKey, []);
    }
    locationGroups.get(locationKey).push({ user, index });
  });

  // ALSO add current user's location to grouping if it overlaps with any user group
  if (currentLocation && userProfile) {
    const currentUserLocationKey = `${Math.round(currentLocation.lat * 1000)}_${Math.round(currentLocation.lng * 1000)}`;
    
    // Check if any users are at the current user's location
    const usersAtCurrentLocation = processedUsers.filter(user => {
      const userLocationKey = `${Math.round(user.lat * 1000)}_${Math.round(user.lng * 1000)}`;
      return userLocationKey === currentUserLocationKey;
    });

    // If there are users at current user's location, add them to a group that includes the main user conceptually
    if (usersAtCurrentLocation.length > 0) {
      if (!locationGroups.has(currentUserLocationKey)) {
        locationGroups.set(currentUserLocationKey, []);
      }
      // The group already contains the users, we just need to track that main user is here too
    }
  }

  // Debug: Log grouping info
  if (process.env.NODE_ENV === 'development') {
    console.log('Location Groups:', Array.from(locationGroups.entries()).map(([key, group]) => {
      const currentUserLocationKey = currentLocation ? 
        `${Math.round(currentLocation.lat * 1000)}_${Math.round(currentLocation.lng * 1000)}` : null;
      
      return {
        key,
        count: group.length,
        users: group.map(g => g.user.name || g.user.id || g.user._id),
        overlapsCurrentUser: key === currentUserLocationKey,
        hasMainUser: group.some(g => userProfile && (g.user.id === userProfile.id || g.user._id === userProfile._id))
      };
    }));
  }

  locationGroups.forEach((group, locationKey) => {
    // Now we process groups with 2+ users OR groups that overlap with current user location
    const currentUserLocationKey = currentLocation ? 
      `${Math.round(currentLocation.lat * 1000)}_${Math.round(currentLocation.lng * 1000)}` : null;
    
    const overlapsCurrentUser = locationKey === currentUserLocationKey;
    const hasMainUserInGroup = group.some(({ user }) => 
      userProfile && (user.id === userProfile.id || user._id === userProfile._id)
    );

    // Skip if only 1 user and doesn't overlap with current user
    if (group.length <= 1 && !overlapsCurrentUser) return;

    const centerLat = group[0].user.lat;
    const centerLng = group[0].user.lng;
    
    // If current user location overlaps but main user isn't in the group, use current user location as center
    let actualCenterLat = centerLat;
    let actualCenterLng = centerLng;
    
    if (overlapsCurrentUser && currentLocation) {
      actualCenterLat = currentLocation.lat;
      actualCenterLng = currentLocation.lng;
    }
    
    // Calculate optimal radius based on group size
    const baseRadius = 0.003; // ~111 meters
    const totalUsersToOffset = overlapsCurrentUser ? group.length + 1 : group.length; // +1 for main user space
    const radiusMultiplier = Math.max(1, Math.sqrt(totalUsersToOffset) * 0.8);
    const optimalRadius = baseRadius * radiusMultiplier;

    let offsetIndex = 0; // Track position for non-main users

    group.forEach(({ user, index }, groupIndex) => {
      // NEVER offset the main user, even if they're in a cluster
      if (userProfile && (user.id === userProfile.id || user._id === userProfile._id)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Skipping offset for main user ${user.id || user._id} in cluster ${locationKey}`);
        }
        return;
      }

      const userId = user.id || user._id || `user-${index}`;
      
      // Calculate position around circle, skipping the "main user" position if current user overlaps
      if (overlapsCurrentUser) {
        // Reserve position 0 for main user (even though they're not being moved)
        offsetIndex++;
      }
      
      const angleStep = (2 * Math.PI) / totalUsersToOffset;
      const userAngle = offsetIndex * angleStep;
      offsetIndex++;

      const latOffset = optimalRadius * Math.cos(userAngle);
      const lngOffset = optimalRadius * Math.sin(userAngle);

      // Debug: Log offset details
      if (process.env.NODE_ENV === 'development') {
        console.log(`Offsetting user ${userId} in cluster ${locationKey}:`, {
          groupIndex,
          offsetIndex: offsetIndex - 1,
          totalUsersToOffset,
          angle: (userAngle * 180 / Math.PI).toFixed(1) + '°',
          radius: (optimalRadius * 111000).toFixed(0) + 'm',
          overlapsCurrentUser,
          hasMainUserInGroup,
          original: [actualCenterLat.toFixed(6), actualCenterLng.toFixed(6)],
          new: [(actualCenterLat + latOffset).toFixed(6), (actualCenterLng + lngOffset).toFixed(6)]
        });
      }

      // Update the user's position in the processed array
      processedUsers[index] = {
        ...user,
        lat: actualCenterLat + latOffset,
        lng: actualCenterLng + lngOffset,
        originalLat: user.lat,
        originalLng: user.lng,
        wasOffset: true,
        offsetReason: overlapsCurrentUser ? 'current-user-cluster' : 'user-clustering',
        clusterInfo: {
          centerLat: actualCenterLat,
          centerLng: actualCenterLng,
          totalUsers: totalUsersToOffset,
          userPosition: offsetIndex - 1
        }
      };
    });
  });

  return processedUsers;
};
const spacedFilteredUsers = useMemo(() => {
  return addLocationOffsets(filteredUsers, currentLocation, userProfile);
}, [filteredUsers, currentLocation, userProfile]);

  const renderMembershipCircles = () => {
    const circles = [];
    
    // Add null check for userProfile
    if (!userProfile) {
      return circles;
    }
    
    const userGymIds = getUserGymIds(userProfile);
    
    if (userGymIds.length === 0) {
      return circles;
    }
    
    const memberGyms = filteredGyms.filter(gym => {
      const gymId = gym._id || gym.id;
      return userGymIds.includes(gymId.toString());
    });
    
    memberGyms
      .filter(gym => {
        // Ensure gym has valid coordinates
        let hasValidCoords = false;
        let lat, lng;
        
        if (gym.location?.coordinates && Array.isArray(gym.location.coordinates)) {
          [lng, lat] = gym.location.coordinates;
          hasValidCoords = lat && lng && !isNaN(lat) && !isNaN(lng);
        } else {
          lat = gym.lat || gym.location?.lat;
          lng = gym.lng || gym.location?.lng;
          hasValidCoords = lat && lng && !isNaN(lat) && !isNaN(lng);
        }
        
        return hasValidCoords;
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
        
        // Calculate zoom-responsive radius
        // Base radius scales with zoom level to appear consistent visually
        const getZoomAdjustedRadius = (baseRadius, zoom) => {
          // Radius scaling formula - circles get smaller as you zoom out
          const zoomFactor = Math.pow(2, Math.max(0, 15 - zoom));
          return Math.max(50, baseRadius * zoomFactor); // Minimum 50m radius
        };
        
        const baseRadius = 100; // Base radius in meters
        const radius = getZoomAdjustedRadius(baseRadius, currentZoom);
        
        // Main membership circle (blue with transparency)
        circles.push(
          <Circle
            key={`membership-circle-${gymId}`}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{
              color: '#2563EB',        // Stronger blue border
              fillColor: '#3B82F6',    // Blue fill
              fillOpacity: 0.2,        // Adjusted for better visibility
              weight: 3,               // Border thickness
              opacity: 0.8,            // Border opacity
              dashArray: '8, 12',      // Dashed pattern
            }}
          />
        );
        
        // Add animated pulse circle for better visibility
        circles.push(
          <Circle
            key={`membership-pulse-${gymId}`}
            center={[lat, lng]}
            radius={radius + getZoomAdjustedRadius(30, currentZoom)}
            pathOptions={{
              color: '#1D4ED8',        // Darker blue
              fillColor: 'transparent',
              fillOpacity: 0,
              weight: 2,
              opacity: 0.6,
              dashArray: '4, 12',      // Different dotted pattern
            }}
          />
        );
        
        // Add inner circle for primary gym
        const isPrimaryGym = userProfile?.primaryGym && 
                            userProfile.primaryGym.toString() === gymId.toString();
        
        if (isPrimaryGym) {
          circles.push(
            <Circle
              key={`primary-gym-${gymId}`}
              center={[lat, lng]}
              radius={radius * 0.6} // Inner circle is 60% of main circle
              pathOptions={{
                color: '#1E40AF',      // Darker blue for primary
                fillColor: '#3B82F6',
                fillOpacity: 0.4,      // More opaque for primary
                weight: 2,
                opacity: 1,
              }}
            />
          );
          
          // Add a small center dot for primary
          circles.push(
            <Circle
              key={`primary-center-${gymId}`}
              center={[lat, lng]}
              radius={Math.max(10, getZoomAdjustedRadius(8, currentZoom))} // Zoom-responsive center dot
              pathOptions={{
                color: '#1E40AF',
                fillColor: '#1E40AF',
                fillOpacity: 1,
                weight: 2,
                opacity: 1,
              }}
            />
          );
        }
      });
    
    return circles;
  };

  const handleOpenSidePanel = (type, data) => {
    setSidePanel({
      isOpen: true,
      data,
      type
    });
  };

const renderMarkers = () => {
  const markers = [];

  // Current user marker - ALWAYS use exact current location, never offset
  if (currentLocation) {
    markers.push(
      <Marker
        key="current-user-location"
        position={[currentLocation.lat, currentLocation.lng]} // Always exact position
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
        <Popup>
          <div className="min-w-48 text-center">
            <AvatarDisplay 
              avatar={avatar} 
              userGender={userGender} 
              size={60} 
            />
            <h3 className="font-semibold text-gray-900 mt-2">You are here</h3>
            <p className="text-sm text-gray-500">Your current location</p>
          </div>
        </Popup>
      </Marker>
    );

    // Add a subtle circle around current user if there are other users nearby
    const nearbyUsers = spacedFilteredUsers.filter(user => {
      if (!user.originalLat || !user.originalLng) return false;
      const distance = DistanceUtils.calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        user.originalLat, 
        user.originalLng
      );
      return distance < 0.5; // Within 500m
    });

    if (nearbyUsers.length > 0) {
      markers.push(
        <Circle
          key="current-user-area"
          center={[currentLocation.lat, currentLocation.lng]}
          radius={150} // 150m radius
          pathOptions={{
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10',
          }}
        />
      );
    }
  }

  // Add membership circles for user's gyms
  const membershipCircles = renderMembershipCircles();
  markers.push(...membershipCircles);
  
  // Other users - use offset positions, EXCLUDE main user
  spacedFilteredUsers
    .filter(user => user.lat && user.lng)
    .filter(user => {
      // CRITICAL: Exclude the main user from being rendered here
      return !(user.id === userProfile?.id || user._id === userProfile?._id);
    })
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
              
              {/* Distance indicator - use original location for accurate distance */}
              {currentLocation && (
                <p className="text-xs text-gray-400 mt-1">
                  {DistanceUtils.calculateDistance(
                    currentLocation.lat, 
                    currentLocation.lng, 
                    user.originalLat || user.lat,
                    user.originalLng || user.lng
                  ).toFixed(1)} km away
                </p>
              )}
              
              {/* Show offset indicator for debugging */}
              {user.wasOffset && process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-blue-500 mt-1">
                  Position adjusted ({user.offsetReason})
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
  
    
    // Gym markers with enhanced membership status (unchanged)
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
        const userGymIds = getUserGymIds(userProfile);
        const isMember = userGymIds.includes(gymId.toString());
        const isPrimaryGym = userProfile?.primaryGym && 
                            userProfile.primaryGym.toString() === gymId.toString();
        
        // Find specific membership details
        let membershipDetails = null;
        if (isMember && userProfile?.gyms) {
          membershipDetails = userProfile.gyms.find(g => 
            g.gym.toString() === gymId.toString() && g.isActive
          );
        }
        
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
                
                {/* Membership Status Indicator */}
                {isMember && (
                  <div className="mb-2 space-y-1">
                    {isPrimaryGym && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        <span>⭐</span>
                        <span className="font-medium">Primary Gym</span>
                      </div>
                    )}
                    
                    {!isPrimaryGym && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        <span>🏋️</span>
                        <span className="font-medium">Member</span>
                      </div>
                    )}
                    
                    {membershipDetails && (
                      <div className="text-xs text-blue-600">
                        {membershipDetails.membershipType} • {membershipDetails.visitFrequency}
                      </div>
                    )}
                  </div>
                )}
                
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenSidePanel('gym', { ...gym, lat, lng });
                  }}
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

  const handleRefresh = async () => {
    setLoading(true);
    
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

  // Show loading screen while permissions are initializing
  if (!permissionsInitialized) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Initializing permissions...</p>
        </div>
      </div>
    );
  }

  // Show location modal if location permission is needed
  if (showLocationModal) {
    return (
      <>
        {/* Background map (blurred/disabled) */}
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">GymBros Map</p>
              <p className="text-sm">Location access required</p>
            </div>
          </div>
        </div>
        
        {/* Location Required Modal */}
        <LocationRequiredModal
          isOpen={showLocationModal}
          onRequestLocation={handleLocationRequest}
          onClose={handleCloseLocationModal}
          permissionStatus={permissions.location.status}
          isRequesting={locationRequesting}
        />
      </>
    );
  }

  // Show loading screen while map is not ready
  if (!mapReady || loading || !currentLocation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300">
            {currentLocation ? 'Loading map data...' : 'Getting your location...'}
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
        attributionControl={false} 
      >
        <TileLayer
          url={darkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
          attribution=""
        />
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <MapZoomHandler onZoomChange={setCurrentZoom} />
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
      
      {/* All existing modals and panels remain the same */}
      <MapSidePanel 
        isOpen={sidePanel.isOpen}
        onClose={() => setSidePanel({ isOpen: false, data: null, type: null })}
        data={sidePanel.data}
        type={sidePanel.type}
        currentLocation={currentLocation}
        userProfile={userProfile}
        onProfileUpdate={handleProfileUpdate}
      />

      <MapFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFiltersApply}
      />
      
      {showAvatarDesigner && (
        <MouseAvatarDesigner
          currentAvatar={avatar}
          userGender={userGender}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarDesigner(false)}
        />
      )}

      {/* Updated Debug Panel - FIXED REFERENCES */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-sm z-40">
          <h4 className="font-bold mb-2">🐛 Debug Info</h4>
          <div className="space-y-1">
            <div>Permission Status: {permissions.location.status}</div>
            <div>Has Permission: {hasLocationPermission ? 'Yes' : 'No'}</div>
            <div>Current Location: {currentLocation ? `[${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}]` : 'None'}</div>
            <div>Map Ready: {mapReady ? 'Yes' : 'No'}</div>
            <div>Raw Users: {rawUsers.length} | Filtered: {filteredUsers.length}</div>
            <div>Raw Gyms: {rawGyms.length} | Filtered: {filteredGyms.length}</div>
            <div>Search: "{searchQuery}"</div>
            <div>Max Distance: {filters.maxDistance}km</div>
            <div>User Gyms: {userProfile ? getUserGymIds(userProfile).length : 0}</div>
            <hr className="border-gray-500 my-2" />
            <div className="text-yellow-300">🚀 Smart Location Updates:</div>
            <div>Activity: <span className={`font-bold ${
              userActivity === 'active' ? 'text-green-400' : 
              userActivity === 'normal' ? 'text-yellow-400' : 'text-red-400'
            }`}>{userActivity}</span></div>
            <div>Update Frequency: {
              userActivity === 'active' ? '1 min' : 
              userActivity === 'normal' ? '3 min' : '10 min'
            }</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymBrosMap;
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, AlertTriangle, Loader, MapPinIcon } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import { createGymIcon } from './components/MouseAvatarUtils';
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

// Enhanced Image Service with fallbacks and error handling
class ImageService {
  static getSupabaseBaseUrl() {
    return 'https://qqfdpetawucteqzrlzyn.supabase.co/storage/v1/object/public/uploads';
  }
  
  static getAvatarUrl(avatar, userGender = 'Male', size = 256) {
    // 1. Custom uploaded avatar (highest priority)
    if (avatar?.customAvatarUrl) {
      return avatar.customAvatarUrl;
    }

    // 2. Generated avatar image
    if (avatar?.generatedImageUrl) {
      return avatar.generatedImageUrl;
    }
    
    // 3. Fallback to default avatar
    return this.getDefaultAvatar(userGender, size);
  }

  static getDefaultAvatar(userGender = 'Male', size = 256) {
    const genderFolder = userGender.toLowerCase();
    const baseUrl = this.getSupabaseBaseUrl();
    return `${baseUrl}/gym-bros/avatar-assets/fallback/default_mouse_${genderFolder}.png`;
  }

  static getGymImage(gym) {
    if (gym.images && gym.images.length > 0) {
      return gym.images[0]; 
    }

    if (gym.profileImage) {
      return gym.profileImage;
    }

    return this.getDefaultGymImage(gym.type || 'gym');
  }

  static getDefaultGymImage(gymType = 'gym') {
    const baseUrl = this.getSupabaseBaseUrl();
    const typeImages = {
      'gym': `${baseUrl}/gym-bros/gym-assets/defaults/default_gym.png`,
      'community': `${baseUrl}/gym-bros/gym-assets/defaults/default_community.png`,
      'event': `${baseUrl}/gym-bros/gym-assets/defaults/default_event.png`,
      'sport_center': `${baseUrl}/gym-bros/gym-assets/defaults/default_sport_center.png`,
      'other': `${baseUrl}/gym-bros/gym-assets/defaults/default_other.png`
    };
    
    return typeImages[gymType] || typeImages['gym'];
  }
  
  // Create enhanced avatar icon with image fallback
  static createImageIcon(avatar, userGender, isCurrentUser = false, userType = {}) {
    const avatarUrl = this.getAvatarUrl(avatar, userGender, 256); // Use larger size for better quality
    const size = isCurrentUser ? 90 : 75; // Increase marker size for user avatars

    return L.divIcon({
      html: `
        <div class="relative" style="width: ${size}px; height: ${size}px;">
          <img 
            src="${avatarUrl}" 
            style="
              width: ${size}px; 
              height: ${size}px; 
              object-fit: contain; 
              border-radius: 0;
              background: transparent;
              box-shadow: none;
              border: none;
              display: block;
              position: relative;
              z-index: 1020;
            "
            onerror="this.src='${this.getDefaultAvatar(userGender)}'"
          />
          <!-- Removed blue dot for current user -->
          ${userType.isMatch && !isCurrentUser ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 border-2 border-white rounded-full flex items-center justify-center">
              <div style="font-size: 12px; line-height: 1;">❤️</div>
            </div>
          ` : ''}
          ${userType.isGymMember && !userType.isMatch && !isCurrentUser ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
              <div style="color: white; font-size: 10px; line-height: 1;">🏋️</div>
            </div>
          ` : ''}
          ${userType.isRecommendation && !userType.isMatch && !userType.isGymMember && !isCurrentUser ? `
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 border-2 border-white rounded-full flex items-center justify-center">
              <div style="color: white; font-size: 10px; line-height: 1;">⭐</div>
            </div>
          ` : ''}
        </div>
      `,
      className: `custom-avatar-icon ${isCurrentUser ? 'current-user' : ''}`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  }

  // Create enhanced gym icon with images
  static createGymImageIcon(gym, isRealtime = false) {
    const gymImage = this.getGymImage(gym);
    const typeInfo = this.getGymTypeInfo(gym.type);
    const size = 50;
    // Remove border/background/circle, just show the image or fallback icon
    // Remove green active/verified icon
    return L.divIcon({
      html: `
        <div class="relative" style="width: ${size}px; height: ${size}px;">
          <img 
            src="${gymImage}" 
            style="
              width: ${size}px; 
              height: ${size}px; 
              object-fit: cover; 
              border-radius: 0;
              background: transparent;
              display: block;
              position: relative;
              z-index: 1000;
            "
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
          />
          <div style="
            display: none;
            width: ${size}px; 
            height: ${size}px; 
            background: transparent;
            border-radius: 0;
            align-items: center; 
            justify-content: center;
            font-size: 24px;
            position: absolute;
            top: 0;
            left: 0;
          ">${typeInfo.icon}</div>
          ${gym.isNew ? `
            <div class="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-1 rounded-full" style="font-size: 8px; line-height: 1.2; padding: 2px 4px;">
              NEW
            </div>
          ` : ''}
          ${isRealtime ? `
            <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 border-2 border-white rounded-full">
              <div class="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
            </div>
          ` : ''}
        </div>
      `,
      className: 'custom-gym-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }
  
  static getBorderColor(isCurrentUser, userType) {
    if (isCurrentUser) return '#10B981'; // Green for current user
    if (userType.isMatch) return '#EC4899'; // Pink for matches
    if (userType.isGymMember) return '#F59E0B'; // Orange for gym members
    if (userType.isRecommendation) return '#8B5CF6'; // Purple for recommendations
    return '#3B82F6'; // Blue default
  }

  static getGymTypeInfo(type) {
    const types = {
      'gym': { icon: '🏋️', color: '#3B82F6', bgColor: '#EBF8FF' },
      'community': { icon: '🏘️', color: '#10B981', bgColor: '#ECFDF5' },
      'event': { icon: '📅', color: '#F59E0B', bgColor: '#FFFBEB' },
      'sport_center': { icon: '⚽', color: '#EF4444', bgColor: '#FEF2F2' },
      'other': { icon: '📍', color: '#8B5CF6', bgColor: '#F5F3FF' }
    };
    return types[type] || types.gym;
  }
}

// Enhanced Avatar Display Component with loading states
const AvatarDisplay = ({ avatar, userGender, size = 90, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const avatarUrl = ImageService.getAvatarUrl(avatar, userGender, size);
  const fallbackUrl = ImageService.getDefaultAvatar(userGender, size);

  // Increase container and image size, use object-fit: contain to avoid cropping
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 rounded-full flex items-center justify-center">
          <Loader className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={imageError ? fallbackUrl : avatarUrl}
        alt="Avatar"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: '0',
          background: 'transparent',
          display: loading ? 'none' : 'block'
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setImageError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

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

// Map Controls Component (REMOVED LOCATION TRACKING TOGGLE)
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
    maxDistance: 25
  });

  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);

  const { darkMode } = useTheme();
  const userGender = userProfile?.gender || 'Male';

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
      
      // Start fetching map data
      await Promise.all([
        fetchUsers(),
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

  // Render markers with enhanced image handling
  const renderMarkers = () => {
    const markers = [];

    // Current user marker
    if (currentLocation) {
      markers.push(
        <Marker
          key="current-user-location"
          position={[currentLocation.lat, currentLocation.lng]}
          icon={ImageService.createImageIcon(avatar, userGender, true)}
          eventHandlers={{
            click: handleCurrentUserClick
          }}
        >
          <Popup>
            <div className="text-center p-2">
              <AvatarDisplay 
                avatar={avatar} 
                userGender={userGender} 
                size={60} 
              />
              <h3 className="font-semibold mt-2">You are here</h3>
              <p className="text-sm text-gray-600">
                Tap to center map on your location
              </p>
            </div>
          </Popup>
        </Marker>
      );
    }

    // User markers with enhanced images
    users
      .filter(user => user.lat && user.lng)
      .forEach(user => {
        const isMatch = user.source === 'match' || user.isMatch;
        const isGymMember = user.source === 'gym_member' || user.sharedGym;
        const isRecommendation = user.source === 'recommendation' || user.isRecommendation;
        
        markers.push(
          <Marker 
            key={`user-${user.id || user._id}`} 
            position={[user.lat, user.lng]} 
            icon={ImageService.createImageIcon(
              user.avatar, 
              user.gender || 'Male', 
              false, 
              { isMatch, isGymMember, isRecommendation }
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
                  size={60} 
                />
                <h3 className="font-semibold text-gray-900 mt-2">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.age} • {user.experienceLevel}</p>
                
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
    gyms
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
      map.flyTo([currentLocation.lat, currentLocation.lng], 18, {
        animate: true,
        duration: 1.2
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
    await Promise.all([
      fetchUsers(true), 
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

      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-sm z-40">
          <h4 className="font-bold mb-2">🐛 Debug Info</h4>
          <div className="space-y-1">
            <div>Users: {users.length}</div>
            <div>Gyms: {gyms.length}</div>
            <div>Location Status: {locationStatus}</div>
            <div>Current Location: {currentLocation ? `[${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}]` : 'None'}</div>
            <div>Map Ready: {mapReady ? 'Yes' : 'No'}</div>
            <div>Search: "{searchQuery}"</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymBrosMap;
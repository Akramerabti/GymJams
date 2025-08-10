import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2 } from 'lucide-react';
import MouseAvatarDesigner from './components/MouseAvatarDesigner';
import { renderMouseAvatar, createMouseIcon, createGymIcon } from './components/MouseAvatarUtils';
import gymbrosService from '../../services/gymbros.service';
import gymBrosLocationService from '../../services/gymBrosLocation.service';
import api from '../../services/api';

// Import clustering if available
let MarkerClusterGroup;
try {
  MarkerClusterGroup = require('react-leaflet-cluster').default;
} catch (e) {
  MarkerClusterGroup = null;
}

// Default center (can be overridden by user location)
const DEFAULT_CENTER = [45.5017, -73.5673]; // Montreal

// Smart cache service that prevents unnecessary API calls
class SmartMapCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.viewportHistory = [];
    this.lastFetchTime = {
      users: 0,
      gyms: 0
    };
    
    // Cache TTL settings
    this.cacheTTL = {
      gyms: 15 * 60 * 1000,      // 15 minutes (gyms don't move)
      users: 90 * 1000,          // 1.5 minutes (users move around)
      viewport: 5 * 60 * 1000    // 5 minutes for viewport-based cache
    };
    
    // Minimum time between API calls
    this.minFetchInterval = {
      gyms: 30 * 1000,           // 30 seconds minimum between gym fetches
      users: 15 * 1000           // 15 seconds minimum between user fetches
    };
  }

  // Generate a stable cache key based on rounded viewport
  generateCacheKey(type, bounds, filters) {
    // Round to reduce cache fragmentation (roughly 1km grid)
    const precision = 0.01;
    const north = Math.ceil(bounds.north / precision) * precision;
    const south = Math.floor(bounds.south / precision) * precision;
    const east = Math.ceil(bounds.east / precision) * precision;
    const west = Math.floor(bounds.west / precision) * precision;
    
    const viewportKey = `${north.toFixed(2)}_${south.toFixed(2)}_${east.toFixed(2)}_${west.toFixed(2)}`;
    const filtersKey = JSON.stringify({
      maxDistance: filters.maxDistance,
      showUsers: filters.showUsers,
      showGyms: filters.showGyms,
      gymTypes: filters.gymTypes
    });
    
    return `${type}_${viewportKey}_${filtersKey}`;
  }

  // Check if we should skip this fetch due to recent activity
  shouldSkipFetch(type, bounds) {
    const now = Date.now();
    const lastFetch = this.lastFetchTime[type];
    const minInterval = this.minFetchInterval[type];
    
    // Skip if we fetched too recently
    if (now - lastFetch < minInterval) {
      console.log(`⏸️ Skipping ${type} fetch - too recent (${now - lastFetch}ms ago)`);
      return true;
    }
    
    // Check if we have very similar viewport in recent history
    const currentViewport = { ...bounds, timestamp: now };
    const recentSimilar = this.viewportHistory.find(v => {
      const timeDiff = now - v.timestamp;
      if (timeDiff > 30000) return false; // Only check last 30 seconds
      
      const latDiff = Math.abs(v.north - bounds.north) + Math.abs(v.south - bounds.south);
      const lngDiff = Math.abs(v.east - bounds.east) + Math.abs(v.west - bounds.west);
      
      return latDiff < 0.005 && lngDiff < 0.005; // ~500m threshold
    });
    
    if (recentSimilar) {
      console.log(`⏸️ Skipping ${type} fetch - similar viewport recently fetched`);
      return true;
    }
    
    // Add to history and cleanup old entries
    this.viewportHistory.push(currentViewport);
    this.viewportHistory = this.viewportHistory.filter(v => now - v.timestamp < 60000); // Keep 1 minute history
    
    return false;
  }

  // Get cached data if valid
  getCached(key, type) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    const ttl = this.cacheTTL[type];
    
    if (age < ttl) {
      console.log(`📦 Using cached ${type} data (${Math.round(age/1000)}s old)`);
      return cached.data;
    }
    
    // Remove expired cache
    this.cache.delete(key);
    return null;
  }

  // Store data in cache
  setCached(key, data, type) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type
    });
    
    // Update last fetch time
    this.lastFetchTime[type] = Date.now();
    
    // Cleanup old cache entries (keep max 50 entries)
    if (this.cache.size > 50) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.cache.delete(oldest[0]);
    }
  }

  // Prevent duplicate requests
  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Waiting for existing ${key} request`);
      return await this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return await promise;
  }

  // Force clear all cache
  clearAll() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.viewportHistory = [];
    this.lastFetchTime = { users: 0, gyms: 0 };
    console.log('🗑️ Cache cleared');
  }

  // Clear cache for specific type
  clearType(type) {
    for (const [key, value] of this.cache.entries()) {
      if (value.type === type) {
        this.cache.delete(key);
      }
    }
    console.log(`🗑️ Cleared ${type} cache`);
  }
}

const mapCache = new SmartMapCache();

// Debounce hook for viewport changes
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
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

// Side Panel Component (simplified for brevity)
const SidePanel = ({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

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
                {data.distance && (
                  <p className="text-sm text-blue-500">{Math.round(data.distance * 10) / 10} km away</p>
                )}
              </div>
            </div>

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

  if (!isOpen) return null;

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
                Gyms & Locations
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
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Map Event Handler with smart debouncing
const MapEventHandler = ({ onViewportChange, debounceMs = 1000 }) => {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      onViewportChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      onViewportChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom
      });
    }
  });

  return null;
};

// Main GymBrosMap Component
const GymBrosMap = ({ userProfile, initialUsers = [], filters: parentFilters = {} }) => {
  // State management
  const [currentLocation, setCurrentLocation] = useState(null);
  const [users, setUsers] = useState(initialUsers);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [currentViewport, setCurrentViewport] = useState(null);
  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);
  const mapRef = useRef();
  
  // Side panel state
  const [sidePanel, setSidePanel] = useState({
    isOpen: false,
    data: null,
    type: null
  });

  const [filters, setFilters] = useState({
    showUsers: true,
    showGyms: true,
    maxDistance: parentFilters.maxDistance || 25,
    gymTypes: [],
    ...parentFilters
  });

  // Debounced viewport to prevent too many API calls
  const debouncedViewport = useDebounce(currentViewport, 800);

  // Use theme context for dark mode
  const { darkMode } = useTheme();

  // Initialize map center and current location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
        if (bestLocation && bestLocation.lat && bestLocation.lng) {
          console.log('🗺️ Setting map center to user location:', bestLocation);
          setMapCenter([bestLocation.lat, bestLocation.lng]);
          setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
        } else {
          console.log('🗺️ Using default center location');
        }
      } catch (error) {
        console.error('Error getting user location for map:', error);
      }
    };

    initializeLocation();
  }, [userProfile]);

  // Enhanced user fetching with better error handling and fallbacks
  const fetchUsers = useCallback(async (bounds) => {
    if (!bounds || !filters.showUsers) return [];

    const cacheKey = mapCache.generateCacheKey('users', bounds, filters);

    // Check cache first
    const cached = mapCache.getCached(cacheKey, 'users');
    if (cached) return cached;

    // Check if we should skip this fetch
    if (mapCache.shouldSkipFetch('users', bounds)) {
      return [];
    }

    return await mapCache.deduplicate(cacheKey, async () => {
      try {
        console.log('👥 Fetching users from API...');

        // Try new map endpoint first
        const config = gymbrosService.configWithGuestToken({
          params: {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west,
            maxDistance: filters.maxDistance
          }
        });

        let response;
        try {
          response = await api.get('/gym-bros/map/users', config);
        } catch (mapError) {
          console.log('👥 Map endpoint failed, trying fallback...');
          // Fallback to existing profiles endpoint
          const fallbackResponse = await gymbrosService.getRecommendedProfiles({
            maxDistance: filters.maxDistance,
            skip: 0,
            limit: 50
          });

          // Filter users within bounds
          const usersInBounds = fallbackResponse.filter(user => {
            const lat = user.location?.lat || user.lat;
            const lng = user.location?.lng || user.lng;
            return lat && lng &&
                   lat >= bounds.south && lat <= bounds.north &&
                   lng >= bounds.west && lng <= bounds.east;
          });

          response = { data: { users: usersInBounds } };
        }

        const fetchedUsers = response.data.users || [];

        const processedUsers = fetchedUsers.map(user => ({
          ...user,
          id: user._id || user.id,
          lat: user.location?.lat || user.lat,
          lng: user.location?.lng || user.lng,
          avatar: user.avatar || generateRandomAvatar(),
          isOnline: isUserOnline(user.lastActive),
          distance: user.distance || null
        }));

        mapCache.setCached(cacheKey, processedUsers, 'users');
        console.log(`👥 Fetched ${processedUsers.length} users`);
        return processedUsers;

      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    });
  }, [filters]);

  // Enhanced gym fetching using your existing backend
  const fetchGyms = useCallback(async (bounds) => {
    if (!bounds || !filters.showGyms) return [];
    
    const cacheKey = mapCache.generateCacheKey('gyms', bounds, filters);
    
    // Check cache first
    const cached = mapCache.getCached(cacheKey, 'gyms');
    if (cached) return cached;
    
    // Check if we should skip this fetch
    if (mapCache.shouldSkipFetch('gyms', bounds)) {
      return gyms; // Return current gyms
    }

    return await mapCache.deduplicate(cacheKey, async () => {
      try {
        console.log('📍 Fetching gyms from API...');
        
        // Use your existing gym search endpoint
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;
        
        const response = await gymBrosLocationService.searchNearbyGyms(
          { lat: centerLat, lng: centerLng },
          '',
          filters.maxDistance
        );

        const processedGyms = response.map(gym => ({
          ...gym,
          id: gym._id || gym.id,
          lat: gym.location?.lat || gym.lat,
          lng: gym.location?.lng || gym.lng,
          type: gym.type || 'gym',
          memberCount: gym.memberCount || 0,
          address: gym.location?.address || gym.address,
          city: gym.location?.city || gym.city,
          verified: gym.isVerified || false
        }));

        mapCache.setCached(cacheKey, processedGyms, 'gyms');
        console.log(`📍 Fetched ${processedGyms.length} gyms`);
        return processedGyms;
        
      } catch (error) {
        console.error('Error fetching gyms:', error);
        return gyms; // Return current gyms on error
      }
    });
  }, [filters, gyms]);

  // Main data fetching function with smart loading states
  const fetchMapData = useCallback(async (viewport) => {
    if (!viewport) return;
    
    setLoading(true);
    try {
      const promises = [];
      
      if (filters.showGyms) {
        promises.push(fetchGyms(viewport));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (filters.showUsers) {
        promises.push(fetchUsers(viewport));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [gymsData, usersData] = await Promise.all(promises);
      
      setGyms(applyFilters(gymsData, 'gym'));
      setUsers(applyFilters(usersData, 'user'));
      
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchGyms, fetchUsers]);

  // Handle debounced viewport changes
  useEffect(() => {
    if (debouncedViewport) {
      fetchMapData(debouncedViewport);
    }
  }, [debouncedViewport, fetchMapData]);

  // Handle viewport changes with debouncing
  const handleViewportChange = useCallback((viewport) => {
    setCurrentViewport(viewport);
  }, []);

  // Apply filters to data
  const applyFilters = (data, type) => {
    if (!data || !Array.isArray(data)) return [];

    return data.filter(item => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (type === 'gym') {
          return item.name?.toLowerCase().includes(query) ||
                 item.address?.toLowerCase().includes(query) ||
                 item.city?.toLowerCase().includes(query);
        } else if (type === 'user') {
          return item.name?.toLowerCase().includes(query) ||
                 item.workoutTypes?.some(wt => wt.toLowerCase().includes(query));
        }
      }

      return true;
    });
  };

  // Handle marker clicks
  const handleMarkerClick = (type, data) => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView([data.lat, data.lng], 16);
    }

    setSidePanel({
      isOpen: true,
      data,
      type
    });
  };

  // Handle refresh - clear cache and refetch
  const handleRefresh = () => {
    mapCache.clearAll();
    if (currentViewport) {
      fetchMapData(currentViewport);
    }
  };

  // Handle filter changes
  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
    mapCache.clearAll(); // Clear cache when filters change
    if (currentViewport) {
      fetchMapData(currentViewport);
    }
  };

  // Save avatar handler
  const handleAvatarSave = async (newAvatar) => {
    try {
      setAvatar(newAvatar);
      setShowAvatarDesigner(false);
      
      await gymbrosService.createOrUpdateProfile({
        ...userProfile,
        avatar: newAvatar
      });
      
      console.log('Avatar saved successfully:', newAvatar);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  // Utility functions
  const generateRandomAvatar = () => {
    const furColors = ['#8B4513', '#6B7280', '#F3F4F6', '#1F2937', '#D97706', '#FEF3C7'];
    const moods = ['happy', 'excited', 'neutral', 'cool', 'determined'];

    return {
      furColor: furColors[Math.floor(Math.random() * furColors.length)],
      mood: moods[Math.floor(Math.random() * moods.length)],
      eyes: 'normal'
    };
  };

  const isUserOnline = (lastActive) => {
    if (!lastActive) return false;
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMinutes = (now - lastActiveDate) / (1000 * 60);
    return diffMinutes < 15;
  };

  // Filter data based on search and filters
  const filteredUsers = applyFilters(users, 'user');
  const filteredGyms = applyFilters(gyms, 'gym');

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
        onSearch={setSearchQuery}
        onFilterToggle={() => setShowFilters(true)}
        loading={loading}
        onRefresh={handleRefresh}
        avatar={avatar}
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
          onViewportChange={handleViewportChange}
          debounceMs={800}
        />
        
        {MarkerClusterGroup ? (
          <MarkerClusterGroup>
            {/* Current user location mouse */}
            {currentLocation && (
              <Marker
                key="current-user-location"
                position={[currentLocation.lat, currentLocation.lng]}
                icon={createMouseIcon(avatar || {}, true)}
                eventHandlers={{
                  click: () => {
                    if (mapRef.current) {
                      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 18);
                    }
                  }
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="mb-2">
                      {renderMouseAvatar(avatar || {}, 60)}
                    </div>
                    <p className="font-semibold">You are here! 🐭</p>
                    <p className="text-sm text-gray-600">Click to customize your mouse</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* User Markers */}
            {filteredUsers.map(user => (
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
                    {user.distance && (
                      <p className="text-xs text-blue-500">{Math.round(user.distance * 10) / 10} km away</p>
                    )}
                    {user.isOnline && (
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    )}
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
            {filteredGyms.map(gym => (
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
                      {gym.verified && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 capitalize mb-1">{gym.type || 'gym'}</p>
                    {gym.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{gym.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span>{gym.memberCount || 0} members active</span>
                    </div>
                    {gym.distance && (
                      <p className="text-xs text-gray-500 mb-2">{Math.round(gym.distance * 10) / 10} km away</p>
                    )}
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
                  click: () => {
                    if (mapRef.current) {
                      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 18);
                    }
                  }
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="mb-2">
                      {renderMouseAvatar(avatar || {}, 60)}
                    </div>
                    <p className="font-semibold">You are here! 🐭</p>
                    <p className="text-sm text-gray-600">Click to customize your mouse</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* User Markers without clustering */}
            {filteredUsers.map(user => (
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
                    {user.distance && (
                      <p className="text-xs text-blue-500">{Math.round(user.distance * 10) / 10} km away</p>
                    )}
                    {user.isOnline && (
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    )}
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
            
            {/* Gym Markers without clustering */}
            {filteredGyms.map(gym => (
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
                      {gym.verified && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 capitalize mb-1">{gym.type || 'gym'}</p>
                    {gym.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{gym.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span>{gym.memberCount || 0} members active</span>
                    </div>
                    {gym.distance && (
                      <p className="text-xs text-gray-500 mb-2">{Math.round(gym.distance * 10) / 10} km away</p>
                    )}
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
          </>
        )}
      </MapContainer>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-20 right-4 z-30 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Updating map...</span>
          </div>
        </div>
      )}
      
      {/* Data Count Indicator */}
      <div className="absolute bottom-4 left-4 z-30 bg-white rounded-lg shadow-lg p-2 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          {filters.showUsers && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{filteredUsers.length}</span>
            </div>
          )}
          {filters.showGyms && (
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4 text-green-500" />
              <span>{filteredGyms.length}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Cache Status Indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 z-30 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          Cache: {mapCache.cache.size} entries
        </div>
      )}
      
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
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

if (!document.head.querySelector('style[data-gymbros-map]')) {
  style.setAttribute('data-gymbros-map', '');
  document.head.appendChild(style);
}

export default GymBrosMap;
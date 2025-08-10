import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../SocketContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw, X, Building2, Activity, Zap, Navigation, AlertCircle } from 'lucide-react';
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

// Fixed and improved cache service
class ImprovedMapCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.lastFetchTime = {
      users: 0,
      gyms: 0
    };
    
    // More reasonable cache TTL based on zoom level
    this.cacheTTL = {
      world: 30 * 60 * 1000,      // 30 minutes for world view
      continent: 15 * 60 * 1000,   // 15 minutes for continent
      country: 10 * 60 * 1000,     // 10 minutes for country
      region: 5 * 60 * 1000,       // 5 minutes for region
      city: 2 * 60 * 1000,         // 2 minutes for city
      neighborhood: 1 * 60 * 1000  // 1 minute for neighborhood
    };
    
    // Less aggressive minimum fetch intervals
    this.minFetchInterval = {
      world: 30 * 1000,           // 30 seconds minimum for world
      continent: 20 * 1000,        // 20 seconds for continent
      country: 15 * 1000,          // 15 seconds for country
      region: 10 * 1000,           // 10 seconds for region
      city: 5 * 1000,              // 5 seconds for city
      neighborhood: 3 * 1000       // 3 seconds for neighborhood
    };

    // Real-time data overlay
    this.realtimeData = {
      users: new Map(),
      gyms: new Map()
    };

    // Track force refresh requests
    this.forceRefresh = false;
  }

  getZoomLevel(zoom) {
    if (zoom <= 4) return 'world';
    if (zoom <= 7) return 'continent';
    if (zoom <= 10) return 'country';
    if (zoom <= 13) return 'region';
    if (zoom <= 16) return 'city';
    return 'neighborhood';
  }

  generateCacheKey(type, bounds, zoom, filters) {
    const level = this.getZoomLevel(zoom);
    const precision = this.getPrecisionForZoom(zoom);
    
    const north = Math.ceil(bounds.north / precision) * precision;
    const south = Math.floor(bounds.south / precision) * precision;
    const east = Math.ceil(bounds.east / precision) * precision;
    const west = Math.floor(bounds.west / precision) * precision;
    
    const filtersKey = JSON.stringify({
      maxDistance: filters.maxDistance,
      showUsers: filters.showUsers,
      showGyms: filters.showGyms,
      gymTypes: filters.gymTypes || []
    });
    
    return `${type}_${level}_z${zoom}_${north}_${south}_${east}_${west}_${filtersKey}`;
  }

  getPrecisionForZoom(zoom) {
    if (zoom <= 4) return 5.0;      // ~500km grid
    if (zoom <= 7) return 1.0;      // ~100km grid
    if (zoom <= 10) return 0.1;     // ~10km grid
    if (zoom <= 13) return 0.01;    // ~1km grid
    if (zoom <= 16) return 0.001;   // ~100m grid
    return 0.0001;                  // ~10m grid
  }

  // Fixed shouldSkipFetch with better logic
  shouldSkipFetch(type, bounds, zoom, isManualRefresh = false) {
    // Never skip on manual refresh
    if (isManualRefresh || this.forceRefresh) {
      console.log(`🔄 Manual refresh - not skipping ${type} fetch`);
      return false;
    }

    const now = Date.now();
    const level = this.getZoomLevel(zoom);
    const lastFetch = this.lastFetchTime[type];
    const minInterval = this.minFetchInterval[level];
    
    // Only skip if we fetched very recently
    if (now - lastFetch < minInterval) {
      console.log(`⏸️ Skipping ${type} fetch - too recent (${now - lastFetch}ms ago, min: ${minInterval}ms) for zoom level: ${level}`);
      return true;
    }
    
    return false;
  }

  getCached(key, zoom) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    const level = this.getZoomLevel(zoom);
    const ttl = this.cacheTTL[level];
    const age = now - cached.timestamp;
    
    if (age < ttl && !this.forceRefresh) {
      console.log(`📦 Using cached data (${Math.round(age/1000)}s old, TTL: ${Math.round(ttl/1000)}s) for level: ${level}`);
      return cached.data;
    }
    
    // Remove expired cache
    this.cache.delete(key);
    return null;
  }

  setCached(key, data, type, zoom) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type,
      zoom
    });
    
    // Update last fetch time
    this.lastFetchTime[type] = Date.now();
    
    // Reset force refresh flag
    this.forceRefresh = false;
    
    // Cleanup old cache entries (keep max 50 entries)
    if (this.cache.size > 50) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 10);
      
      oldest.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Force refresh - bypasses all cache
  forceRefreshData() {
    console.log('🔄 Force refresh initiated - clearing cache');
    this.forceRefresh = true;
    this.cache.clear();
    this.lastFetchTime = { users: 0, gyms: 0 };
  }

  // Merge real-time data with cached data
  mergeWithRealtime(cachedData, type, bounds) {
    if (!cachedData || !Array.isArray(cachedData)) return cachedData;

    const realtimeMap = this.realtimeData[type];
    if (!realtimeMap || realtimeMap.size === 0) return cachedData;

    // Create a map of cached items by ID
    const cachedMap = new Map();
    cachedData.forEach(item => {
      cachedMap.set(item._id || item.id, item);
    });

    // Add or update with real-time data
    for (const [id, realtimeItem] of realtimeMap.entries()) {
      // Check if real-time item is within bounds
      if (this.isWithinBounds(realtimeItem, bounds)) {
        cachedMap.set(id, {
          ...cachedMap.get(id),
          ...realtimeItem,
          isRealtime: true
        });
      }
    }

    return Array.from(cachedMap.values());
  }

  isWithinBounds(item, bounds) {
    if (!item.location && !item.lat && !item.lng) return false;
    
    const lat = item.location?.lat || item.lat;
    const lng = item.location?.lng || item.lng;
    
    return lat >= bounds.south && 
           lat <= bounds.north && 
           lng >= bounds.west && 
           lng <= bounds.east;
  }

  updateRealtimeData(type, id, data) {
    this.realtimeData[type].set(id, {
      ...data,
      timestamp: Date.now()
    });

    // Clean up old real-time data (older than 10 minutes)
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [itemId, item] of this.realtimeData[type].entries()) {
      if (item.timestamp < cutoff) {
        this.realtimeData[type].delete(itemId);
      }
    }
  }

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

  clearAll() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.lastFetchTime = { users: 0, gyms: 0 };
    this.realtimeData = { users: new Map(), gyms: new Map() };
    console.log('🗑️ Cache cleared');
  }
}

const mapCache = new ImprovedMapCache();

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

// Enhanced search/filter bar with manual refresh
const MapControls = ({ 
  onSearch, 
  onFilterToggle, 
  loading, 
  onRefresh, 
  onManualRefresh,
  avatar, 
  onAvatarClick, 
  realtimeStats,
  currentLocation,
  onCenterToUser
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 items-center">
      {/* Avatar Circle Button with activity indicator */}
      <div className="relative">
        <button
          className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-blue-400 bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform mr-2 overflow-hidden"
          onClick={onAvatarClick}
          title="Edit your Gym Mouse avatar"
          style={{ padding: '2px' }}
        >
          {renderMouseAvatar(avatar || {}, 44)}
        </button>
        
        {/* Online indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
          <Activity className="w-2 h-2 text-white" />
        </div>
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
      
      {/* Center to user location button */}
      {currentLocation && (
        <button
          onClick={onCenterToUser}
          className="bg-white p-2 rounded-lg border border-gray-300 shadow-lg hover:bg-gray-50 transition-colors"
          title="Center on my location"
        >
          <Navigation className="h-5 w-5 text-gray-600" />
        </button>
      )}
      
      <button
        onClick={onFilterToggle}
        className="bg-white p-2 rounded-lg border border-gray-300 shadow-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="h-5 w-5 text-gray-600" />
      </button>
      
      {/* Regular refresh button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="bg-white p-2 rounded-lg border border-gray-300 shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Refresh data"
      >
        <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Manual/Force refresh button */}
      <button
        onClick={onManualRefresh}
        className="bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        title="Force refresh (bypass cache)"
      >
        <Zap className="h-5 w-5" />
      </button>

      {/* Real-time stats indicator */}
      {realtimeStats && (
        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Live: {realtimeStats.users}👥 {realtimeStats.gyms}🏋️
        </div>
      )}
    </div>
  );
};

// Map Update Component
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

// Custom Map Event Handler
const MapEventHandler = ({ onViewportChange, debounceMs = 500 }) => {
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

// Enhanced side panel
const SidePanel = ({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

  const renderContent = () => {
    switch(type) {
      case 'gym':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg relative">
                <Building2 className="h-6 w-6 text-blue-600" />
                {data.isRealtime && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 capitalize">{data.type || 'gym'}</p>
                  {data.isVerified && (
                    <span className="text-green-500 text-xs">✓ Verified</span>
                  )}
                  {data.isNew && (
                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>

            {data.address && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">📍 Location</h3>
                <p className="text-gray-600">{data.address}</p>
                {data.city && <p className="text-gray-500 text-sm">{data.city}</p>}
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
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-blue-200 overflow-hidden bg-gray-50 relative">
                  {data.avatar ? renderMouseAvatar(data.avatar, 60) : (
                    <img 
                      src={data.profileImage || '/default-avatar.png'} 
                      alt={data.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {data.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                )}
                {data.isRealtime && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 border-2 border-white rounded-full flex items-center justify-center">
                    <Zap className="w-2 h-2 text-white" />
                  </div>
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

// Filter modal component
const MapFilters = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const gymTypes = [
    { id: 'gym', label: 'Traditional Gyms', icon: '🏋️' },
    { id: 'community', label: 'Community Centers', icon: '🏘️' },
    { id: 'event', label: 'Events & Meetups', icon: '📅' },
    { id: 'sport_center', label: 'Sports Centers', icon: '⚽' },
    { id: 'other', label: 'Other Locations', icon: '📍' }
  ];

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

          {localFilters.showGyms && (
            <div>
              <label className="block text-sm font-medium mb-2">Location Types</label>
              <div className="space-y-2">
                {gymTypes.map(type => (
                  <label key={type.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.gymTypes?.includes(type.id) ?? true}
                      onChange={(e) => {
                        const currentTypes = localFilters.gymTypes || [];
                        const newTypes = e.target.checked 
                          ? [...currentTypes, type.id]
                          : currentTypes.filter(t => t !== type.id);
                        setLocalFilters({...localFilters, gymTypes: newTypes});
                      }}
                      className="mr-2"
                    />
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          
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

          <div>
            <label className="block text-sm font-medium mb-2">Real-time Updates</label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.enableRealtime !== false}
                onChange={(e) => setLocalFilters({...localFilters, enableRealtime: e.target.checked})}
                className="mr-2"
              />
              <Zap className="h-4 w-4 mr-1 text-blue-500" />
              Live location updates
            </label>
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

// Main Enhanced GymBros Map Component
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
  const [dataFetchError, setDataFetchError] = useState(null);
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
    gymTypes: ['gym', 'community', 'event', 'sport_center', 'other'],
    enableRealtime: true,
    ...parentFilters
  });

  // Socket integration for real-time updates
  const { 
    connected, 
    subscribeToMapUpdates, 
    unsubscribeFromMapUpdates, 
    updateUserLocation,
    getRealtimeUsers,
    getRealtimeGyms,
    mapUpdates
  } = useSocket();

  // Debounced viewport to prevent too many API calls
  const debouncedViewport = useDebounce(currentViewport, 500);

  // Use theme context for dark mode
  const { darkMode } = useTheme();

  // Real-time stats
  const realtimeStats = useMemo(() => {
    if (!currentViewport) return null;
    
    const realtimeUsers = getRealtimeUsers(currentViewport);
    const realtimeGyms = getRealtimeGyms(currentViewport);
    
    return {
      users: realtimeUsers.length,
      gyms: realtimeGyms.length
    };
  }, [mapUpdates.lastUpdate, currentViewport, getRealtimeUsers, getRealtimeGyms]);

  // Initialize map center and current location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Try to get user's best known location first
        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
        if (bestLocation && bestLocation.lat && bestLocation.lng) {
          console.log('🗺️ Setting map center to user location:', bestLocation);
          const center = [bestLocation.lat, bestLocation.lng];
          setMapCenter(center);
          setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
          return;
        }

        // Fallback to getting current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log('🗺️ Got current location:', latitude, longitude);
              const center = [latitude, longitude];
              setMapCenter(center);
              setCurrentLocation({ lat: latitude, lng: longitude });
              
              // Send initial location update via socket
              if (connected && filters.enableRealtime) {
                updateUserLocation({ lat: latitude, lng: longitude }, 'high');
              }
            },
            (error) => {
              console.warn('📍 Could not get current location:', error);
              // Use default location
              setCurrentLocation({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          console.log('🗺️ Using default center location');
          setCurrentLocation({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
        }
      } catch (error) {
        console.error('Error getting user location for map:', error);
        setCurrentLocation({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
      }
    };

    initializeLocation();
  }, [userProfile, connected, updateUserLocation, filters.enableRealtime]);

  // Subscribe to real-time updates when viewport changes
  useEffect(() => {
    if (connected && currentViewport && filters.enableRealtime) {
      console.log('🔄 Subscribing to real-time updates for viewport:', currentViewport);
      subscribeToMapUpdates(currentViewport, currentViewport.zoom);
      
      return () => {
        unsubscribeFromMapUpdates();
      };
    }
  }, [connected, currentViewport, filters.enableRealtime, subscribeToMapUpdates, unsubscribeFromMapUpdates]);

  // Enhanced user fetching with better error handling
  const fetchUsers = useCallback(async (bounds, zoom, isManualRefresh = false) => {
    if (!bounds || !filters.showUsers) return [];

    const cacheKey = mapCache.generateCacheKey('users', bounds, zoom, filters);

    // Check cache first (unless manual refresh)
    if (!isManualRefresh) {
      const cached = mapCache.getCached(cacheKey, zoom);
      if (cached) {
        return mapCache.mergeWithRealtime(cached, 'users', bounds);
      }
    }

    // Check if we should skip this fetch
    if (mapCache.shouldSkipFetch('users', bounds, zoom, isManualRefresh)) {
      return mapCache.mergeWithRealtime(users, 'users', bounds);
    }

    return await mapCache.deduplicate(cacheKey, async () => {
      try {
        console.log('👥 Fetching users from API with zoom:', zoom, isManualRefresh ? '(manual refresh)' : '');

        const config = gymbrosService.configWithGuestToken({
          params: {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west,
            zoom: zoom,
            maxDistance: filters.maxDistance
          }
        });

        const response = await api.get('/gym-bros/map/users', config);
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

        mapCache.setCached(cacheKey, processedUsers, 'users', zoom);
        console.log(`👥 Fetched ${processedUsers.length} users`);
        
        setDataFetchError(null); // Clear any previous errors
        return mapCache.mergeWithRealtime(processedUsers, 'users', bounds);

      } catch (error) {
        console.error('Error fetching users:', error);
        setDataFetchError(`Failed to fetch users: ${error.message}`);
        return mapCache.mergeWithRealtime(users, 'users', bounds);
      }
    });
  }, [filters, users]);

  // Enhanced gym fetching with better error handling
  const fetchGyms = useCallback(async (bounds, zoom, isManualRefresh = false) => {
    if (!bounds || !filters.showGyms) return [];
    
    const cacheKey = mapCache.generateCacheKey('gyms', bounds, zoom, filters);
    
    // Check cache first (unless manual refresh)
    if (!isManualRefresh) {
      const cached = mapCache.getCached(cacheKey, zoom);
      if (cached) {
        return mapCache.mergeWithRealtime(cached, 'gyms', bounds);
      }
    }
    
    // Check if we should skip this fetch
    if (mapCache.shouldSkipFetch('gyms', bounds, zoom, isManualRefresh)) {
      return mapCache.mergeWithRealtime(gyms, 'gyms', bounds);
    }

    return await mapCache.deduplicate(cacheKey, async () => {
      try {
        console.log('📍 Fetching gyms from API with zoom:', zoom, isManualRefresh ? '(manual refresh)' : '');
        
        const config = gymbrosService.configWithGuestToken({
          params: {
            bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
            zoom: zoom,
            types: filters.gymTypes?.join(','),
            limit: zoom <= 10 ? 500 : 1000
          }
        });

        const response = await api.get('/gym-bros/gyms', config);
        const fetchedGyms = response.data.gyms || [];

        const processedGyms = fetchedGyms.map(gym => ({
          ...gym,
          id: gym._id || gym.id,
          lat: gym.location?.lat || gym.lat || gym.location?.coordinates?.[1],
          lng: gym.location?.lng || gym.lng || gym.location?.coordinates?.[0],
          type: gym.type || 'gym',
          memberCount: gym.memberCount || 0,
          address: gym.location?.address || gym.address,
          city: gym.location?.city || gym.city,
          verified: gym.isVerified || false
        }));

        mapCache.setCached(cacheKey, processedGyms, 'gyms', zoom);
        console.log(`📍 Fetched ${processedGyms.length} gyms`);
        
        setDataFetchError(null); // Clear any previous errors
        return mapCache.mergeWithRealtime(processedGyms, 'gyms', bounds);
        
      } catch (error) {
        console.error('Error fetching gyms:', error);
        setDataFetchError(`Failed to fetch gyms: ${error.message}`);
        return mapCache.mergeWithRealtime(gyms, 'gyms', bounds);
      }
    });
  }, [filters, gyms]);

  // Main data fetching function
  const fetchMapData = useCallback(async (viewport, isManualRefresh = false) => {
    if (!viewport) return;
    
    setLoading(true);
    setDataFetchError(null);
    
    try {
      const promises = [];
      
      if (filters.showGyms) {
        promises.push(fetchGyms(viewport, viewport.zoom, isManualRefresh));
      } else {
        promises.push(Promise.resolve([]));
      }
      
      if (filters.showUsers) {
        promises.push(fetchUsers(viewport, viewport.zoom, isManualRefresh));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [gymsData, usersData] = await Promise.all(promises);
      
      setGyms(applyFilters(gymsData, 'gym'));
      setUsers(applyFilters(usersData, 'user'));
      
    } catch (error) {
      console.error('Error fetching map data:', error);
      setDataFetchError(`Failed to fetch map data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchGyms, fetchUsers]);

  // Handle debounced viewport changes
  useEffect(() => {
    if (debouncedViewport) {
      fetchMapData(debouncedViewport, false);
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

      // Gym type filter
      if (type === 'gym' && filters.gymTypes && filters.gymTypes.length > 0) {
        return filters.gymTypes.includes(item.type);
      }

      return true;
    });
  };

  // Handle marker clicks
  const handleMarkerClick = (type, data) => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView([data.lat, data.lng], Math.max(16, currentViewport?.zoom || 13));
    }

    setSidePanel({
      isOpen: true,
      data,
      type
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    if (currentViewport) {
      fetchMapData(currentViewport, false);
    }
  };

  // Handle manual/force refresh
  const handleManualRefresh = () => {
    mapCache.forceRefreshData();
    if (currentViewport) {
      fetchMapData(currentViewport, true);
    }
  };

  // Center map to user location
  const handleCenterToUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 16);
    }
  };

  // Handle filter changes
  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
    mapCache.clearAll();
    if (currentViewport) {
      fetchMapData(currentViewport, true);
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

  if (loading && users.length === 0 && gyms.length === 0 && !dataFetchError) {
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
        onManualRefresh={handleManualRefresh}
        avatar={avatar}
        onAvatarClick={() => setShowAvatarDesigner(true)}
        realtimeStats={realtimeStats}
        currentLocation={currentLocation}
        onCenterToUser={handleCenterToUser}
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
          debounceMs={500}
        />
        
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
                {connected && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* User Markers */}
        {filteredUsers.map(user => (
          <Marker 
            key={`user-${user.id}`} 
            position={[user.lat, user.lng]} 
            icon={createMouseIcon(user.avatar || {}, false, user.isRealtime)}
            eventHandlers={{
              click: () => handleMarkerClick('user', user)
            }}
          >
            <Popup>
              <div className="min-w-48 text-center">
                <div className="mb-2 relative">
                  {renderMouseAvatar(user.avatar || {}, 60)}
                  {user.isRealtime && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 border-2 border-white rounded-full flex items-center justify-center">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.age} • {user.experienceLevel}</p>
                {user.distance && (
                  <p className="text-xs text-blue-500">{Math.round(user.distance * 10) / 10} km away</p>
                )}
                <div className="flex items-center justify-center gap-1 mt-1">
                  {user.isOnline && (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-xs text-green-600">Online</span>
                    </>
                  )}
                  {user.isRealtime && (
                    <>
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600">Live</span>
                    </>
                  )}
                </div>
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
            icon={createGymIcon(gym, gym.isRealtime)}
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
                  {gym.isNew && (
                    <span className="bg-green-100 text-green-600 px-1 py-0.5 rounded text-xs">New</span>
                  )}
                  {gym.isRealtime && (
                    <Zap className="w-3 h-3 text-blue-500" />
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
      </MapContainer>
      
      {/* Loading Indicator (only show when actually loading) */}
      {loading && (
        <div className="absolute top-20 right-4 z-30 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Updating map...</span>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {dataFetchError && (
        <div className="absolute top-20 right-4 z-30 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg p-3 max-w-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Data fetch error</p>
              <p className="text-xs">{dataFetchError}</p>
              <button 
                onClick={handleManualRefresh}
                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Connection status indicator */}
      {filters.enableRealtime && (
        <div className="absolute top-20 left-4 z-30 bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={connected ? 'text-green-600' : 'text-red-600'}>
              {connected ? 'Live' : 'Offline'}
            </span>
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
          {currentViewport && (
            <div className="text-xs text-gray-400">
              Z{currentViewport.zoom}
            </div>
          )}
        </div>
      </div>
      
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

export default GymBrosMap;
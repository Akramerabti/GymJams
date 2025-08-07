import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Filter, Calendar, MapPin, Dumbbell, Users, RefreshCw } from 'lucide-react';
import gymbrosService from '../../services/gymbros.service'
import gymBrosLocationService from '../../services/gymBrosLocation.service';

// Import clustering if available
let MarkerClusterGroup;
try {
  MarkerClusterGroup = require('react-leaflet-cluster').default;
} catch (e) {
  MarkerClusterGroup = null;
}


// Custom icon configurations
const createCustomIcon = (iconUrl, size = [32, 32]) => new L.Icon({
  iconUrl,
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1]],
  popupAnchor: [0, -size[1]],
});

const icons = {
  user: createCustomIcon('https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png', [25, 41]),
  gym: createCustomIcon('https://cdn-icons-png.flaticon.com/512/69/69524.png'),
  event: createCustomIcon('https://cdn-icons-png.flaticon.com/512/684/684908.png'),
  currentUser: createCustomIcon('https://cdn-icons-png.flaticon.com/512/684/684908.png', [35, 45])
};

// Default center (can be overridden by user location)
const DEFAULT_CENTER = [45.5017, -73.5673]; // Montreal

// Search/Filter Bar Component
const MapControls = ({ onSearch, onFilterToggle, loading, onRefresh }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
          placeholder="Search users, gyms, or events..."
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

// Map Update Component (handles center changes)
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

// User Profile Popup Component
const UserProfilePopup = ({ user }) => (
  <div className="min-w-48">
    <div className="flex items-center gap-3 mb-2">
      <img 
        src={user.profileImage || '/default-avatar.png'} 
        alt={user.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <h3 className="font-semibold text-gray-900">{user.name}</h3>
        <p className="text-sm text-gray-500">{user.age} • {user.experienceLevel}</p>
      </div>
    </div>
    {user.bio && (
      <p className="text-sm text-gray-700 mb-2">{user.bio}</p>
    )}
    <div className="flex flex-wrap gap-1 mb-2">
      {user.workoutTypes?.slice(0, 3).map((type, idx) => (
        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
          {type}
        </span>
      ))}
    </div>
    <button className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition-colors">
      View Profile
    </button>
  </div>
);

// Gym Popup Component
const GymPopup = ({ gym }) => (
  <div className="min-w-48">
    <div className="flex items-center gap-2 mb-2">
      <Dumbbell className="h-5 w-5 text-blue-500" />
      <h3 className="font-semibold text-gray-900">{gym.name}</h3>
    </div>
    {gym.address && (
      <p className="text-sm text-gray-600 mb-2">{gym.address}</p>
    )}
    {gym.description && (
      <p className="text-sm text-gray-700 mb-2">{gym.description}</p>
    )}
    <div className="flex gap-2">
      <button className="flex-1 bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600 transition-colors">
        Check In
      </button>
      <button className="flex-1 bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600 transition-colors">
        Directions
      </button>
    </div>
  </div>
);

// Event Popup Component
const EventPopup = ({ event }) => (
  <div className="min-w-48">
    <div className="flex items-center gap-2 mb-2">
      <Calendar className="h-5 w-5 text-purple-500" />
      <h3 className="font-semibold text-gray-900">{event.name}</h3>
    </div>
    {event.description && (
      <p className="text-sm text-gray-700 mb-2">{event.description}</p>
    )}
    {event.date && (
      <p className="text-sm text-gray-600 mb-2">📅 {new Date(event.date).toLocaleDateString()}</p>
    )}
    {event.participants && (
      <p className="text-sm text-gray-600 mb-2">👥 {event.participants} interested</p>
    )}
    <button className="w-full bg-purple-500 text-white py-1 px-3 rounded text-sm hover:bg-purple-600 transition-colors">
      Join Event
    </button>
  </div>
);

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

// Main GymBrosMap Component
const GymBrosMap = ({ userProfile }) => {
  // Track current user location for map dot
  const [currentLocation, setCurrentLocation] = useState(null);

  // On mount, set currentLocation from best available (same as map center logic)
  useEffect(() => {
    const setBestLocation = async () => {
      try {
        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
        if (bestLocation && bestLocation.lat && bestLocation.lng) {
          setCurrentLocation({ lat: bestLocation.lat, lng: bestLocation.lng });
        }
      } catch (e) {
        setCurrentLocation(null);
      }
    };
    setBestLocation();
  }, [userProfile]);
  // Top-level debug: always runs on mount
  console.log('[DEBUG] GymBrosMap component mounted, userProfile:', userProfile);
  const [users, setUsers] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef();
  
  const [filters, setFilters] = useState({
    showUsers: true,
    showGyms: true,
    showEvents: true,
    maxDistance: 25
  });


  // Use theme context for dark mode
  const { darkMode } = useTheme();

  useEffect(() => {
    const leafletCss = document.querySelector('link[href*="leaflet.css"]');
    console.log('[DEBUG] Leaflet CSS loaded:', !!leafletCss);
    const mapContainer = document.querySelector('.leaflet-container');
    console.log('[DEBUG] Map container found:', !!mapContainer);
    if (mapContainer) {
      console.log('[DEBUG] Container dimensions:', {
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight
      });
    }
  }, []);

  // Initialize map center from user location
  useEffect(() => {
    const initializeMapCenter = async () => {
      try {
        // Get best available location
        const bestLocation = await gymBrosLocationService.getBestLocation(userProfile?.user, userProfile?.phone);
        
        if (bestLocation && bestLocation.lat && bestLocation.lng) {
          console.log('🗺️ Setting map center to user location:', bestLocation);
          setMapCenter([bestLocation.lat, bestLocation.lng]);
        } else {
          console.log('🗺️ Using default center location');
        }
      } catch (error) {
        console.error('Error getting user location for map:', error);
      }
    };

    initializeMapCenter();
  }, [userProfile]);

  // Fetch map data
  const fetchMapData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchGyms(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would be a new API endpoint to get users who have opted in to location sharing
      const response = await fetch('/api/gym-bros/map/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        // Mock data for development
        setUsers([
          {
            id: '1',
            name: 'Alex Smith',
            age: 25,
            lat: 45.5089,
            lng: -73.5617,
            profileImage: null,
            experienceLevel: 'Intermediate',
            workoutTypes: ['Strength Training', 'Cardio'],
            bio: 'Looking for workout partners!'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            age: 28,
            lat: 45.5076,
            lng: -73.5540,
            profileImage: null,
            experienceLevel: 'Advanced',
            workoutTypes: ['CrossFit', 'HIIT'],
            bio: 'CrossFit enthusiast, always up for a challenge'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchGyms = async () => {
    try {
      const response = await fetch('/api/gyms');
      if (response.ok) {
        const data = await response.json();
        setGyms(Array.isArray(data) ? data : []);
      } else {
        // Mock data for development
        setGyms([
          {
            id: '1',
            name: 'Energie Cardio',
            lat: 45.5086,
            lng: -73.5540,
            address: '1234 Rue Sainte-Catherine, Montreal, QC',
            description: '24/7 fitness center with modern equipment'
          },
          {
            id: '2',
            name: 'GoodLife Fitness',
            lat: 45.5021,
            lng: -73.5709,
            address: '5678 Boulevard Saint-Laurent, Montreal, QC',
            description: 'Full-service gym with classes and personal training'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setGyms([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/gym-bros/map/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        // Mock data for development
        setEvents([
          {
            id: '1',
            name: 'Morning Yoga Group',
            lat: 45.5044,
            lng: -73.5698,
            description: 'Join us for relaxing morning yoga in the park',
            date: new Date(Date.now() + 86400000), // Tomorrow
            participants: 12
          },
          {
            id: '2',
            name: 'Weekend Running Club',
            lat: 45.5099,
            lng: -73.5533,
            description: 'Weekly 5K run through Old Montreal',
            date: new Date(Date.now() + 259200000), // 3 days from now
            participants: 8
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
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

  const handleRefresh = () => {
    fetchMapData();
  };

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading && users.length === 0 && gyms.length === 0 && events.length === 0) {
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
        {MarkerClusterGroup ? (
          <MarkerClusterGroup>
            {/* Current user location dot */}
            {currentLocation && (
              <Marker
                key="current-user-location"
                position={[currentLocation.lat, currentLocation.lng]}
                icon={icons.currentUser}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}
            {/* User Markers */}
            {filteredUsers.map(user => (
              <Marker key={`user-${user.id}`} position={[user.lat, user.lng]} icon={icons.user}>
                <Popup>
                  <UserProfilePopup user={user} />
                </Popup>
              </Marker>
            ))}
            {/* Gym Markers */}
            {filteredGyms.map(gym => (
              <Marker key={`gym-${gym.id}`} position={[gym.lat, gym.lng]} icon={icons.gym}>
                <Popup>
                  <GymPopup gym={gym} />
                </Popup>
              </Marker>
            ))}
            {/* Event Markers */}
            {filteredEvents.map(event => (
              <Marker key={`event-${event.id}`} position={[event.lat, event.lng]} icon={icons.event}>
                <Popup>
                  <EventPopup event={event} />
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <>
            {/* Current user location dot */}
            {currentLocation && (
              <Marker
                key="current-user-location"
                position={[currentLocation.lat, currentLocation.lng]}
                icon={icons.currentUser}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}
            {/* Fallback without clustering */}
            {filteredUsers.map(user => (
              <Marker key={`user-${user.id}`} position={[user.lat, user.lng]} icon={icons.user}>
                <Popup>
                  <UserProfilePopup user={user} />
                </Popup>
              </Marker>
            ))}
            {filteredGyms.map(gym => (
              <Marker key={`gym-${gym.id}`} position={[gym.lat, gym.lng]} icon={icons.gym}>
                <Popup>
                  <GymPopup gym={gym} />
                </Popup>
              </Marker>
            ))}
            {filteredEvents.map(event => (
              <Marker key={`event-${event.id}`} position={[event.lat, event.lng]} icon={icons.event}>
                <Popup>
                  <EventPopup event={event} />
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
      <MapFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFiltersApply}
      />
    </div>
  );
};

// Custom styles to hide Leaflet zoom controls and tweak map look, including blue-grey filter for dark mode
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
    /* Blue-grey filter for dark mode */
    filter: grayscale(0.15) brightness(0.95) sepia(0.15) hue-rotate(185deg) saturate(1.2) contrast(1.08);
    background: #1e293b;
  }
`;
if (!document.head.querySelector('style[data-gymbros-map]')) {
  style.setAttribute('data-gymbros-map', '');
  document.head.appendChild(style);
}

export default GymBrosMap;
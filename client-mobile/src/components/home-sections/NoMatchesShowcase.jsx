import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MapPin, Users, Sparkles, ChevronRight, 
  Star, X, RefreshCw, Zap, Target, TrendingUp, User, Loader
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import { usePermissions } from '../../contexts/PermissionContext';
import gymbrosService from '../../services/gymbros.service';
import gymBrosLocationService from '../../services/gymBrosLocation.service';

// Enhanced NoMatchesShowcase with real data
const NoMatchesShowcase = ({ userProfile, onStartSwiping }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [nearbyGyms, setNearbyGyms] = useState([]);
  const [mapCenter, setMapCenter] = useState([45.5017, -73.5673]); // Default center
  const mapRef = useRef();

  const {
    hasLocationPermission,
    currentLocation,
    permissions
  } = usePermissions();

  // Fetch real data using gymbrosService directly
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setIsLoading(true);
        
        let location = currentLocation;
        
        // If no current location, try to get from localStorage or use default
        if (!location) {
          try {
            const storedLocation = JSON.parse(
              localStorage.getItem('gymBrosLocation') || 
              localStorage.getItem('userLocation') || 
              '{}'
            );
            if (storedLocation.lat && storedLocation.lng) {
              location = storedLocation;
            } else {
              // Use profile location if available
              if (userProfile?.location?.coordinates) {
                const [lng, lat] = userProfile.location.coordinates;
                location = { lat, lng };
              } else {
                // Use default location (Montreal, Canada) as fallback
                location = { lat: 45.5017, lng: -73.5673 };
              }
            }
          } catch (e) {
            console.warn('Failed to parse stored location:', e);
            // Use default location as final fallback
            location = { lat: 45.5017, lng: -73.5673 };
          }
        }

        if (location) {
          setMapCenter([location.lat, location.lng]);
          
          // Fetch nearby users and gyms using gymbrosService directly
          const locationFilters = {
            maxDistance: 15, // 15km radius
            lat: location.lat,
            lng: location.lng,
            includeRecommendations: true,
            includeMatches: true,
            includeGymMembers: true
          };
          
          try {
            // Use gymbrosService directly for fetching data
            const [users, gyms] = await Promise.all([
              gymbrosService.getMapUsers(locationFilters).catch(err => {
                console.warn('Failed to fetch users:', err);
                return [];
              }),
              gymBrosLocationService.getGymsForMap().catch(err => {
                console.warn('Failed to fetch gyms:', err);
                return [];
              })
            ]);
            
            // Filter to get a representative sample
            setNearbyUsers(Array.isArray(users) ? users.slice(0, 8) : []); // Show up to 8 users
            setNearbyGyms(Array.isArray(gyms) ? gyms.slice(0, 12) : []); // Show up to 12 gyms
          } catch (error) {
            console.error('Error fetching map data:', error);
            // Continue with empty arrays rather than crashing
            setNearbyUsers([]);
            setNearbyGyms([]);
          }
        }
        
      } catch (error) {
        console.error('Error fetching real data for showcase:', error);
        // Set fallback data
        setNearbyUsers([]);
        setNearbyGyms([]);
        setMapCenter([45.5017, -73.5673]); // Montreal as fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, [currentLocation, userProfile]);

  // Mobile-optimized Map component for static display
  const StaticMapView = () => {
    const MapUpdater = () => {
      const map = useMap();
      
      useEffect(() => {
        if (mapCenter && map) {
          map.setView(mapCenter, 12); // Slightly zoomed out for mobile
        }
      }, [mapCenter, map]);

      return null;
    };

    const renderMarkers = () => {
      const markers = [];

      // User's location marker (primary) - larger for mobile
      if (mapCenter) {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div class="relative">
              <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75 w-10 h-10"></div>
              <div class="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        markers.push(
          <Marker key="user-location" position={mapCenter} icon={userIcon} />
        );

        // Add user's visibility circle - smaller for mobile view
        markers.push(
          <Circle
            key="user-visibility"
            center={mapCenter}
            radius={1500} // 1.5km radius for mobile
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              weight: 2,
              opacity: 0.5,
              dashArray: '8, 12',
            }}
          />
        );
      }

      // Nearby users markers - optimized for mobile
      nearbyUsers.forEach((user, index) => {
        if (user.lat && user.lng) {
          const isMatch = user.source === 'match' || user.isMatch;
          const isGymMember = user.source === 'gym_member' || user.sharedGym;
          const isRecommendation = user.source === 'recommendation' || user.isRecommendation;

          const userMarkerIcon = L.divIcon({
            className: 'custom-nearby-marker',
            html: `
              <div class="w-8 h-8 bg-gradient-to-br ${
                isMatch ? 'from-pink-400 to-pink-600' :
                isGymMember ? 'from-orange-400 to-orange-600' :
                'from-purple-400 to-purple-600'
              } rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span class="text-white text-sm font-bold">
                  ${isMatch ? '❤️' : isGymMember ? '🏋️' : '⭐'}
                </span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          markers.push(
            <Marker
              key={`user-${user.id || user._id}-${index}`}
              position={[user.lat, user.lng]}
              icon={userMarkerIcon}
            />
          );
        }
      });

      // Nearby gyms markers - larger for mobile
      nearbyGyms.forEach((gym, index) => {
        let lat, lng;
        if (gym.location?.coordinates && Array.isArray(gym.location.coordinates)) {
          [lng, lat] = gym.location.coordinates;
        } else {
          lat = gym.lat || gym.location?.lat;
          lng = gym.lng || gym.location?.lng;
        }

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const gymIcon = L.divIcon({
            className: 'custom-gym-marker',
            html: `
              <div class="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span class="text-white text-sm">🏢</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          markers.push(
            <Marker
              key={`gym-${gym._id || gym.id}-${index}`}
              position={[lat, lng]}
              icon={gymIcon}
            />
          );
        }
      });

      return markers;
    };

    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ 
            height: '100%', 
            width: '100%',
            minHeight: '250px' // Ensure minimum height for mobile
          }}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater />
          {renderMarkers()}
        </MapContainer>

        {/* Mobile-optimized map overlay with live stats */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 text-xs">Nearby Activity</h3>
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-pink-600">{nearbyUsers.filter(u => u.source === 'match' || u.isMatch).length}</div>
              <div className="text-xs text-gray-600">Matches</div>
            </div>
            <div>
              <div className="text-sm font-bold text-orange-600">{nearbyUsers.filter(u => u.source === 'gym_member' || u.sharedGym).length}</div>
              <div className="text-xs text-gray-600">Gym Buddies</div>
            </div>
            <div>
              <div className="text-sm font-bold text-green-600">{nearbyGyms.length}</div>
              <div className="text-xs text-gray-600">Gyms</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Your Area</h3>
          <p className="text-gray-600 text-sm">Finding potential matches and nearby gyms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="h-full max-w-6xl mx-auto flex flex-col">


        {/* Main showcase area - Mobile-first horizontal layout (1/4 profile, 3/4 map) */}
        <div className="flex-1 relative mb-3">
          <div className="h-full flex gap-2 min-h-[300px]">
            {/* Left side - User Profile Display - 1/4 width */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-1/4 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center"
            >
              {/* Profile Image - Responsive to container */}
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-white shadow-lg">
                  {userProfile?.images && userProfile.images.length > 0 ? (
                    <img
                      src={formatImageUrl(userProfile.images[0], getFallbackAvatarUrl())}
                      alt={userProfile.name || 'Your Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getFallbackAvatarUrl();
                      }}
                    />
                  ) : userProfile?.profileImage ? (
                    <img
                      src={formatImageUrl(userProfile.profileImage, getFallbackAvatarUrl())}
                      alt={userProfile.name || 'Your Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getFallbackAvatarUrl();
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Profile Info - Compact for narrow width */}
              <div className="text-center mb-2 w-full">
                <h3 className="text-sm font-bold text-gray-800 mb-1 leading-tight">
                  {userProfile?.name || 'Your Name'}
                  {userProfile?.age && <span className="block text-xs text-gray-500">{userProfile.age}</span>}
                </h3>
                
                {userProfile?.location && (
                  <div className="flex items-center justify-center text-gray-600 mb-1">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="text-xs leading-tight text-center">
                      {(() => {
                        // Handle different location formats - shortened for narrow width
                        if (typeof userProfile.location === 'string') {
                          return userProfile.location.split(',')[0]; // Just city
                        } else if (userProfile.location?.city) {
                          return userProfile.location.city;
                        } else if (userProfile.location?.address) {
                          const parts = userProfile.location.address.split(',');
                          return parts[0].trim(); // Just first part
                        } else {
                          try {
                            const storedLocation = JSON.parse(localStorage.getItem('gymBrosLocation') || '{}');
                            if (storedLocation.city) {
                              return storedLocation.city;
                            }
                          } catch (e) {
                            console.warn('Failed to parse stored location:', e);
                          }
                          return 'Your Location';
                        }
                      })()}
                    </span>
                  </div>
                )}

                {/* Tags - Stacked vertically for narrow width */}
                <div className="space-y-1 mb-2">
                  {userProfile?.experienceLevel && (
                    <span className="block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full text-center">
                      {userProfile.experienceLevel}
                    </span>
                  )}
                  {userProfile?.workoutTypes && userProfile.workoutTypes.length > 0 && (
                    <span className="block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full text-center">
                      {userProfile.workoutTypes[0].length > 8 ? 
                        userProfile.workoutTypes[0].substring(0, 8) + '...' : 
                        userProfile.workoutTypes[0]
                      }
                      {userProfile.workoutTypes.length > 1 && <span className="block text-xs">+{userProfile.workoutTypes.length - 1}</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Action button - Compact for mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartSwiping}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-2 rounded-lg shadow-lg text-xs"
              >
                Start →
              </motion.button>
            </motion.div>

            {/* Right side - Real Map View - 3/4 width */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-3/4"
            >
              <StaticMapView />
            </motion.div>
          </div>
        </div>

        <div className="text-center mb-3 mt-3">
          
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            Your Perfect Gym Partner is Out There!
          </h2>
          <p className="text-gray-600 text-sm max-w-xl mx-auto px-2">
            Here's your fitness community - see who's active at nearby gyms and in your area.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoMatchesShowcase;
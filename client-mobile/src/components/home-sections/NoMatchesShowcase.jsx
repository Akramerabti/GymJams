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
import { ImageService } from '../gymBros/components/ImageUtils';
import AvatarDisplay from '../gymBros/components/AvatarDisplay';
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
            
            // Process users to handle location overlaps and add position offsets
            const processedUsers = addLocationOffsets(
              Array.isArray(users) ? users.slice(0, 8) : [], 
              location, 
              userProfile
            );
            
            setNearbyUsers(processedUsers);
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

  // Enhanced location offset logic with grouping support
  const addLocationOffsets = (users, currentLocation, userProfile) => {
    if (!users || users.length === 0) return users;

    const processedUsers = [...users];
    const locationGroups = new Map();

    // First pass: group ALL users by similar locations
    processedUsers.forEach((user, index) => {
      if (!user.lat || !user.lng) return;

      const locationKey = `${Math.round(user.lat * 1000)}_${Math.round(user.lng * 1000)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey).push({ user, index });
    });

    // Check if current user location overlaps with any user group
    let currentUserLocationKey = null;
    if (currentLocation && userProfile) {
      currentUserLocationKey = `${Math.round(currentLocation.lat * 1000)}_${Math.round(currentLocation.lng * 1000)}`;
    }

    // Debug: Log grouping info for showcase
    if (process.env.NODE_ENV === 'development') {
      console.log('Showcase Location Groups:', Array.from(locationGroups.entries()).map(([key, group]) => ({
        key,
        count: group.length,
        users: group.map(g => g.user.name || g.user.id || g.user._id),
        overlapsCurrentUser: key === currentUserLocationKey,
        hasMainUser: group.some(g => userProfile && (g.user.id === userProfile.id || g.user._id === userProfile._id))
      })));
    }

    locationGroups.forEach((group, locationKey) => {
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
      
      // Calculate optimal radius based on group size - larger for showcase visibility
      const baseRadius = 0.005; // ~222 meters (doubled for better visibility)
      const totalUsersToOffset = overlapsCurrentUser ? group.length + 1 : group.length; // +1 for main user space
      const radiusMultiplier = Math.max(1, Math.sqrt(totalUsersToOffset) * 0.8);
      const optimalRadius = baseRadius * radiusMultiplier;

      let offsetIndex = 0; // Track position for non-main users

      group.forEach(({ user, index }, groupIndex) => {
        // NEVER offset the main user, even if they're in a cluster
        if (userProfile && (user.id === userProfile.id || user._id === userProfile._id)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Showcase: Skipping offset for main user ${user.id || user._id} in cluster ${locationKey}`);
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

        // Debug: Log offset details for showcase
        if (process.env.NODE_ENV === 'development') {
          console.log(`Showcase: Offsetting user ${userId} in cluster ${locationKey}:`, {
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

      // User's location marker (primary) - using ImageService for consistency
      if (mapCenter) {
        const userIcon = ImageService.createImageIcon(
          userProfile?.avatar,
          userProfile?.gender || 'Male',
          true, // isCurrentUser
          {},
          userProfile?.id || userProfile?._id
        );

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
              color: '#60A5FA',
              fillColor: '#60A5FA',
              fillOpacity: 0.15,
              weight: 2,
              opacity: 0.6,
              dashArray: '8, 12',
            }}
          />
        );
      }

      // Nearby users markers - using smaller custom icons to prevent overlap
      nearbyUsers.forEach((user, index) => {
        if (user.lat && user.lng) {
          // Skip rendering the main user here (they're already rendered above at exact location)
          if (userProfile && (user.id === userProfile.id || user._id === userProfile._id)) {
            return;
          }

          const userId = user.id || user._id;
          const isMatch = user.source === 'match' || user.isMatch;
          const isGymMember = user.source === 'gym_member' || user.sharedGym;
          const isRecommendation = user.source === 'recommendation' || user.isRecommendation;

          // Use ImageService for consistent sizing - same as main user
          const userIcon = ImageService.createImageIcon(
            user.avatar,
            user.gender || 'Male',
            false, // not current user
            { isMatch, isGymMember, isRecommendation },
            userId
          );

          markers.push(
            <Marker
              key={`user-${userId}-${index}`}
              position={[user.lat, user.lng]}
              icon={userIcon}
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
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ 
            height: '100%', 
            width: '100%'
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
          {/* Dark theme tile layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapUpdater />
          {renderMarkers()}
        </MapContainer>

        {/* Mobile-optimized map overlay with live stats - Dark theme */}
        <div className="absolute bottom-2 left-2 right-2 bg-gray-900/95 backdrop-blur-sm rounded-lg p-2 shadow-md border border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-200 text-xs">Nearby Activity</h3>
            <span className="text-xs text-blue-400 font-medium bg-blue-900/50 px-2 py-1 rounded-full border border-blue-600">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-pink-400">{nearbyUsers.filter(u => u.source === 'match' || u.isMatch).length}</div>
              <div className="text-xs text-gray-400">Matches</div>
            </div>
            <div>
              <div className="text-sm font-bold text-orange-400">{nearbyUsers.filter(u => u.source === 'gym_member' || u.sharedGym).length}</div>
              <div className="text-xs text-gray-400">Gym Buddies</div>
            </div>
            <div>
              <div className="text-sm font-bold text-green-400">{nearbyGyms.length}</div>
              <div className="text-xs text-gray-400">Gyms</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-48 w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center rounded-2xl">
        <div className="text-center">
          <Loader className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Loading Your Area</h3>
          <p className="text-gray-600 text-xs">Finding potential matches and nearby gyms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto flex flex-col">
        {/* Main showcase area - Reduced height, Mobile-first horizontal layout */}
        <div className="relative mb-4">
          <div className="flex gap-3 h-48"> {/* Reduced from min-h-[300px] to h-48 */}
            
            {/* Left side - User Profile Display - 1/4 width, content-based height, centered */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onStartSwiping}
              className="w-1/4 backdrop-blur-sm rounded-2xl p-3 shadow-lg flex flex-col justify-center items-center bg-white/10 border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200"
            >
              {/* Profile Image - Responsive to container */}
              <div className="relative mb-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
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
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Profile Info - Compact */}
              <div className="text-center mb-3 w-full">
                {userProfile?.location && (
                  <div className="flex items-center justify-center text-white/80 mb-2">
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
              </div>
              
              {/* Tempting call-to-action - Not a button */}
              <motion.div
                whileHover={{ scale: 1.02, x: 2 }}
                className="flex items-center text-white/90 text-xs font-medium"
              >
                <span className="mr-1">Tap to explore</span>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              </motion.div>
            </motion.div>

            {/* Right side - Real Map View - 3/4 width */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onStartSwiping}
              className="w-3/4 cursor-pointer"
            >
              <StaticMapView />
            </motion.div>
          </div>
        </div>

        {/* Bottom text section - Reduced spacing */}
        <div className="text-center mb-2">
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">
            Your Perfect Gym Partner is Out There!
          </h2>
          <p className="text-gray-300 text-sm max-w-xl mx-auto px-2">
            Here's your fitness community - see who's active at nearby gyms and in your area.
          </p>
        </div>

      </div>
    </div>
  );
};

export default NoMatchesShowcase;
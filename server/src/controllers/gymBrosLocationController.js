import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import gymBrosLocationService from '../services/gymBrosLocation.service.js';
import User from '../models/User.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosGroup from '../models/GymBrosGroup.js';
import logger from '../utils/logger.js';
import geocodingService from '../services/geocoding.service.js';
import Gym from '../models/Gym.js';

// Enhanced zoom-level aware data densities
const ZOOM_LEVEL_CONFIG = {
  world: { min: 0, max: 4, userLimit: 50, gymLimit: 200, minDistance: 50000 }, // 50km minimum between points
  continent: { min: 5, max: 7, userLimit: 100, gymLimit: 500, minDistance: 10000 }, // 10km minimum
  country: { min: 8, max: 10, userLimit: 200, gymLimit: 1000, minDistance: 5000 }, // 5km minimum
  region: { min: 11, max: 13, userLimit: 500, gymLimit: 2000, minDistance: 1000 }, // 1km minimum
  city: { min: 14, max: 16, userLimit: 1000, gymLimit: 5000, minDistance: 500 }, // 500m minimum
  neighborhood: { min: 17, max: 22, userLimit: 2000, gymLimit: 10000, minDistance: 0 } // No minimum
};

const GYM_LIMITS = {
  MAX_GYMS: 7,              // Regular gyms, sport centers, other facilities
  MAX_EVENTS_COMMUNITIES: 14 // Events and community centers
};

// Smart cache for map data
class MapDataCache {
  constructor() {
    this.cache = new Map();
    this.userLocationCache = new Map();
    this.gymCache = new Map();
    
    // Cache TTL settings based on data type
    this.cacheTTL = {
      gyms: 30 * 60 * 1000,      // 30 minutes (gyms are static)
      users: 2 * 60 * 1000,      // 2 minutes (users move)
      userLocations: 30 * 1000,   // 30 seconds (active user tracking)
      world: 60 * 60 * 1000,      // 1 hour for world-level data
      continent: 30 * 60 * 1000,  // 30 minutes for continent-level
      country: 15 * 60 * 1000,    // 15 minutes for country-level
      region: 5 * 60 * 1000,      // 5 minutes for region-level
      city: 2 * 60 * 1000,        // 2 minutes for city-level
      neighborhood: 30 * 1000     // 30 seconds for neighborhood-level
    };
  }

  generateCacheKey(type, bounds, zoom, filters = {}) {
    const precision = this.getPrecisionForZoom(zoom);
    const north = Math.ceil(bounds.north / precision) * precision;
    const south = Math.floor(bounds.south / precision) * precision;
    const east = Math.ceil(bounds.east / precision) * precision;
    const west = Math.floor(bounds.west / precision) * precision;
    
    const filtersKey = JSON.stringify({
      showUsers: filters.showUsers,
      showGyms: filters.showGyms,
      gymTypes: filters.gymTypes || [],
      maxDistance: filters.maxDistance
    });
    
    return `${type}_z${zoom}_${north}_${south}_${east}_${west}_${filtersKey}`;
  }

  getPrecisionForZoom(zoom) {
    if (zoom <= 4) return 5.0;      // ~500km grid
    if (zoom <= 7) return 1.0;      // ~100km grid
    if (zoom <= 10) return 0.1;     // ~10km grid
    if (zoom <= 13) return 0.01;    // ~1km grid
    if (zoom <= 16) return 0.001;   // ~100m grid
    return 0.0001;                  // ~10m grid
  }

  getConfig(zoom) {
    for (const [level, config] of Object.entries(ZOOM_LEVEL_CONFIG)) {
      if (zoom >= config.min && zoom <= config.max) {
        return { level, ...config };
      }
    }
    return ZOOM_LEVEL_CONFIG.neighborhood;
  }

  get(key, type) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    const ttl = this.cacheTTL[type] || this.cacheTTL.users;
    
    if (now - cached.timestamp < ttl) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }

  set(key, data, type) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type
    });
    
    // Cleanup old entries
    if (this.cache.size > 1000) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      
      oldest.forEach(([key]) => this.cache.delete(key));
    }
  }

  // User location specific caching for real-time updates
  setUserLocation(userId, location) {
    this.userLocationCache.set(userId, {
      ...location,
      timestamp: Date.now()
    });
  }

  getUserLocation(userId) {
    const cached = this.userLocationCache.get(userId);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp < this.cacheTTL.userLocations) {
      return cached;
    }
    
    this.userLocationCache.delete(userId);
    return null;
  }

  clear() {
    this.cache.clear();
    this.userLocationCache.clear();
    this.gymCache.clear();
  }
}

const mapCache = new MapDataCache();

// Enhanced getMapUsers with zoom-level awareness
export const getMapUsers = async (req, res) => {
  try {
    const { north, south, east, west, zoom = 13, maxDistance = 25 } = req.query;
    const effectiveUser = getEffectiveUser(req);

    // Validate required parameters
    if (!north || !south || !east || !west) {
      return res.status(400).json({
        success: false,
        message: 'Bounding box coordinates (north, south, east, west) are required'
      });
    }

    // Convert to numbers
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };

    const zoomLevel = parseInt(zoom);
    const config = mapCache.getConfig(zoomLevel);

    // Generate cache key
    const cacheKey = mapCache.generateCacheKey('users', bounds, zoomLevel, { maxDistance });
    const cached = mapCache.get(cacheKey, config.level);
    
    if (cached) {
      logger.info(`Returning cached user data for zoom ${zoomLevel}`);
      return res.json({
        success: true,
        users: cached.users,
        count: cached.count,
        bounds: bounds,
        zoom: zoomLevel,
        cached: true
      });
    }

    // Validate bounds
    if (bounds.north <= bounds.south || bounds.east <= bounds.west) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bounding box coordinates'
      });
    }

    // Get current user's profile ID for exclusion
    let currentUserProfileId = null;
    if (effectiveUser.profileId) {
      currentUserProfileId = effectiveUser.profileId;
    } else if (effectiveUser.userId) {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (profile) {
        currentUserProfileId = profile._id;
      }
    }

    // Build the aggregation pipeline with zoom-aware optimizations
    const pipeline = [
      // Match active profiles within geographic bounds
      {
        $match: {
          isActive: true,
          'location.lat': {
            $gte: bounds.south,
            $lte: bounds.north
          },
          'location.lng': {
            $gte: bounds.west,
            $lte: bounds.east
          },
          // Exclude current user
          ...(currentUserProfileId && { _id: { $ne: currentUserProfileId } }),
          // Only show users active within appropriate timeframe based on zoom
          lastActive: {
            $gte: new Date(Date.now() - (config.level === 'world' ? 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000))
          }
        }
      }
    ];

    // Add distance calculation and filtering for closer zoom levels
    if (config.level !== 'world' && config.level !== 'continent') {
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      
      pipeline.push(
        // Add distance calculation from center of bounds
        {
          $addFields: {
            distance: {
              $multiply: [
                111000, // Convert to meters
                {
                  $sqrt: {
                    $add: [
                      {
                        $pow: [
                          {
                            $subtract: ['$location.lat', centerLat]
                          },
                          2
                        ]
                      },
                      {
                        $pow: [
                          {
                            $multiply: [
                              {
                                $subtract: ['$location.lng', centerLng]
                              },
                              { $cos: { $multiply: [centerLat, Math.PI / 180] } }
                            ]
                          },
                          2
                        ]
                      }
                    ]
                  }
                }
              ]
            }
          }
        },
        // Filter by max distance
        {
          $match: {
            distance: { $lte: parseFloat(maxDistance) * 1000 } // Convert km to meters
          }
        }
      );
    }

    // Add sampling for large zoom-out views
    if (config.minDistance > 0) {
      // Group nearby users and sample from each group
      pipeline.push(
        {
          $addFields: {
            gridLat: {
              $floor: {
                $divide: ['$location.lat', config.minDistance / 111000]
              }
            },
            gridLng: {
              $floor: {
                $divide: ['$location.lng', config.minDistance / 111000]
              }
            }
          }
        },
        {
          $group: {
            _id: { gridLat: '$gridLat', gridLng: '$gridLng' },
            users: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $addFields: {
            // Take most active user from each grid cell
            representative: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: '$users',
                    sortBy: { lastActive: -1 }
                  }
                },
                0
              ]
            }
          }
        },
        { $replaceRoot: { newRoot: '$representative' } }
      );
    }

    // Populate user data and project final fields
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          age: 1,
          bio: 1,
          avatar: 1,
          workoutTypes: 1,
          experienceLevel: 1,
          preferredTime: 1,
          location: {
            lat: '$location.lat',
            lng: '$location.lng'
          },
          distance: { $round: [{ $divide: ['$distance', 1000] }, 1] }, // Convert back to km
          lastActive: 1,
          isOnline: {
            $gt: [
              '$lastActive',
              { $subtract: [new Date(), 15 * 60 * 1000] } // Online if active in last 15 minutes
            ]
          },
          profileImage: { $arrayElemAt: ['$userInfo.profileImage', 0] },
          userEmail: { $arrayElemAt: ['$userInfo.email', 0] },
          userPhone: { $arrayElemAt: ['$userInfo.phone', 0] },
          // Add activity indicator based on last active time
          activityStatus: {
            $switch: {
              branches: [
                {
                  case: { $gt: ['$lastActive', { $subtract: [new Date(), 15 * 60 * 1000] }] },
                  then: 'online'
                },
                {
                  case: { $gt: ['$lastActive', { $subtract: [new Date(), 60 * 60 * 1000] }] },
                  then: 'recent'
                },
                {
                  case: { $gt: ['$lastActive', { $subtract: [new Date(), 24 * 60 * 60 * 1000] }] },
                  then: 'today'
                }
              ],
              default: 'offline'
            }
          }
        }
      },
      {
        $sort: {
          lastActive: -1,
          distance: 1
        }
      },
      {
        $limit: config.userLimit
      }
    );

    logger.info(`Fetching users for zoom level ${zoomLevel} (${config.level}) with limit ${config.userLimit}`);

    const users = await GymBrosProfile.aggregate(pipeline);

    // Filter out users who haven't been active recently for appropriate zoom levels
    const filteredUsers = users.filter(user => {
      if (config.level === 'world' || config.level === 'continent') {
        // For world/continent view, show users active within 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return !user.lastActive || user.lastActive > dayAgo;
      } else {
        // For closer views, show users active within 4 hours
        const hoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        return !user.lastActive || user.lastActive > hoursAgo;
      }
    });

    logger.info(`Found ${filteredUsers.length} active users in map bounds for zoom ${zoomLevel}`);

    const result = {
      users: filteredUsers,
      count: filteredUsers.length,
      bounds: bounds,
      zoom: zoomLevel,
      config: config
    };

    // Cache the result
    mapCache.set(cacheKey, result, config.level);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Error fetching map users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map users'
    });
  }
};

export const validateGymAssociationLimits = async (profileId, newGymType) => {
  try {
    // Import necessary models
    const { default: GymBrosProfile } = await import('../models/GymBrosProfile.js');
    const { default: Gym } = await import('../models/Gym.js');

    // Get user's current gym associations
    const profile = await GymBrosProfile.findById(profileId).populate('gyms.gym');
    
    if (!profile) {
      return { canJoin: false, reason: 'Profile not found' };
    }

    // Get active gym associations
    const activeGyms = profile.gyms.filter(g => g.isActive && g.gym);
    
    // Categorize current gyms
    const gymTypes = ['gym', 'sport_center', 'other'];
    const eventCommunityTypes = ['community', 'event'];
    
    let currentGymCount = 0;
    let currentEventCommunityCount = 0;
    
    for (const gymAssoc of activeGyms) {
      const gymType = gymAssoc.gym.type || 'gym';
      
      if (gymTypes.includes(gymType)) {
        currentGymCount++;
      } else if (eventCommunityTypes.includes(gymType)) {
        currentEventCommunityCount++;
      }
    }

    // Check limits for the new gym type
    if (gymTypes.includes(newGymType)) {
      if (currentGymCount >= GYM_LIMITS.MAX_GYMS) {
        return {
          canJoin: false,
          reason: `You can only join up to ${GYM_LIMITS.MAX_GYMS} gyms. You currently have ${currentGymCount} gym memberships.`,
          currentCount: currentGymCount,
          limit: GYM_LIMITS.MAX_GYMS,
          type: 'gym'
        };
      }
    } else if (eventCommunityTypes.includes(newGymType)) {
      if (currentEventCommunityCount >= GYM_LIMITS.MAX_EVENTS_COMMUNITIES) {
        return {
          canJoin: false,
          reason: `You can only join up to ${GYM_LIMITS.MAX_EVENTS_COMMUNITIES} communities/events. You currently have ${currentEventCommunityCount} memberships.`,
          currentCount: currentEventCommunityCount,
          limit: GYM_LIMITS.MAX_EVENTS_COMMUNITIES,
          type: 'event_community'
        };
      }
    }

    return {
      canJoin: true,
      reason: null,
      currentCounts: {
        gyms: currentGymCount,
        eventsCommunities: currentEventCommunityCount
      }
    };

  } catch (error) {
    logger.error('Error validating gym association limits:', error);
    return {
      canJoin: false,
      reason: 'Unable to validate membership limits. Please try again.'
    };
  }
};

// Updated associateWithGym function with comprehensive debugging
export const associateWithGym = async (req, res) => {
  try {
    const { gymId, isPrimary = false, membershipType = 'member', visitFrequency, preferredTimes, notes } = req.body;
    
    console.log('🏋️ === ASSOCIATE WITH GYM DEBUG START ===');
    console.log('🏋️ Request body:', JSON.stringify(req.body, null, 2));
    console.log('🏋️ Headers:', JSON.stringify(req.headers, null, 2));
    
    // Get effective user first and debug it
    const effectiveUser = getEffectiveUser(req);
    console.log('🏋️ Effective user object:', JSON.stringify(effectiveUser, null, 2));
    console.log('🏋️ req.user:', req.user ? JSON.stringify(req.user, null, 2) : 'null');
    console.log('🏋️ req.guestUser:', req.guestUser ? JSON.stringify(req.guestUser, null, 2) : 'null');
    
    // Validate required data
    if (!gymId) {
      console.log('🏋️ ERROR: Missing gymId');
      return res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
    }

    // Debug profile lookup strategy
    console.log('🏋️ Starting profile lookup...');
    let profile;
    let lookupMethod = 'unknown';
    
    if (effectiveUser.isGuest) {
      console.log('🏋️ USER TYPE: Guest user detected');
      
      if (effectiveUser.profileId) {
        console.log('🏋️ LOOKUP METHOD: Guest with profileId');
        console.log('🏋️ Searching for profileId:', effectiveUser.profileId);
        lookupMethod = 'guest-profileId';
        
        try {
          profile = await GymBrosProfile.findById(effectiveUser.profileId);
          console.log('🏋️ Profile lookup by ID result:', profile ? {
            _id: profile._id,
            name: profile.name,
            phone: profile.phone,
            userId: profile.userId
          } : 'null');
        } catch (findError) {
          console.log('🏋️ ERROR in findById:', findError);
        }
        
      } else if (effectiveUser.phone) {
        console.log('🏋️ LOOKUP METHOD: Guest with phone only');
        console.log('🏋️ Phone number:', effectiveUser.phone);
        lookupMethod = 'guest-phone';
        
        try {
          // Debug phone search comprehensively
          console.log('🏋️ Searching for guest profile with phone:', effectiveUser.phone);
          
          // First, let's see all profiles with phones
          const allWithPhones = await GymBrosProfile.find({ 
            phone: { $exists: true, $ne: null } 
          }, { _id: 1, name: 1, phone: 1, userId: 1 }).limit(10);
          console.log('🏋️ Sample profiles with phones:', allWithPhones);
          
          // Look for guest profiles (no userId)
          const guestProfiles = await GymBrosProfile.find({
            $or: [
              { userId: { $exists: false } },
              { userId: null }
            ]
          }, { _id: 1, name: 1, phone: 1, userId: 1 }).limit(5);
          console.log('🏋️ Sample guest profiles:', guestProfiles);
          
          // Try exact phone match for guest
          profile = await GymBrosProfile.findOne({ 
            phone: effectiveUser.phone,
            $or: [
              { userId: { $exists: false } },
              { userId: null }
            ]
          });
          console.log('🏋️ Guest profile lookup result:', profile ? {
            _id: profile._id,
            name: profile.name,
            phone: profile.phone,
            userId: profile.userId
          } : 'null');
          
          // If not found, try any profile with this phone
          if (!profile) {
            console.log('🏋️ No guest profile found, trying any profile with phone...');
            profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone });
            console.log('🏋️ Any profile with phone result:', profile ? {
              _id: profile._id,
              name: profile.name,
              phone: profile.phone,
              userId: profile.userId
            } : 'null');
          }
          
        } catch (phoneError) {
          console.log('🏋️ ERROR in phone lookup:', phoneError);
        }
      } else {
        console.log('🏋️ ERROR: Guest user has no profileId or phone');
      }
      
    } else {
      console.log('🏋️ USER TYPE: Authenticated user');
      console.log('🏋️ LOOKUP METHOD: Authenticated userId');
      console.log('🏋️ UserId:', effectiveUser.userId);
      lookupMethod = 'auth-userId';
      
      try {
        profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
        console.log('🏋️ Auth profile lookup result:', profile ? {
          _id: profile._id,
          name: profile.name,
          phone: profile.phone,
          userId: profile.userId
        } : 'null');
      } catch (authError) {
        console.log('🏋️ ERROR in auth lookup:', authError);
      }
    }

    console.log('🏋️ FINAL PROFILE RESULT:', profile ? {
      _id: profile._id,
      name: profile.name,
      phone: profile.phone,
      userId: profile.userId,
      lookupMethod: lookupMethod
    } : 'null');

    if (!profile) {
      console.log('🏋️ === PROFILE NOT FOUND ERROR ===');
      console.log('🏋️ Lookup method used:', lookupMethod);
      console.log('🏋️ Effective user was:', JSON.stringify(effectiveUser, null, 2));
      
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        debug: {
          lookupMethod,
          effectiveUser,
          hasReqUser: !!req.user,
          hasGuestUser: !!req.guestUser
        }
      });
    }

    console.log('🏋️ Profile found successfully, continuing with gym association...');

    // Get gym details
    const gym = await Gym.findById(gymId);
    if (!gym) {
      console.log('🏋️ ERROR: Gym not found for ID:', gymId);
      return res.status(404).json({
        success: false,
        message: 'Gym not found'
      });
    }

    console.log('🏋️ Gym found:', { _id: gym._id, name: gym.name, type: gym.type });

    // Check if already a member
    const existingAssociation = profile.gyms.find(g => 
      g.gym.toString() === gymId.toString() && g.isActive
    );

    if (existingAssociation) {
      console.log('🏋️ ERROR: Already a member');
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this facility'
      });
    }

    // VALIDATE ASSOCIATION LIMITS
    console.log('🏋️ Validating association limits...');
    const limitValidation = await validateGymAssociationLimits(profile._id, gym.type);
    console.log('🏋️ Limit validation result:', limitValidation);
    
    if (!limitValidation.canJoin) {
      console.log('🏋️ ERROR: Cannot join due to limits');
      return res.status(400).json({
        success: false,
        message: limitValidation.reason,
        limitInfo: {
          currentCount: limitValidation.currentCount,
          limit: limitValidation.limit,
          type: limitValidation.type
        }
      });
    }

    // Add gym association using the existing method
    console.log('🏋️ Adding gym association...');
    profile.addGym(gymId, {
      membershipType,
      isPrimary,
      visitFrequency: visitFrequency || 'weekly',
      preferredTimes: preferredTimes || [],
      notes: notes || ''
    });

    await profile.save();
    console.log('🏋️ Profile saved successfully');

    // Update gym member count
    await Gym.findByIdAndUpdate(gymId, {
      $inc: { memberCount: 1 }
    });
    console.log('🏋️ Gym member count updated');

    // Prepare response
    let responseData = {
      success: true,
      message: `Successfully joined ${gym.name}`,
      gym: {
        _id: gym._id,
        name: gym.name,
        type: gym.type
      },
      membershipType,
      isPrimary,
      currentCounts: limitValidation.currentCounts
    };

    // Add guest token if applicable
    if (effectiveUser.isGuest) {
      console.log('🏋️ Adding guest token to response');
      responseData.guestToken = generateGuestToken(effectiveUser.phone, profile._id);
    }

    console.log('🏋️ === ASSOCIATE WITH GYM SUCCESS ===');
    console.log('🏋️ Response data:', JSON.stringify(responseData, null, 2));
    
    logger.info(`User ${profile._id} joined gym ${gym.name} (${gym.type})`);
    
    res.json(responseData);

  } catch (error) {
    console.log('🏋️ === ASSOCIATE WITH GYM ERROR ===');
    console.log('🏋️ Error details:', error);
    console.log('🏋️ Error stack:', error.stack);
    
    logger.error('Error associating with gym:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join facility'
    });
  }
};

// Also add a helper endpoint to check current limits
export const getGymAssociationLimits = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    // Get user profile
    let profile;
    if (effectiveUser.isGuest) {
      if (effectiveUser.profileId) {
        profile = await GymBrosProfile.findById(effectiveUser.profileId).populate('gyms.gym');
      } else if (effectiveUser.phone) {
        profile = await GymBrosProfile.findOne({ phone: effectiveUser.phone }).populate('gyms.gym');
      }
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId }).populate('gyms.gym');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Count current associations
    const activeGyms = profile.gyms.filter(g => g.isActive && g.gym);
    
    const gymTypes = ['gym', 'sport_center', 'other'];
    const eventCommunityTypes = ['community', 'event'];
    
    let currentGymCount = 0;
    let currentEventCommunityCount = 0;
    
    for (const gymAssoc of activeGyms) {
      const gymType = gymAssoc.gym.type || 'gym';
      
      if (gymTypes.includes(gymType)) {
        currentGymCount++;
      } else if (eventCommunityTypes.includes(gymType)) {
        currentEventCommunityCount++;
      }
    }

    const responseData = {
      success: true,
      limits: {
        maxGyms: GYM_LIMITS.MAX_GYMS,
        maxEventsCommunities: GYM_LIMITS.MAX_EVENTS_COMMUNITIES
      },
      current: {
        gyms: currentGymCount,
        eventsCommunities: currentEventCommunityCount
      },
      available: {
        gyms: GYM_LIMITS.MAX_GYMS - currentGymCount,
        eventsCommunities: GYM_LIMITS.MAX_EVENTS_COMMUNITIES - currentEventCommunityCount
      }
    };

    // Add guest token if applicable
    if (effectiveUser.isGuest) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone, profile._id);
    }

    res.json(responseData);

  } catch (error) {
    logger.error('Error getting gym association limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get association limits'
    });
  }
};

// Remove gym association
export const removeGymAssociation = async (req, res) => {
  try {
    const { gymId } = req.params;
    const effectiveUser = getEffectiveUser(req);

    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let profile;
    if (effectiveUser.profileId) {
      profile = await GymBrosProfile.findById(effectiveUser.profileId);
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile.removeGym(gymId);
    await profile.save();

    const memberCount = await GymBrosProfile.countDocuments({
      'gyms.gym': gymId,
      'gyms.status': 'active'
    });

    await Gym.findByIdAndUpdate(gymId, { memberCount });

    res.json({
      success: true,
      message: 'Successfully left gym',
      memberCount
    });

  } catch (error) {
    logger.error('Error removing gym association:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave gym'
    });
  }
};

// Set primary gym
export const setPrimaryGym = async (req, res) => {
  try {
    const { gymId } = req.body;
    const effectiveUser = getEffectiveUser(req);

    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let profile;
    if (effectiveUser.profileId) {
      profile = await GymBrosProfile.findById(effectiveUser.profileId);
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile.setPrimaryGym(gymId);
    await profile.save();

    res.json({
      success: true,
      message: 'Primary gym updated successfully'
    });

  } catch (error) {
    logger.error('Error setting primary gym:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary gym'
    });
  }
};

// Get user's gyms
export const getUserGyms = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);

    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let profile;
    if (effectiveUser.profileId) {
      profile = await GymBrosProfile.findById(effectiveUser.profileId).populate('gyms.gym');
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId }).populate('gyms.gym');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      gyms: profile.gyms,
      primaryGym: profile.primaryGym
    });

  } catch (error) {
    logger.error('Error getting user gyms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user gyms'
    });
  }
};

// Get gym members
export const getGymMembers = async (req, res) => {
  try {
    const { gymId } = req.params;
    const { limit = 50, offset = 0, membershipType, status = 'active' } = req.query;

    const query = {
      'gyms.gym': gymId,
      'gyms.status': status
    };

    if (membershipType) {
      query['gyms.membershipType'] = membershipType;
    }

    const members = await GymBrosProfile.find(query)
      .populate('gyms.gym')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('name age profileImage workoutTypes experienceLevel lastActive gyms');

    const total = await GymBrosProfile.countDocuments(query);

    res.json({
      success: true,
      members,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Error getting gym members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gym members'
    });
  }
};

// Enhanced getGymsForMap with zoom-level awareness and type filtering
export const getGymsForMap = async (req, res) => {
  try {
    const { type, search, types, limit = 500, offset = 0 } = req.query;
    let query = { isActive: true };

    if (type) {
      query.type = type;
    } else if (types) {
      const typeArray = Array.isArray(types) ? types : types.split(',');
      query.type = { $in: typeArray };
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { gymChain: { $regex: search, $options: 'i' } }
      ];
    }

    logger.info('[getGymsForMap] Query:', JSON.stringify(query));

    const gyms = await Gym.find(query)
      .sort({ isVerified: -1, memberCount: -1, type: 1 })
      .skip(Number(offset))
      .limit(Number(limit));

    logger.info(`[getGymsForMap] Found ${gyms.length} gyms`);

    res.json({
      success: true,
      gyms,
      total: gyms.length
    });
  } catch (error) {
    logger.error('[getGymsForMap] Error:', error);
    res.status(500).json({ error: 'Failed to fetch gyms' });
  }
};

export const updateUserLocationRealtime = async (req, res) => {
  try {
    // Extract from locationData if it exists, otherwise use req.body directly
    const locationData = req.body.locationData || req.body;
    const { lat, lng, accuracy, source = 'gps', timestamp } = locationData;

    console.log('Received location update:', { lat, lng, accuracy, source, timestamp }); // Debug log

    // Add validation
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const effectiveUser = getEffectiveUser(req);

    if (!effectiveUser.userId && !effectiveUser.profileId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find user's profile
    let profile;
    if (effectiveUser.profileId) {
      profile = await GymBrosProfile.findById(effectiveUser.profileId);
    } else {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Update location with proper structure
    profile.location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: profile.location?.address || '',
      city: profile.location?.city || '',
      state: profile.location?.state || '',
      country: profile.location?.country || 'US',
      zipCode: profile.location?.zipCode || '',
      accuracy: accuracy || 'medium',
      source: source || 'gps',
      lastUpdated: new Date(timestamp || Date.now())
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Error updating realtime location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location'
    });
  }
};
// Get clustered data for specific zoom level (similar to Snapchat's heat map)
export const getMapClusters = async (req, res) => {
  try {
    const { north, south, east, west, zoom = 13, clusterSize = 0.01 } = req.query;
    const effectiveUser = getEffectiveUser(req);

    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };

    const zoomLevel = parseInt(zoom);
    const config = mapCache.getConfig(zoomLevel);

    // Calculate appropriate cluster size based on zoom level
    const dynamicClusterSize = parseFloat(clusterSize) * Math.pow(2, Math.max(0, 15 - zoomLevel));

    // Get clustered user data
    const userClusters = await GymBrosProfile.aggregate([
      {
        $match: {
          isActive: true,
          'location.lat': { $gte: bounds.south, $lte: bounds.north },
          'location.lng': { $gte: bounds.west, $lte: bounds.east },
          lastActive: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // 4 hours
        }
      },
      {
        $addFields: {
          clusterLat: {
            $multiply: [
              { $floor: { $divide: ['$location.lat', dynamicClusterSize] } },
              dynamicClusterSize
            ]
          },
          clusterLng: {
            $multiply: [
              { $floor: { $divide: ['$location.lng', dynamicClusterSize] } },
              dynamicClusterSize
            ]
          }
        }
      },
      {
        $group: {
          _id: { lat: '$clusterLat', lng: '$clusterLng' },
          count: { $sum: 1 },
          onlineCount: {
            $sum: {
              $cond: [
                { $gt: ['$lastActive', { $subtract: [new Date(), 15 * 60 * 1000] }] },
                1,
                0
              ]
            }
          },
          users: { 
            $push: {
              _id: '$_id',
              name: '$name',
              avatar: '$avatar',
              isOnline: {
                $gt: ['$lastActive', { $subtract: [new Date(), 15 * 60 * 1000] }]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          lat: '$_id.lat',
          lng: '$_id.lng',
          count: 1,
          onlineCount: 1,
          // Only include sample users for smaller clusters
          users: {
            $cond: [
              { $lte: ['$count', 10] },
              '$users',
              { $slice: ['$users', 3] }
            ]
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 500 }
    ]);

    // Get clustered gym data
    const gymClusters = await Gym.aggregate([
      {
        $match: {
          isActive: true,
          'location.coordinates.1': { $gte: bounds.south, $lte: bounds.north },
          'location.coordinates.0': { $gte: bounds.west, $lte: bounds.east }
        }
      },
      {
        $addFields: {
          lat: { $arrayElemAt: ['$location.coordinates', 1] },
          lng: { $arrayElemAt: ['$location.coordinates', 0] },
          clusterLat: {
            $multiply: [
              { $floor: { $divide: [{ $arrayElemAt: ['$location.coordinates', 1] }, dynamicClusterSize] } },
              dynamicClusterSize
            ]
          },
          clusterLng: {
            $multiply: [
              { $floor: { $divide: [{ $arrayElemAt: ['$location.coordinates', 0] }, dynamicClusterSize] } },
              dynamicClusterSize
            ]
          }
        }
      },
      {
        $group: {
          _id: { lat: '$clusterLat', lng: '$clusterLng' },
          count: { $sum: 1 },
          gyms: {
            $push: {
              _id: '$_id',
              name: '$name',
              type: '$type',
              verified: '$isVerified',
              memberCount: '$memberCount'
            }
          },
          types: { $addToSet: '$type' }
        }
      },
      {
        $project: {
          _id: 0,
          lat: '$_id.lat',
          lng: '$_id.lng',
          count: 1,
          types: 1,
          // Only include sample gyms for smaller clusters
          gyms: {
            $cond: [
              { $lte: ['$count', 5] },
              '$gyms',
              { $slice: ['$gyms', 2] }
            ]
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 300 }
    ]);

    res.json({
      success: true,
      userClusters,
      gymClusters,
      zoom: zoomLevel,
      clusterSize: dynamicClusterSize,
      bounds
    });

  } catch (error) {
    logger.error('Error fetching map clusters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map clusters'
    });
  }
};

// Get real-time updates for a specific viewport
export const getMapUpdates = async (req, res) => {
  try {
    const { north, south, east, west, lastUpdate } = req.query;
    const effectiveUser = getEffectiveUser(req);

    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };

    const since = lastUpdate ? new Date(lastUpdate) : new Date(Date.now() - 60000); // Default to last minute

    // Get users that have updated their location since lastUpdate
    const updatedUsers = await GymBrosProfile.find({
      isActive: true,
      'location.lat': { $gte: bounds.south, $lte: bounds.north },
      'location.lng': { $gte: bounds.west, $lte: bounds.east },
      $or: [
        { 'location.lastUpdated': { $gte: since } },
        { lastActive: { $gte: since } }
      ]
    }).select('_id name avatar location lastActive workoutTypes experienceLevel')
      .limit(100);

    // Get newly created or updated gyms
    const updatedGyms = await Gym.find({
      isActive: true,
      'location.coordinates.1': { $gte: bounds.south, $lte: bounds.north },
      'location.coordinates.0': { $gte: bounds.west, $lte: bounds.east },
      updatedAt: { $gte: since }
    }).limit(50);

    const processedUsers = updatedUsers.map(user => ({
      ...user.toObject(),
      lat: user.location.lat,
      lng: user.location.lng,
      isOnline: user.lastActive > new Date(Date.now() - 15 * 60 * 1000)
    }));

    const processedGyms = updatedGyms.map(gym => ({
      ...gym.toObject(),
      lat: gym.location.coordinates[1],
      lng: gym.location.coordinates[0]
    }));

    res.json({
      success: true,
      users: processedUsers,
      gyms: processedGyms,
      timestamp: new Date().toISOString(),
      bounds
    });

  } catch (error) {
    logger.error('Error fetching map updates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map updates'
    });
  }
};

// Enhanced gym creation with better type support
export const createGym = async (req, res) => {
  try {
    const gymData = req.body;
    const effectiveUser = getEffectiveUser(req);

    logger.info('Creating gym with data:', JSON.stringify(gymData));

    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone && !effectiveUser.email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication, verified phone, or email required to create gym'
      });
    }

    if (!gymData.name || !gymData.location) {
      return res.status(400).json({
        success: false,
        message: 'Gym name and location are required'
      });
    }

    // Validate gym type
    const validTypes = ['gym', 'community', 'event', 'sport_center', 'other'];
    if (gymData.type && !validTypes.includes(gymData.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gym type. Must be one of: ' + validTypes.join(', ')
      });
    }

    let createdByValue = null;
    if (effectiveUser.userId) {
      createdByValue = effectiveUser.userId;
    } else if (effectiveUser.phone) {
      createdByValue = effectiveUser.phone;
    } else if (effectiveUser.email) {
      createdByValue = effectiveUser.email;
    } else if (effectiveUser.profileId) {
      createdByValue = effectiveUser.profileId;
    }

    if (!createdByValue) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine creator for gym.'
      });
    }

    // Determine the gym's actual coordinates
    let gymLat, gymLng;
    let geocoded = false;
    
    // Check if we should geocode the address
    if (gymData.shouldGeocode && gymData.location.address && gymData.location.city && gymData.location.country) {
      logger.info(`Attempting to geocode gym address: ${gymData.location.address}, ${gymData.location.city}, ${gymData.location.country}`);
      
      try {
        const geocodeResult = await geocodingService.geocodeAddress(
          gymData.location.address,
          gymData.location.city,
          gymData.location.state || '',
          gymData.location.country,
          gymData.location.zipCode || ''
        );
        
        if (geocodeResult) {
          gymLat = geocodeResult.lat;
          gymLng = geocodeResult.lng;
          geocoded = true;
          logger.info(`Geocoding successful - Gym coordinates: ${gymLat}, ${gymLng}`);
        } else {
          // Geocoding failed, fall back to user's location
          logger.warn('Geocoding failed, using user location as fallback');
          gymLat = parseFloat(gymData.location.lat);
          gymLng = parseFloat(gymData.location.lng);
        }
      } catch (geocodeError) {
        logger.error('Geocoding error:', geocodeError);
        // Fall back to user's location
        gymLat = parseFloat(gymData.location.lat);
        gymLng = parseFloat(gymData.location.lng);
      }
    } else {
      // Use the provided coordinates (user is at the gym)
      gymLat = parseFloat(gymData.location.lat);
      gymLng = parseFloat(gymData.location.lng);
      logger.info('Using provided coordinates (user at gym location)');
    }

    // Check if a gym already exists at this location
    try {
      const nearbyGyms = await Gym.findNearby(gymLat, gymLng, 0.1); // Within ~160 meters
      const existingGym = nearbyGyms.find(gym => 
        gym.name.toLowerCase() === gymData.name.toLowerCase()
      );
      
      if (existingGym) {
        logger.info(`Gym already exists: ${existingGym.name}`);
        
        // Calculate distance from user
        let distanceFromUser = 0;
        if (gymData.userLocation && gymData.userLocation.lat && gymData.userLocation.lng) {
          const userLat = parseFloat(gymData.userLocation.lat);
          const userLng = parseFloat(gymData.userLocation.lng);
          distanceFromUser = geocodingService.calculateDistance(userLat, userLng, gymLat, gymLng);
        }
        
        return res.json({
          success: true,
          gym: {
            ...existingGym.toObject(),
            distanceMiles: parseFloat(distanceFromUser.toFixed(1))
          },
          message: 'Gym already exists',
          geocoded: geocoded
        });
      }
    } catch (nearbyError) {
      logger.warn('Could not check for nearby gyms:', nearbyError.message);
    }

    // Create the new gym with correct coordinates and type
    const newGym = await Gym.create({
      name: gymData.name,
      type: gymData.type || 'gym', // Default to 'gym' if not specified
      location: {
        type: 'Point',
        coordinates: [gymLng, gymLat], // GeoJSON format: [lng, lat]
        address: gymData.location.address || '',
        city: gymData.location.city || '',
        state: gymData.location.state || '',
        country: gymData.location.country || '',
        zipCode: gymData.location.zipCode || ''
      },
      description: gymData.description || '',
      amenities: gymData.amenities || [],
      gymChain: gymData.gymChain || '',
      website: gymData.website || '',
      phone: gymData.phone || '',
      createdBy: createdByValue,
      isActive: true
    });

    logger.info(`Created new gym: ${newGym.name} at coordinates [${gymLng}, ${gymLat}] with type: ${newGym.type}`);

    // Calculate distance from user's current location
    let distanceFromUser = 0;
    if (gymData.userLocation && gymData.userLocation.lat && gymData.userLocation.lng) {
      const userLat = parseFloat(gymData.userLocation.lat);
      const userLng = parseFloat(gymData.userLocation.lng);
      distanceFromUser = geocodingService.calculateDistance(userLat, userLng, gymLat, gymLng);
      logger.info(`Distance from user to gym: ${distanceFromUser.toFixed(1)} miles`);
    }

    // Clear relevant caches
    mapCache.clear();

    // Return the gym with proper distance calculated
    const responseGym = {
      _id: newGym._id,
      name: newGym.name,
      type: newGym.type,
      location: {
        lat: gymLat,
        lng: gymLng,
        address: newGym.location.address,
        city: newGym.location.city,
        state: newGym.location.state,
        country: newGym.location.country,
        zipCode: newGym.location.zipCode
      },
      distanceMiles: parseFloat(distanceFromUser.toFixed(1)),
      description: newGym.description,
      amenities: newGym.amenities,
      gymChain: newGym.gymChain,
      website: newGym.website,
      phone: newGym.phone,
      memberCount: 0,
      rating: { average: 0, count: 0 },
      isVerified: false,
      createdAt: newGym.createdAt
    };

    let responseData = {
      success: true,
      gym: responseGym,
      geocoded: geocoded,
      message: geocoded ? 'Gym created successfully with accurate location' : 'Gym created (approximate location)'
    };

    if (effectiveUser.isGuest && (effectiveUser.phone || effectiveUser.email)) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone || effectiveUser.email, effectiveUser.profileId);
    }

    // Emit real-time update about new gym creation
    try {
      if (global.io) {
        global.io.emit('gymCreated', {
          gym: responseGym,
          location: { lat: gymLat, lng: gymLng }
        });
      }
    } catch (socketError) {
      logger.warn('Socket emission failed:', socketError.message);
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error creating gym:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating gym',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all existing functions...
export const checkLocation = async (req, res) => {
  try {
    const { phone, user: clientUser } = req.body;
    const effectiveUser = getEffectiveUser(req);
    
    const user = effectiveUser.userId ? 
      await User.findById(effectiveUser.userId) : 
      clientUser;
    
    const result = await gymBrosLocationService.checkExistingLocation(user, phone || effectiveUser.phone);
    
    res.json(result);
  } catch (error) {
    logger.error('Error checking existing location:', error);
    res.status(500).json({ message: 'Error checking location' });
  }
};

export const checkLocationLegacy = async (req, res) => {
  try {
    const { phone } = req.query;
    const effectiveUser = getEffectiveUser(req);
    
    const user = effectiveUser.userId ? await User.findById(effectiveUser.userId) : null;
    
    const result = await gymBrosLocationService.checkExistingLocation(user, phone);
    
    res.json(result);
  } catch (error) {
    logger.error('Error checking existing location:', error);
    res.status(500).json({ message: 'Error checking location' });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { locationData, user: clientUser, phone } = req.body;
    const effectiveUser = getEffectiveUser(req);
    
    if (!locationData) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required'
      });
    }

    const user = effectiveUser.userId ? 
      await User.findById(effectiveUser.userId) : 
      clientUser;

      console.log('Updating location for user:', user);

    const result = await gymBrosLocationService.updateUserLocation(
      locationData, 
      user, 
      phone || (user && user.phone),
      effectiveUser.profileId
    );
    
    res.json({
      success: true,
      updates: result.updates,
      message: 'Location updated successfully across all systems',
      nearbyGyms: result.nearbyGyms || [],
      autoJoinedGroups: result.autoJoinedGroups || []
    });
  } catch (error) {
    logger.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};

export const updateLocationLegacy = async (req, res) => {
  try {
    const { locationData, phone } = req.body;
    const effectiveUser = getEffectiveUser(req);
    
    if (!locationData) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required'
      });
    }

    const user = effectiveUser.userId ? 
      await User.findById(effectiveUser.userId) : 
      null;

    const result = await gymBrosLocationService.updateUserLocation(
      locationData,
      user,
      phone || effectiveUser.phone,
      effectiveUser.profileId
    );

    res.json(result);
  } catch (error) {
    logger.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};

export const getLocationRecommendations = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const locationData = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    const recommendations = await gymBrosLocationService.getLocationRecommendations(locationData);
    
    res.json(recommendations);
  } catch (error) {
    logger.error('Error getting location recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
};

export const searchGyms = async (req, res) => {
  try {
    const { lat, lng, query = '', radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    let gyms = await gymBrosLocationService.findNearbyGyms(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );

    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      gyms = gyms.filter(gym => 
        gym.name.toLowerCase().includes(searchTerm) ||
        gym.description?.toLowerCase().includes(searchTerm) ||
        gym.location.city?.toLowerCase().includes(searchTerm) ||
        gym.gymChain?.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      gyms: gyms,
      count: gyms.length
    });
  } catch (error) {
    logger.error('Error searching gyms:', error);
    res.status(500).json({ message: 'Error searching gyms' });
  }
};

export const getNearbyGroups = async (req, res) => {
  try {
    const { lat, lng, radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const groups = await GymBrosGroup.findNearbyLocationGroups(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );

    res.json({
      success: true,
      groups: groups,
      count: groups.length
    });
  } catch (error) {
    logger.error('Error getting nearby groups:', error);
    res.status(500).json({ message: 'Error getting nearby groups' });
  }
};

export const createLocationGroup = async (req, res) => {
  try {
    const groupData = req.body;
    const effectiveUser = getEffectiveUser(req);

    if (!effectiveUser.profileId && !effectiveUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create group'
      });
    }

    let profileId = effectiveUser.profileId;
    if (!profileId && effectiveUser.userId) {
      const profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId });
      if (profile) {
        profileId = profile._id;
      }
    }

    if (!profileId) {
      return res.status(404).json({
        success: false,
        message: 'Profile required to create group'
      });
    }

    const group = new GymBrosGroup({
      name: groupData.name,
      description: groupData.description,
      groupType: 'location',
      location: {
        lat: groupData.location.lat,
        lng: groupData.location.lng,
        address: groupData.location.address,
        city: groupData.location.city,
        radius: groupData.location.radius || 10
      },
      admin: profileId,
      settings: {
        maxMembers: groupData.maxMembers || 100,
        isPrivate: groupData.isPrivate || false,
        requiresApproval: groupData.requiresApproval || false,
        allowInvites: groupData.allowInvites !== false
      },
      tags: groupData.tags || []
    });

    await group.save();

    res.json({
      success: true,
      group: group,
      message: 'Location group created successfully'
    });
  } catch (error) {
    logger.error('Error creating location group:', error);
    res.status(500).json({ message: 'Error creating location group' });
  }
};
import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import gymBrosLocationService from '../services/gymBrosLocation.service.js';
import User from '../models/User.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosGroup from '../models/GymBrosGroup.js';
import logger from '../utils/logger.js';
import geocodingService from '../services/geocoding.service.js';
import Gym from '../models/Gym.js';

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

export const getGymsForMap = async (req, res) => {
  try {
    const { type, bbox, limit = 500, offset = 0, search } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (bbox) {
      // bbox: "lng1,lat1,lng2,lat2"
      const [lng1, lat1, lng2, lat2] = bbox.split(',').map(Number);
      query['location.coordinates'] = {
        $geoWithin: {
          $box: [
            [lng1, lat1],
            [lng2, lat2]
          ]
        }
      };
    }
    const gyms = await Gym.find(query).skip(Number(offset)).limit(Number(limit));
    res.json({ gyms });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gyms' });
  }
};

export const getMapUsers = async (req, res) => {
  try {
    const { north, south, east, west, maxDistance = 25 } = req.query;
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

    // Build the aggregation pipeline
    const pipeline = [
      // Match active profiles within geographic bounds
      {
        $match: {
          isActive: true,
          'location.coordinates': {
            $geoWithin: {
              $box: [
                [bounds.west, bounds.south], // Southwest corner
                [bounds.east, bounds.north]  // Northeast corner
              ]
            }
          },
          // Exclude current user
          ...(currentUserProfileId && { _id: { $ne: currentUserProfileId } })
        }
      },
      // Add distance calculation from center of bounds
      {
        $addFields: {
          distance: {
            $divide: [
              {
                $multiply: [
                  {
                    $sqrt: {
                      $add: [
                        {
                          $pow: [
                            {
                              $subtract: [
                                { $arrayElemAt: ['$location.coordinates', 1] }, // lat
                                { $divide: [{ $add: [bounds.north, bounds.south] }, 2] }
                              ]
                            },
                            2
                          ]
                        },
                        {
                          $pow: [
                            {
                              $subtract: [
                                { $arrayElemAt: ['$location.coordinates', 0] }, // lng
                                { $divide: [{ $add: [bounds.east, bounds.west] }, 2] }
                              ]
                            },
                            2
                          ]
                        }
                      ]
                    }
                  },
                  111 // Rough conversion to kilometers
                ]
              },
              1
            ]
          }
        }
      },
      // Filter by max distance if specified
      {
        $match: {
          distance: { $lte: parseFloat(maxDistance) }
        }
      },
      // Populate user data
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      // Project the fields we need for the map
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
            lat: { $arrayElemAt: ['$location.coordinates', 1] },
            lng: { $arrayElemAt: ['$location.coordinates', 0] }
          },
          distance: { $round: ['$distance', 1] },
          lastActive: 1,
          isOnline: {
            $gt: [
              '$lastActive',
              { $subtract: [new Date(), 15 * 60 * 1000] } // Online if active in last 15 minutes
            ]
          },
          profileImage: { $arrayElemAt: ['$userInfo.profileImage', 0] },
          // Include user email/phone for guest token validation
          userEmail: { $arrayElemAt: ['$userInfo.email', 0] },
          userPhone: { $arrayElemAt: ['$userInfo.phone', 0] }
        }
      },
      // Sort by distance, then by last active
      {
        $sort: {
          distance: 1,
          lastActive: -1
        }
      },
      // Limit results for performance
      {
        $limit: 100
      }
    ];

    logger.info(`Fetching map users within bounds: N${bounds.north} S${bounds.south} E${bounds.east} W${bounds.west}, maxDistance: ${maxDistance}km`);

    const users = await GymBrosProfile.aggregate(pipeline);

    // Filter out users who haven't been active recently if needed
    const activeUsers = users.filter(user => {
      // Show all users within 24 hours of last activity
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return !user.lastActive || user.lastActive > dayAgo;
    });

    logger.info(`Found ${activeUsers.length} active users in map bounds`);

    res.json({
      success: true,
      users: activeUsers,
      count: activeUsers.length,
      bounds: bounds
    });

  } catch (error) {
    logger.error('Error fetching map users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map users'
    });
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

    // Create the new gym with correct coordinates
    const newGym = await Gym.create({
      name: gymData.name,
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

    logger.info(`Created new gym: ${newGym.name} at coordinates [${gymLng}, ${gymLat}]`);

    // Calculate distance from user's current location
    let distanceFromUser = 0;
    if (gymData.userLocation && gymData.userLocation.lat && gymData.userLocation.lng) {
      const userLat = parseFloat(gymData.userLocation.lat);
      const userLng = parseFloat(gymData.userLocation.lng);
      distanceFromUser = geocodingService.calculateDistance(userLat, userLng, gymLat, gymLng);
      logger.info(`Distance from user to gym: ${distanceFromUser.toFixed(1)} miles`);
    }

    // Return the gym with proper distance calculated
    const responseGym = {
      _id: newGym._id,
      name: newGym.name,
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

export const associateWithGym = async (req, res) => {
  try {
    const { gymId, isPrimary = false, membershipType = 'member' } = req.body;
    const effectiveUser = getEffectiveUser(req);

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
    }

    if (!effectiveUser.profileId && !effectiveUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Profile required to associate with gym'
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
        message: 'GymBros profile not found'
      });
    }

    await gymBrosLocationService.associateUserWithGym(
      profileId,
      gymId,
      isPrimary,
      membershipType
    );

    res.json({
      success: true,
      message: 'Successfully associated with gym'
    });
  } catch (error) {
    logger.error('Error associating with gym:', error);
    res.status(500).json({ message: 'Error associating with gym' });
  }
};

export const getUserGyms = async (req, res) => {
  try {
    const effectiveUser = getEffectiveUser(req);
    
    if (!effectiveUser.profileId && !effectiveUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let profile;
    if (effectiveUser.profileId) {
      profile = await GymBrosProfile.findById(effectiveUser.profileId)
        .populate('primaryGym')
        .populate('gyms.gym');
    } else if (effectiveUser.userId) {
      profile = await GymBrosProfile.findOne({ userId: effectiveUser.userId })
        .populate('primaryGym')
        .populate('gyms.gym');
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const userGyms = {
      primaryGym: profile.primaryGym,
      otherGyms: profile.gyms.filter(g => g.isActive),
      totalGyms: profile.gyms.filter(g => g.isActive).length + (profile.primaryGym ? 1 : 0)
    };

    res.json({
      success: true,
      ...userGyms
    });
  } catch (error) {
    logger.error('Error getting user gyms:', error);
    res.status(500).json({ message: 'Error getting user gyms' });
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
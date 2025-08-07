
import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import gymBrosLocationService from '../services/gymBrosLocation.service.js';
import Gym from '../models/Gym.js';
import GymBrosGroup from '../models/GymBrosGroup.js';
import { handleError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Check if user has existing location data (POST version for auto-sync)
 * POST /check
 */
router.post('/check', async (req, res) => {
  try {
    const { phone, user: clientUser } = req.body;
    const effectiveUser = getEffectiveUser(req);
    
    logger.debug('POST /check - effectiveUser:', effectiveUser);
    logger.debug('POST /check - clientUser:', clientUser);
    logger.debug('POST /check - phone:', phone);
    
    // Need either authenticated user or phone number
    const user = effectiveUser.userId ? 
      await import('../models/User.js').then(m => m.default.findById(effectiveUser.userId)) : 
      clientUser;
    
    const result = await gymBrosLocationService.checkExistingLocation(user, phone || effectiveUser.phone);
    
    logger.debug('POST /check - result:', result);
    
    res.json(result);
  } catch (error) {
    logger.error('Error checking existing location (POST):', error);
    handleError(error, req, res);
  }
});

/**
 * Check if user has existing location data (GET version for legacy)
 * GET /location-check
 */
router.get('/location-check', async (req, res) => {
  try {
    const { phone } = req.query;
    const effectiveUser = getEffectiveUser(req);
    
    // Need either authenticated user or phone number
    const user = effectiveUser.userId ? await import('../models/User.js').then(m => m.default.findById(effectiveUser.userId)) : null;
    
    const result = await gymBrosLocationService.checkExistingLocation(user, phone);
    
    res.json(result);
  } catch (error) {
    logger.error('Error checking existing location:', error);
    handleError(error, req, res);
  }
});

/**
 * Update user location across all systems (preferred endpoint)
 * POST /update
 */
router.post('/update', async (req, res) => {
  try {
    const { locationData, user: clientUser, phone } = req.body;
    const effectiveUser = getEffectiveUser(req);
    
    if (!locationData) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required'
      });
    }

    // Use authenticated user or client-provided user data
    const user = effectiveUser.userId ? 
      await import('../models/User.js').then(m => m.default.findById(effectiveUser.userId)) : 
      clientUser;

    const result = await gymBrosLocationService.updateUserLocation(
      locationData, 
      user, 
      phone || (user && user.phone)
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
    handleError(error, req, res);
  }
});

/**
 * Update user location across all systems (legacy endpoint)
 * PUT /location
 */
router.put('/location', async (req, res) => {
  try {
    const { locationData, phone } = req.body;
    const effectiveUser = getEffectiveUser(req);
    
    if (!locationData) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required'
      });
    }

    // Get user if authenticated
    const user = effectiveUser.userId ? 
      await import('../models/User.js').then(m => m.default.findById(effectiveUser.userId)) : 
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
    handleError(error, req, res);
  }
});

/**
 * Get location recommendations (gyms, groups, etc.)
 * GET /gym-bros/location-recommendations
 */
router.get('/location-recommendations', async (req, res) => {
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
    handleError(error, req, res);
  }
});

/**
 * Search for gyms near a location
 * GET /gym-bros/gyms/search
 */
router.get('/gyms/search', async (req, res) => {
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

    // Debug: Log all gyms returned
    logger.info('[GYM DEBUG] /gyms/search returned gyms:', gyms.map(g => ({
      _id: g._id,
      name: g.name,
      location: g.location,
      createdBy: g.createdBy
    })));

    // Filter by search query if provided
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
    handleError(error, req, res);
  }
});

/**
 * Create a new gym
 * POST /gym-bros/gyms
 */
router.post('/gyms', optionalAuthenticate, async (req, res) => {
  try {
    const gymData = req.body;
    const effectiveUser = getEffectiveUser(req);

    // Debug logging for incoming request
    logger.info('[GYM DEBUG] /gyms route - effectiveUser:', effectiveUser);
    logger.info('[GYM DEBUG] /gyms route - gymData:', gymData);

    // Require at least one form of user identification
    if (!effectiveUser.userId && !effectiveUser.profileId && !effectiveUser.phone && !effectiveUser.email) {
      logger.warn('[GYM DEBUG] /gyms route - missing userId/profileId/phone/email');
      return res.status(401).json({
        success: false,
        message: 'Authentication, verified phone, or email required to create gym'
      });
    }

    if (!gymData.name || !gymData.location) {
      logger.warn('[GYM DEBUG] /gyms route - missing gym name or location');
      return res.status(400).json({
        success: false,
        message: 'Gym name and location are required'
      });
    }

    // Determine createdBy: userId for logged-in, phone/email for guest
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

    logger.info('[GYM DEBUG] /gyms route - createdByValue:', createdByValue, 'typeof:', typeof createdByValue, 'effectiveUser:', effectiveUser);

    // Defensive: If still no createdByValue, block
    if (!createdByValue) {
      logger.error('[GYM DEBUG] /gyms route - could not determine createdByValue');
      return res.status(400).json({
        success: false,
        message: 'Could not determine creator for gym.'
      });
    }

    const gym = await gymBrosLocationService.createOrFindGym(gymData, createdByValue);

    let responseData = {
      success: true,
      gym: gym,
      message: gym.createdBy && gym.createdBy.toString() === String(createdByValue) ? 'Gym created successfully' : 'Found existing gym'
    };

    // Add guest token for guest users (phone or email, not logged in)
    if (effectiveUser.isGuest && (effectiveUser.phone || effectiveUser.email)) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone || effectiveUser.email, effectiveUser.profileId);
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error creating gym:', error);
    handleError(error, req, res);
  }
});

/**
 * Associate user with a gym
 * POST /gym-bros/gyms/associate
 */
router.post('/gyms/associate', async (req, res) => {
  try {
    const { gymId, isPrimary = false, membershipType = 'member' } = req.body;
    const effectiveUser = getEffectiveUser(req);

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
    }

    // Need to have a profile to associate with gym
    if (!effectiveUser.profileId && !effectiveUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Profile required to associate with gym'
      });
    }

    // Get profile ID
    let profileId = effectiveUser.profileId;
    if (!profileId && effectiveUser.userId) {
      const GymBrosProfile = (await import('../models/GymBrosProfile.js')).default;
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
    handleError(error, req, res);
  }
});

/**
 * Get user's gyms
 * GET /gym-bros/gyms/my-gyms
 */
router.get('/gyms/my-gyms', async (req, res) => {
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
      const GymBrosProfile = (await import('../models/GymBrosProfile.js')).default;
      profile = await GymBrosProfile.findById(effectiveUser.profileId)
        .populate('primaryGym')
        .populate('gyms.gym');
    } else if (effectiveUser.userId) {
      const GymBrosProfile = (await import('../models/GymBrosProfile.js')).default;
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
    handleError(error, req, res);
  }
});

/**
 * Get nearby location groups
 * GET /gym-bros/groups/nearby
 */
router.get('/groups/nearby', async (req, res) => {
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
    handleError(error, req, res);
  }
});

/**
 * Create a location-based group
 * POST /gym-bros/groups/location
 */
router.post('/groups/location', async (req, res) => {
  try {
    const groupData = req.body;
    const effectiveUser = getEffectiveUser(req);

    if (!effectiveUser.profileId && !effectiveUser.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create group'
      });
    }

    // Get profile ID
    let profileId = effectiveUser.profileId;
    if (!profileId && effectiveUser.userId) {
      const GymBrosProfile = (await import('../models/GymBrosProfile.js')).default;
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
    handleError(error, req, res);
  }
});

export default router;

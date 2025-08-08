import { getEffectiveUser, generateGuestToken } from '../middleware/guestUser.middleware.js';
import gymBrosLocationService from '../services/gymBrosLocation.service.js';
import User from '../models/User.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosGroup from '../models/GymBrosGroup.js';
import logger from '../utils/logger.js';

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

    const gym = await gymBrosLocationService.createOrFindGym(gymData, createdByValue);

    let responseData = {
      success: true,
      gym: gym,
      message: gym.createdBy && gym.createdBy.toString() === String(createdByValue) ? 'Gym created successfully' : 'Found existing gym'
    };

    if (effectiveUser.isGuest && (effectiveUser.phone || effectiveUser.email)) {
      responseData.guestToken = generateGuestToken(effectiveUser.phone || effectiveUser.email, effectiveUser.profileId);
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Error creating gym:', error);
    res.status(500).json({ message: 'Error creating gym' });
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
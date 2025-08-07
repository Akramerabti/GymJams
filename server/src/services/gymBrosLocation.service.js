import locationService from './location.service.js';
import User from '../models/User.js';
import Gym from '../models/Gym.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import GymBrosGroup from '../models/GymBrosGroup.js';
import logger from '../utils/logger.js';

class GymBrosLocationService {
  
  /**
   * Check if user has existing location data in database or localStorage
   * @param {Object} user - User object
   * @param {string} phone - Phone number for guest users
   * @returns {Object} Location check result
   */
  async checkExistingLocation(user = null, phone = null) {
    try {
      let hasStoredLocation = false;
      let locationData = null;
      let source = null;

      // 1. Check authenticated user's location (highest priority for logged-in users)
      if (user && user.location) {
        const userLocation = user.location;
        if (userLocation.lat && userLocation.lng && (userLocation.city || userLocation.address)) {
          hasStoredLocation = true;
          locationData = {
            ...userLocation,
            updatedAt: user.updatedAt || user.createdAt
          };
          source = 'user_profile';
        }
      }

      // 2. Check GymBros profile location (second priority)
      if (!hasStoredLocation) {
        let gymBrosProfile = null;
        
        if (user) {
          gymBrosProfile = await GymBrosProfile.findOne({ userId: user._id });
        } else if (phone) {
          gymBrosProfile = await GymBrosProfile.findOne({ phone: phone });
        }

        if (gymBrosProfile && gymBrosProfile.location) {
          const profileLocation = gymBrosProfile.location;
          if (profileLocation.lat && profileLocation.lng && (profileLocation.address || profileLocation.city)) {
            hasStoredLocation = true;
            locationData = {
              ...profileLocation,
              updatedAt: gymBrosProfile.updatedAt || gymBrosProfile.createdAt
            };
            source = 'gymbros_profile';
          }
        }
      }

      // 3. If user exists but no location, check user model location as fallback
      if (!hasStoredLocation && user) {
        const userDoc = await User.findById(user._id);
        
        if (userDoc && userDoc.location) {
          const userLocation = userDoc.location;
          if (userLocation.lat && userLocation.lng && (userLocation.city || userLocation.address)) {
            hasStoredLocation = true;
            locationData = {
              ...userLocation,
              updatedAt: userDoc.updatedAt || userDoc.createdAt
            };
            source = 'user_model';
          }
        }
      }

      return {
        hasLocation: hasStoredLocation,
        locationData: locationData,
        source: source,
        needsLocationUpdate: !hasStoredLocation
      };

    } catch (error) {
      logger.error('Error checking existing location:', error);
      return {
        hasLocation: false,
        locationData: null,
        source: null,
        needsLocationUpdate: true
      };
    }
  }

  /**
   * Update user location across all relevant models
   * @param {Object} locationData - Location data to save
   * @param {Object} user - User object (optional)
   * @param {string} phone - Phone number for guest users
   * @param {string} profileId - GymBros profile ID
   */
  async updateUserLocation(locationData, user = null, phone = null, profileId = null) {
    try {
      const updates = [];

      // Validate location data
      const validation = locationService.validateLocationData(locationData);
      if (!validation.isValid) {
        throw new Error(`Invalid location data: ${validation.errors.join(', ')}`);
      }

      // Prepare standardized location object
      const standardLocation = {
        lat: parseFloat(locationData.lat),
        lng: parseFloat(locationData.lng),
        address: locationData.address || '',
        city: locationData.city || 'Unknown City',
        state: locationData.state || '',
        country: locationData.country || 'US',
        zipCode: locationData.zipCode || '',
        source: locationData.source || 'manual',
        accuracy: locationData.accuracy || 'medium',
        lastUpdated: new Date()
      };

      // 1. Update main User model location if authenticated
      if (user) {
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(user._id, {
          location: {
            lat: standardLocation.lat,
            lng: standardLocation.lng,
            city: standardLocation.city,
            address: standardLocation.address,
            isVisible: true,
            updatedAt: new Date()
          }
        });
        updates.push('user_profile');
        logger.info(`Updated User location for user ${user._id}`);
      }

      // 2. Update GymBros profile location
      let gymBrosProfile = null;
      
      console.log('🔄 SERVER DEBUG: Looking for GymBros profile...');
      console.log('🔄 SERVER DEBUG: profileId:', profileId);
      console.log('🔄 SERVER DEBUG: user:', user ? user._id : 'null');
      console.log('🔄 SERVER DEBUG: phone:', phone);
      
      if (profileId) {
        console.log('🔄 SERVER DEBUG: Searching by profileId:', profileId);
        gymBrosProfile = await GymBrosProfile.findById(profileId);
      } else if (user) {
        console.log('🔄 SERVER DEBUG: Searching by userId:', user._id);
        gymBrosProfile = await GymBrosProfile.findOne({ userId: user._id });
      } else if (phone) {
        console.log('🔄 SERVER DEBUG: Searching by phone:', phone);
        console.log('🔄 SERVER DEBUG: About to run GymBrosProfile.findOne({ phone: phone })');
        console.log('🔄 SERVER DEBUG: Exact search query will be: { phone: "' + phone + '" }');
        
        // First, let's see what profiles exist with any phone
        const allProfilesWithPhone = await GymBrosProfile.find({ phone: { $exists: true } }, { phone: 1, name: 1, userId: 1 });
        console.log('🔄 SERVER DEBUG: All profiles with phone numbers:', allProfilesWithPhone);
        
        // Let's also check if there are any profiles with phone numbers that might match partially
        const similarPhones = await GymBrosProfile.find({ 
          phone: { $regex: phone.slice(-4), $options: 'i' }
        }, { phone: 1, name: 1, userId: 1 });
        console.log('🔄 SERVER DEBUG: Profiles with similar phone endings:', similarPhones);
        
        // Only search for profiles that have a userId (not orphaned)
        // Guest users should not be able to update existing authenticated profiles
        if (!user) {
          console.log('🔄 SERVER DEBUG: Guest user - only looking for guest profiles or creating new ones');
          gymBrosProfile = await GymBrosProfile.findOne({ 
            phone: phone, 
            $or: [
              { userId: { $exists: false } },  // Profiles without userId (guest profiles)
              { userId: null }                  // Explicitly null userId
            ]
          });
        } else {
          console.log('🔄 SERVER DEBUG: Authenticated user - looking for their profile by phone');
          gymBrosProfile = await GymBrosProfile.findOne({ phone: phone });
        }
        
        console.log('🔄 SERVER DEBUG: findOne result for phone', phone, ':', gymBrosProfile ? {
          _id: gymBrosProfile._id,
          phone: gymBrosProfile.phone,
          name: gymBrosProfile.name,
          userId: gymBrosProfile.userId
        } : 'null');
        
        // Additional security check: If we found a profile with a different userId, don't use it
        if (gymBrosProfile && user && gymBrosProfile.userId && gymBrosProfile.userId.toString() !== user._id.toString()) {
          console.log('🚫 SERVER DEBUG: Found profile belongs to different user, ignoring');
          console.log('🚫 SERVER DEBUG: Profile userId:', gymBrosProfile.userId);
          console.log('🚫 SERVER DEBUG: Current user._id:', user._id);
          gymBrosProfile = null;
        }
        
        // Clean up orphaned profiles (profiles without userId but user is authenticated)
        if (user && !gymBrosProfile) {
          console.log('🧹 SERVER DEBUG: Checking for orphaned profiles to clean up');
          const orphanedProfile = await GymBrosProfile.findOne({ 
            phone: phone, 
            $or: [
              { userId: { $exists: false } },
              { userId: null }
            ]
          });
          
          if (orphanedProfile) {
            console.log('🧹 SERVER DEBUG: Found orphaned profile, deleting it:', {
              _id: orphanedProfile._id,
              phone: orphanedProfile.phone,
              name: orphanedProfile.name
            });
            
            // Delete the orphaned profile and its related data
            await GymBrosProfile.findByIdAndDelete(orphanedProfile._id);
            
            // Also clean up related data
            const { default: GymBrosPreference } = await import('../models/GymBrosPreference.js');
            const { default: GymBrosMatch } = await import('../models/GymBrosMatch.js');
            
            try {
              await GymBrosPreference.deleteMany({ profileId: orphanedProfile._id });
              await GymBrosMatch.updateMany(
                { profileIds: orphanedProfile._id },
                { $set: { active: false } }
              );
              console.log('🧹 SERVER DEBUG: Cleaned up orphaned profile and related data');
            } catch (cleanupError) {
              console.error('🧹 SERVER DEBUG: Error cleaning up related data:', cleanupError);
            }
          }
        }
      }

      console.log('🔄 SERVER DEBUG: Found gymBrosProfile:', gymBrosProfile ? gymBrosProfile._id : 'null');

      if (gymBrosProfile) {
        console.log('🔄 SERVER DEBUG: Updating GymBros profile location...');
        console.log('🔄 SERVER DEBUG: Profile before update:', gymBrosProfile.location);
        console.log('🔄 SERVER DEBUG: New standardLocation:', standardLocation);
        
        try {
          // Use findByIdAndUpdate to avoid version conflicts from concurrent requests
          const updatedProfile = await GymBrosProfile.findByIdAndUpdate(
            gymBrosProfile._id,
            { 
              location: standardLocation,
              lastActive: new Date()
            },
            { 
              new: true, // Return updated document
              runValidators: true // Ensure validation runs
            }
          );
          
          if (updatedProfile) {
            updates.push('gymbros_profile');
            console.log('✅ SERVER DEBUG: GymBros profile location updated successfully');
            logger.info(`Updated GymBros profile location for profile ${updatedProfile._id}`);
          } else {
            console.log('❌ SERVER DEBUG: Profile not found during update');
          }
        } catch (saveError) {
          console.error('❌ SERVER DEBUG: Failed to save GymBros profile:', saveError);
          logger.error('Failed to save GymBros profile location:', saveError);
          // Continue with other updates even if this fails
        }

        // 3. Find and suggest nearby gyms
        const nearbyGyms = await this.findNearbyGyms(standardLocation.lat, standardLocation.lng);
        
        // 4. Auto-join relevant location-based groups
        await this.autoJoinLocationGroups(gymBrosProfile._id, standardLocation);

        return {
          success: true,
          updates: updates,
          location: standardLocation,
          nearbyGyms: nearbyGyms.slice(0, 5), // Return top 5 nearby gyms
          message: 'Location updated successfully'
        };
      } else {
        console.log('❌ SERVER DEBUG: No GymBros profile found to update');
      }

      return {
        success: true,
        updates: updates,
        location: standardLocation,
        message: 'Location updated successfully'
      };

    } catch (error) {
      logger.error('Error updating user location:', error);
      throw error;
    }
  }

  /**
   * Find nearby gyms based on coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Array} Nearby gyms
   */
  async findNearbyGyms(lat, lng, radiusMiles = 25) {
    try {
      // Try to use the geographic aggregation pipeline first
      let nearbyGyms = await Gym.findNearby(lat, lng, radiusMiles);
      
      // If no results or aggregation fails, fall back to manual calculation
      if (!nearbyGyms || nearbyGyms.length === 0) {
        const allGyms = await Gym.find({ isActive: true }).limit(100);
        
        nearbyGyms = allGyms
          .map(gym => {
            const distance = locationService.calculateDistance(
              lat, lng, 
              gym.location.lat, gym.location.lng
            );
            return {
              ...gym.toObject(),
              distance: distance,
              distanceMiles: distance
            };
          })
          .filter(gym => gym.distance <= radiusMiles)
          .sort((a, b) => a.distance - b.distance);
      }

      return nearbyGyms;
    } catch (error) {
      logger.error('Error finding nearby gyms:', error);
      return [];
    }
  }

  /**
   * Auto-join user to relevant location-based groups
   * @param {string} profileId - GymBros profile ID
   * @param {Object} locationData - User location data
   */
  async autoJoinLocationGroups(profileId, locationData) {
    try {
      // Find nearby location-based groups
      const nearbyGroups = await GymBrosGroup.findNearbyLocationGroups(
        locationData.lat, 
        locationData.lng, 
        25
      );

      const joinedGroups = [];

      for (const group of nearbyGroups) {
        // Skip if already a member
        if (group.isMember(profileId)) continue;

        // Skip private groups or those requiring approval
        if (group.settings.isPrivate || group.settings.requiresApproval) continue;

        // Skip if group is full
        if (group.memberCount >= group.settings.maxMembers) continue;

        // Auto-join public location groups
        group.addMember(profileId);
        await group.save();
        joinedGroups.push(group);

        // Limit auto-joins to prevent spam
        if (joinedGroups.length >= 3) break;
      }

      logger.info(`Auto-joined ${joinedGroups.length} groups for profile ${profileId}`);
      return joinedGroups;

    } catch (error) {
      logger.error('Error auto-joining location groups:', error);
      return [];
    }
  }

  /**
   * Get location recommendations for user based on current location
   * @param {Object} currentLocation - User's current location
   * @returns {Object} Location recommendations
   */
  async getLocationRecommendations(currentLocation) {
    try {
      const recommendations = {
        nearbyGyms: [],
        locationGroups: [],
        gymGroups: [],
        suggestedAreas: []
      };

      if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
        return recommendations;
      }

      // Get nearby gyms
      recommendations.nearbyGyms = await this.findNearbyGyms(
        currentLocation.lat, 
        currentLocation.lng, 
        15
      );

      // Get nearby location-based groups
      recommendations.locationGroups = await GymBrosGroup.findNearbyLocationGroups(
        currentLocation.lat,
        currentLocation.lng,
        25
      );

      // Get gym-based groups from nearby gyms
      const nearbyGymIds = recommendations.nearbyGyms.map(gym => gym._id);
      if (nearbyGymIds.length > 0) {
        recommendations.gymGroups = await GymBrosGroup.find({
          groupType: 'gym',
          gym: { $in: nearbyGymIds },
          isActive: true
        }).populate('gym', 'name location')
          .populate('admin', 'name profileImage')
          .sort({ memberCount: -1 })
          .limit(10);
      }

      return recommendations;

    } catch (error) {
      logger.error('Error getting location recommendations:', error);
      return {
        nearbyGyms: [],
        locationGroups: [],
        gymGroups: [],
        suggestedAreas: []
      };
    }
  }

  /**
   * Create or find a gym entry
   * @param {Object} gymData - Gym information
   * @param {string} createdByUserId - User creating the gym entry
   * @returns {Object} Gym object
   */
  async createOrFindGym(gymData, createdByUserId) {
    try {
      // First, try to find existing gym nearby (within 0.1 miles)
      const existingGyms = await this.findNearbyGyms(
        gymData.location.lat,
        gymData.location.lng,
        0.1
      );

      // Look for exact or very close match
      const exactMatch = existingGyms.find(gym => 
        gym.name.toLowerCase().trim() === gymData.name.toLowerCase().trim() ||
        gym.distanceMiles < 0.05 // Within ~250 feet
      );

      if (exactMatch) {
        logger.info(`Found existing gym: ${exactMatch.name}`);
        return exactMatch;
      }

      // Create new gym
      const newGym = new Gym({
        name: gymData.name,
        location: {
          lat: gymData.location.lat,
          lng: gymData.location.lng,
          address: gymData.location.address,
          city: gymData.location.city || 'Unknown City',
          state: gymData.location.state || '',
          country: gymData.location.country || 'US',
          zipCode: gymData.location.zipCode || ''
        },
        description: gymData.description || '',
        amenities: gymData.amenities || [],
        gymChain: gymData.gymChain || '',
        website: gymData.website || '',
        phone: gymData.phone || '',
        hours: gymData.hours || {},
        createdBy: createdByUserId,
        isVerified: false // Require manual verification
      });

      await newGym.save();
      logger.info(`Created new gym: ${newGym.name}`);
      return newGym;

    } catch (error) {
      logger.error('Error creating/finding gym:', error);
      throw error;
    }
  }

  /**
   * Associate user with a gym
   * @param {string} profileId - GymBros profile ID
   * @param {string} gymId - Gym ID
   * @param {boolean} isPrimary - Set as primary gym
   * @param {string} membershipType - Type of membership
   */
  async associateUserWithGym(profileId, gymId, isPrimary = false, membershipType = 'member') {
    try {
      const profile = await GymBrosProfile.findById(profileId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      const gym = await Gym.findById(gymId);
      if (!gym) {
        throw new Error('Gym not found');
      }

      // Check if already associated
      const existingAssociation = profile.gyms.find(g => 
        g.gym.toString() === gymId.toString()
      );

      if (existingAssociation) {
        // Update existing association
        existingAssociation.membershipType = membershipType;
        existingAssociation.isActive = true;
      } else {
        // Add new association
        profile.gyms.push({
          gym: gymId,
          membershipType: membershipType,
          isActive: true,
          addedAt: new Date()
        });
      }

      // Set as primary if requested
      if (isPrimary) {
        profile.primaryGym = gymId;
      }

      await profile.save();

      // Update gym member count
      await this.updateGymMemberCount(gymId);

      logger.info(`Associated profile ${profileId} with gym ${gymId}`);
      return true;

    } catch (error) {
      logger.error('Error associating user with gym:', error);
      throw error;
    }
  }

  /**
   * Update gym member count
   * @param {string} gymId - Gym ID
   */
  async updateGymMemberCount(gymId) {
    try {
      const memberCount = await GymBrosProfile.countDocuments({
        $or: [
          { primaryGym: gymId },
          { 'gyms.gym': gymId, 'gyms.isActive': true }
        ]
      });

      await Gym.findByIdAndUpdate(gymId, { memberCount: memberCount });
      
    } catch (error) {
      logger.error('Error updating gym member count:', error);
    }
  }

  /**
   * Get smart location for setup step
   * @param {Object} user - User object
   * @param {string} phone - Phone number for guest users
   * @returns {Object} Location setup result
   */
  async getSmartLocationForSetup(user = null, phone = null) {
    try {
      // 1. Check for existing location
      const existingLocation = await this.checkExistingLocation(user, phone);
      
      if (existingLocation.hasLocation) {
        return {
          skipLocationStep: true,
          existingLocation: existingLocation.locationData,
          source: existingLocation.source,
          message: 'Using existing location data'
        };
      }

      // 2. If no existing location, setup is needed
      return {
        skipLocationStep: false,
        existingLocation: null,
        source: null,
        message: 'Location setup required'
      };

    } catch (error) {
      logger.error('Error getting smart location for setup:', error);
      return {
        skipLocationStep: false,
        existingLocation: null,
        source: null,
        message: 'Error checking location, setup required'
      };
    }
  }
}

export default new GymBrosLocationService();

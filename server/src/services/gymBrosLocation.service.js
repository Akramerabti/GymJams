import locationService from './location.service.js';
import geocodingService from './geocoding.service.js'; // Import geocoding service
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
   * Enhance location data with full address if missing
   * @param {Object} locationData - Raw location data with lat/lng
   * @returns {Object} Enhanced location data with address
   */
  async enhanceLocationWithAddress(locationData) {
    try {
      // If we already have a complete address, return as is
      if (locationData.address && locationData.address.trim() && locationData.address !== '') {
        return locationData;
      }

      // If we have coordinates, geocode to get the full address
      if (locationData.lat && locationData.lng) {
        console.log('🔍 Geocoding coordinates to get full address:', { lat: locationData.lat, lng: locationData.lng });
        
        const geocodedResult = await geocodingService.reverseGeocode(locationData.lat, locationData.lng);
        
        if (geocodedResult) {
          console.log('✅ Geocoding successful:', geocodedResult);
          
          // Build a comprehensive location object
          const enhancedLocation = {
            ...locationData,
            address: geocodedResult.address || geocodedResult.display_name || `${locationData.city || 'Unknown City'}`,
            city: geocodedResult.city || locationData.city || 'Unknown City',
            state: geocodedResult.state || locationData.state || '',
            country: geocodedResult.country || locationData.country || 'US',
            zipCode: geocodedResult.postcode || locationData.zipCode || ''
          };
          
          console.log('🚀 Enhanced location data:', enhancedLocation);
          return enhancedLocation;
        } else {
          console.warn('❌ Geocoding failed, using fallback address');
          // Fallback: use city as address if geocoding fails
          return {
            ...locationData,
            address: locationData.city || 'Unknown Location',
            city: locationData.city || 'Unknown City',
            state: locationData.state || '',
            country: locationData.country || 'US',
            zipCode: locationData.zipCode || ''
          };
        }
      }

      // Final fallback if no coordinates
      console.warn('⚠️ No coordinates available for geocoding, using minimal address');
      return {
        ...locationData,
        address: locationData.city || 'Unknown Location',
        city: locationData.city || 'Unknown City',
        state: locationData.state || '',
        country: locationData.country || 'US',
        zipCode: locationData.zipCode || ''
      };

    } catch (error) {
      logger.error('Error enhancing location with address:', error);
      // Return with fallback address to prevent validation errors
      return {
        ...locationData,
        address: locationData.city || locationData.address || 'Unknown Location',
        city: locationData.city || 'Unknown City',
        state: locationData.state || '',
        country: locationData.country || 'US',
        zipCode: locationData.zipCode || ''
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

      // STEP 1: Enhance location data with full address using geocoding
      console.log('🔄 SERVER DEBUG: Original location data:', locationData);
      const enhancedLocationData = await this.enhanceLocationWithAddress(locationData);
      console.log('🔄 SERVER DEBUG: Enhanced location data:', enhancedLocationData);

      // STEP 2: Prepare standardized location object
      const standardLocation = {
        lat: parseFloat(enhancedLocationData.lat),
        lng: parseFloat(enhancedLocationData.lng),
        address: enhancedLocationData.address || enhancedLocationData.city || 'Unknown Location',
        city: enhancedLocationData.city || 'Unknown City',
        state: enhancedLocationData.state || '',
        country: enhancedLocationData.country || 'US',
        zipCode: enhancedLocationData.zipCode || '',
        source: enhancedLocationData.source || 'manual',
        accuracy: enhancedLocationData.accuracy || 'medium',
        lastUpdated: new Date()
      };

      console.log('🔄 SERVER DEBUG: Final standard location:', standardLocation);

      // 3. Update main User model location if authenticated
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

      // 4. Update GymBros profile location
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
        
        // DEBUG: Let's see exactly what query is being run
        console.log('🔄 SERVER DEBUG: Exact phone being searched:', JSON.stringify(phone));
        console.log('🔄 SERVER DEBUG: Phone type:', typeof phone);
        console.log('🔄 SERVER DEBUG: Phone length:', phone.length);
        
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

        // 5. Find and suggest nearby gyms
        const nearbyGyms = await this.findNearbyGyms(standardLocation.lat, standardLocation.lng);
        
        // 6. Auto-join relevant location-based groups
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

  // ... rest of the methods remain the same ...
  
  /**
   * Find nearby gyms based on coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Array} Nearby gyms
   */
  async findNearbyGyms(lat, lng, radiusMiles = 25) {
  try {
    // Use the static method from the Gym model
    const gyms = await Gym.findNearby(lat, lng, radiusMiles);
    
    // Transform the results to include backward-compatible fields
    return gyms.map(gym => ({
      ...gym,
      _id: gym._id,
      name: gym.name,
      location: {
        lat: gym.location.coordinates[1],
        lng: gym.location.coordinates[0],
        address: gym.location.address,
        city: gym.location.city,
        state: gym.location.state,
        country: gym.location.country,
        zipCode: gym.location.zipCode
      },
      distanceMiles: gym.distanceMiles,
      amenities: gym.amenities,
      gymChain: gym.gymChain,
      memberCount: gym.memberCount,
      rating: gym.rating,
      isVerified: gym.isVerified
    }));
  } catch (error) {
    logger.error('Error finding nearby gyms:', error);
    // Fallback to finding gyms without distance calculation
    try {
      const gyms = await Gym.find({ isActive: true }).limit(20);
      return gyms.map(gym => ({
        _id: gym._id,
        name: gym.name,
        location: {
          lat: gym.location?.coordinates?.[1] || 0,
          lng: gym.location?.coordinates?.[0] || 0,
          address: gym.location?.address || '',
          city: gym.location?.city || '',
          state: gym.location?.state || '',
          country: gym.location?.country || 'US',
          zipCode: gym.location?.zipCode || ''
        },
        distanceMiles: null,
        amenities: gym.amenities,
        gymChain: gym.gymChain,
        memberCount: gym.memberCount,
        rating: gym.rating,
        isVerified: gym.isVerified
      }));
    } catch (fallbackError) {
      logger.error('Error in fallback gym search:', fallbackError);
      return [];
    }
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

  async createOrFindGym(gymData, createdBy) {
  try {
    // Validate required fields
    if (!gymData.name || !gymData.location) {
      throw new Error('Gym name and location are required');
    }
    
    const { lat, lng } = gymData.location;
    if (!lat || !lng) {
      throw new Error('Valid latitude and longitude are required');
    }
    
    // Check if gym already exists at this location (within 100 meters)
    const nearbyGyms = await Gym.findNearby(lat, lng, 0.062); // ~100 meters in miles
    
    const existingGym = nearbyGyms.find(gym => 
      gym.name.toLowerCase() === gymData.name.toLowerCase()
    );
    
    if (existingGym) {
      logger.info(`Found existing gym: ${existingGym.name}`);
      // Transform to backward-compatible format
      return {
        ...existingGym,
        location: {
          lat: existingGym.location.coordinates[1],
          lng: existingGym.location.coordinates[0],
          address: existingGym.location.address,
          city: existingGym.location.city,
          state: existingGym.location.state,
          country: existingGym.location.country,
          zipCode: existingGym.location.zipCode
        }
      };
    }
    
    // Create new gym with GeoJSON format
    const newGym = new Gym({
      name: gymData.name,
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON uses [lng, lat] order
        address: gymData.location.address || '',
        city: gymData.location.city || '',
        state: gymData.location.state || '',
        country: gymData.location.country || 'US',
        zipCode: gymData.location.zipCode || ''
      },
      description: gymData.description,
      amenities: gymData.amenities || [],
      gymChain: gymData.gymChain,
      website: gymData.website,
      phone: gymData.phone,
      createdBy: createdBy,
      isActive: true
    });
    
    await newGym.save();
    logger.info(`Created new gym: ${newGym.name}`);
    
    // Return in backward-compatible format
    return {
      _id: newGym._id,
      name: newGym.name,
      location: {
        lat: lat,
        lng: lng,
        address: newGym.location.address,
        city: newGym.location.city,
        state: newGym.location.state,
        country: newGym.location.country,
        zipCode: newGym.location.zipCode
      },
      description: newGym.description,
      amenities: newGym.amenities,
      gymChain: newGym.gymChain,
      website: newGym.website,
      phone: newGym.phone,
      createdBy: newGym.createdBy,
      isActive: newGym.isActive,
      createdAt: newGym.createdAt
    };
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

  async migrateExistingGyms() {
  try {
    logger.info('Starting gym migration to GeoJSON format...');
    await Gym.migrateToGeoJSON();
    logger.info('Gym migration completed successfully');
  } catch (error) {
    logger.error('Error migrating gyms:', error);
    throw error;
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
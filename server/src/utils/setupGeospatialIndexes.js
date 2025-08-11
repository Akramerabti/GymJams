// server/src/utils/setupGeospatialIndexes.js
/**
 * MongoDB Index Setup Script - Fixed Version
 * This script creates the necessary geospatial indexes for the GymJams application
 * Handles existing indexes gracefully
 */

import mongoose from 'mongoose';
import Gym from '../models/Gym.js';
import GymBrosProfile from '../models/GymBrosProfile.js';
import logger from './logger.js';

const setupGeospatialIndexes = async () => {
  try {
    console.log('🗂️ Setting up geospatial indexes...');

    // Helper function to safely create index
    const safeCreateIndex = async (collection, indexSpec, options) => {
      try {
        await collection.createIndex(indexSpec, options);
        console.log(`✅ Created index: ${options.name}`);
        return true;
      } catch (error) {
        if (error.code === 85) {
          // Index already exists with different name - this is OK
          console.log(`ℹ️ Index already exists for ${JSON.stringify(indexSpec)} (name conflict ignored)`);
          return true;
        } else if (error.code === 86) {
          // Index already exists with same name - this is OK
          console.log(`ℹ️ Index ${options.name} already exists`);
          return true;
        } else {
          console.error(`❌ Failed to create index ${options.name}:`, error.message);
          return false;
        }
      }
    };

    // Check existing indexes first
    console.log('📋 Checking existing indexes...');
    
    // Get existing Gym indexes
    const gymIndexes = await Gym.collection.indexes();
    console.log('Current Gym collection indexes:');
    gymIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if we already have a location 2dsphere index
    const hasLocationIndex = gymIndexes.some(index => 
      index.key.location === '2dsphere' || 
      (index.key.location && typeof index.key.location === 'object')
    );

    if (hasLocationIndex) {
      console.log('✅ Gym location 2dsphere index already exists');
    } else {
      // Create 2dsphere index for gym locations
      await safeCreateIndex(
        Gym.collection,
        { location: "2dsphere" },
        { 
          name: "gym_location_2dsphere",
          background: true 
        }
      );
    }

    // Check for compound index
    const hasCompoundIndex = gymIndexes.some(index => 
      index.key.isActive && (index.key.location === '2dsphere' || index.key.location)
    );

    if (hasCompoundIndex) {
      console.log('✅ Gym compound index (isActive + location) already exists');
    } else {
      // Create compound index for active gyms with location
      await safeCreateIndex(
        Gym.collection,
        { isActive: 1, location: "2dsphere" },
        { 
          name: "gym_active_location_compound",
          background: true 
        }
      );
    }

    // Setup GymBrosProfile location indexes
    console.log('📋 Setting up GymBrosProfile location indexes...');
    
    const profileIndexes = await GymBrosProfile.collection.indexes();
    console.log('Current GymBrosProfile collection indexes:');
    profileIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if we already have a location 2dsphere index for profiles
    const hasProfileLocationIndex = profileIndexes.some(index => 
      (index.key['location.lat'] && index.key['location.lng']) ||
      (index.key.location === '2dsphere')
    );

    if (hasProfileLocationIndex) {
      console.log('✅ GymBrosProfile location index already exists');
    } else {
      // Create 2d index for profile locations (lat/lng format)
      await safeCreateIndex(
        GymBrosProfile.collection,
        { "location.lat": 1, "location.lng": 1 },
        { 
          name: "profile_location_2d",
          background: true 
        }
      );
    }

    // Verify final state
    console.log('🔍 Final verification...');
    const finalGymIndexes = await Gym.collection.indexes();
    const finalProfileIndexes = await GymBrosProfile.collection.indexes();

    console.log('📋 Final Gym indexes:');
    finalGymIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('📋 Final GymBrosProfile indexes:');
    finalProfileIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('🎉 Geospatial indexes setup completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error setting up geospatial indexes:', error);
    
    // Don't throw the error - log it and continue
    // This prevents the app from crashing on startup
    console.warn('⚠️ Continuing with existing indexes...');
    return false;
  }
};

/**
 * Clean up problematic indexes (use with caution)
 */
export const cleanupIndexes = async () => {
  try {
    console.log('🧹 Cleaning up problematic indexes...');
    
    // List all indexes first
    const gymIndexes = await Gym.collection.indexes();
    console.log('Current Gym indexes before cleanup:');
    gymIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop only the problematic location indexes (not _id_ or other important ones)
    const indexesToDrop = gymIndexes
      .filter(index => 
        index.name !== '_id_' && // Never drop the _id index
        (index.key.location === '2dsphere' || index.name.includes('location'))
      )
      .map(index => index.name);

    for (const indexName of indexesToDrop) {
      try {
        await Gym.collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`ℹ️ Could not drop index ${indexName}: ${error.message}`);
      }
    }

    console.log('🧹 Index cleanup completed');
    
    // Now try to set up indexes again
    return await setupGeospatialIndexes();

  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
    return false;
  }
};

/**
 * Check index health and provide recommendations
 */
export const checkIndexHealth = async () => {
  try {
    console.log('🏥 Checking index health...');
    
    const gymIndexes = await Gym.collection.indexes();
    const profileIndexes = await GymBrosProfile.collection.indexes();
    
    const issues = [];
    const recommendations = [];

    // Check for duplicate location indexes
    const locationIndexes = gymIndexes.filter(index => 
      index.key.location === '2dsphere' || index.name.includes('location')
    );
    
    if (locationIndexes.length > 2) {
      issues.push(`Found ${locationIndexes.length} location indexes - may have duplicates`);
      recommendations.push('Consider running cleanupIndexes() to remove duplicates');
    }

    // Check for missing essential indexes
    const hasLocationIndex = gymIndexes.some(index => index.key.location === '2dsphere');
    if (!hasLocationIndex) {
      issues.push('Missing geospatial index on Gym.location');
      recommendations.push('Run setupGeospatialIndexes() to create missing indexes');
    }

    // Report results
    if (issues.length === 0) {
      console.log('✅ All indexes look healthy!');
    } else {
      console.log('⚠️ Index issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    return { issues, recommendations };

  } catch (error) {
    console.error('❌ Error checking index health:', error);
    return { issues: ['Could not check index health'], recommendations: [] };
  }
};

export default setupGeospatialIndexes;
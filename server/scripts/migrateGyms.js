// Migration script: server/scripts/migrateGyms.js
// Run this once to fix the gym collection indexes and data

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gym from '../src/models/Gym.js';
import logger from '../src/utils/logger.js';

dotenv.config();

async function migrateGyms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymjams');
    logger.info('Connected to MongoDB');
    
    // Step 1: Drop all existing indexes on the gyms collection
    logger.info('Dropping existing indexes...');
    try {
      await mongoose.connection.db.collection('gyms').dropIndexes();
      logger.info('All indexes dropped');
    } catch (error) {
      logger.warn('Error dropping indexes (may not exist):', error.message);
    }
    
    // Step 2: Migrate existing gym documents to GeoJSON format
    logger.info('Migrating gym documents to GeoJSON format...');
    
    const gyms = await Gym.find({});
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const gym of gyms) {
      try {
        let needsUpdate = false;
        let lat, lng;
        
        // Check if already in GeoJSON format
        if (gym.location?.type === 'Point' && gym.location?.coordinates?.length === 2) {
          skippedCount++;
          continue;
        }
        
        // Try to find lat/lng from various possible locations
        if (gym.location && typeof gym.location === 'object') {
          if (typeof gym.location.lat === 'number' && typeof gym.location.lng === 'number') {
            lat = gym.location.lat;
            lng = gym.location.lng;
            needsUpdate = true;
          }
        }
        
        // Fallback to root-level lat/lng if they exist
        if (!needsUpdate && gym.lat && gym.lng) {
          lat = gym.lat;
          lng = gym.lng;
          needsUpdate = true;
        }
        
        if (needsUpdate && lat && lng) {
          // Update to GeoJSON format
          await Gym.updateOne(
            { _id: gym._id },
            {
              $set: {
                location: {
                  type: 'Point',
                  coordinates: [lng, lat], // [longitude, latitude]
                  address: gym.location?.address || '',
                  city: gym.location?.city || '',
                  state: gym.location?.state || '',
                  country: gym.location?.country || 'US',
                  zipCode: gym.location?.zipCode || ''
                }
              },
              $unset: {
                lat: "",
                lng: "",
                'location.lat': "",
                'location.lng': ""
              }
            }
          );
          migratedCount++;
          logger.info(`Migrated gym: ${gym.name} (${gym._id})`);
        } else {
          logger.warn(`Could not migrate gym ${gym.name} (${gym._id}) - no valid coordinates found`);
          skippedCount++;
        }
      } catch (error) {
        logger.error(`Error migrating gym ${gym._id}:`, error);
        skippedCount++;
      }
    }
    
    logger.info(`Migration complete: ${migratedCount} gyms migrated, ${skippedCount} skipped`);
    
    // Step 3: Create the correct 2dsphere index
    logger.info('Creating new 2dsphere index...');
    await mongoose.connection.db.collection('gyms').createIndex(
      { location: '2dsphere' },
      { name: 'location_2dsphere' }
    );
    logger.info('2dsphere index created');
    
    // Step 4: Create other necessary indexes
    logger.info('Creating additional indexes...');
    await mongoose.connection.db.collection('gyms').createIndex({ 'location.city': 1 });
    await mongoose.connection.db.collection('gyms').createIndex({ name: 'text', description: 'text' });
    await mongoose.connection.db.collection('gyms').createIndex({ gymChain: 1 });
    await mongoose.connection.db.collection('gyms').createIndex({ isActive: 1, isVerified: 1 });
    logger.info('All indexes created successfully');
    
    // Step 5: Verify the migration
    logger.info('Verifying migration...');
    const testGym = await Gym.findOne({ 'location.type': 'Point' });
    if (testGym) {
      logger.info('✓ Found gym with GeoJSON format');
      
      // Test the findNearby method
      if (testGym.location?.coordinates?.length === 2) {
        const [lng, lat] = testGym.location.coordinates;
        const nearbyGyms = await Gym.findNearby(lat, lng, 10);
        logger.info(`✓ findNearby test successful - found ${nearbyGyms.length} gyms within 10 miles`);
      }
    } else {
      logger.warn('⚠ No gyms found with GeoJSON format');
    }
    
    logger.info('Migration completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
}

// Run the migration
migrateGyms();
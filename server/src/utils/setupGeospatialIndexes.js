/**
 * MongoDB Index Setup Script
 * This script creates the necessary geospatial indexes for the GymJams application
 */

import mongoose from 'mongoose';
import Gym from '../models/Gym.js';

const setupGeospatialIndexes = async () => {
  try {
    console.log('🗂️ Setting up geospatial indexes...');

    // Create 2dsphere index for gym locations
    await Gym.collection.createIndex(
      { location: "2dsphere" },
      { 
        name: "gym_location_2dsphere",
        background: true 
      }
    );
    console.log('✅ Created 2dsphere index for Gym.location');

    // Create compound index for active gyms with location
    await Gym.collection.createIndex(
      { isActive: 1, location: "2dsphere" },
      { 
        name: "gym_active_location_compound",
        background: true 
      }
    );
    console.log('✅ Created compound index for Gym.isActive + location');

    // List all indexes to verify
    const indexes = await Gym.collection.indexes();
    console.log('📋 Current Gym collection indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('🎉 Geospatial indexes setup completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error setting up geospatial indexes:', error);
    throw error;
  }
};

export default setupGeospatialIndexes;

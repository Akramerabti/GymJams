/**
 * Run this script to setup required MongoDB indexes
 * Usage: node setup-indexes.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import setupGeospatialIndexes from './src/utils/setupGeospatialIndexes.js';

// Load environment variables
dotenv.config();

const setupIndexes = async () => {
  try {
    console.log('🚀 Starting MongoDB index setup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymjams', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Setup geospatial indexes
    await setupGeospatialIndexes();

    console.log('🎉 All indexes setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during index setup:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run the setup
setupIndexes();

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

import gymBrosLocationService from './services/gymBrosLocation.service.js';

async function testLocationUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('=== Testing Location Update ===');
    
    // Test with the phone number from the guest token
    const testPhone = '+15149127544';
    const testLocation = {
      lat: 45.5052971,
      lng: -73.6266905,
      city: 'Montreal',
      address: '',
      source: 'test',
      accuracy: 'high'
    };
    
    console.log('Testing location update for phone:', testPhone);
    console.log('Test location:', testLocation);
    
    const result = await gymBrosLocationService.updateUserLocation(
      testLocation,
      null, // no user (guest)
      testPhone,
      null // no profileId
    );
    
    console.log('Update result:', result);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Disconnected from MongoDB');
    process.exit(0);
  }
}

testLocationUpdate();

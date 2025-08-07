import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

import GymBrosProfile from './models/GymBrosProfile.js';

async function debugPhoneSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=== DEBUG: Phone Number Search ===');
    
    // Search for the exact phone from the logs
    const targetPhone = '+15149127544';
    console.log('Searching for phone:', targetPhone);
    
    const exactMatch = await GymBrosProfile.findOne({ phone: targetPhone });
    console.log('Exact match result:', exactMatch ? {
      _id: exactMatch._id,
      name: exactMatch.name,
      phone: exactMatch.phone,
      userId: exactMatch.userId
    } : 'null');
    
    // Search for Stella's profile specifically
    const stellaProfile = await GymBrosProfile.findById('67dba3134e44e4c37b84da8d');
    console.log('Stella profile:', stellaProfile ? {
      _id: stellaProfile._id,
      name: stellaProfile.name,
      phone: stellaProfile.phone,
      userId: stellaProfile.userId
    } : 'null');
    
    // Get all profiles with phone numbers
    const allProfiles = await GymBrosProfile.find({ phone: { $exists: true } }, { 
      _id: 1, name: 1, phone: 1, userId: 1 
    });
    console.log('All profiles with phones:', allProfiles);
    
    // Test the guest user search specifically
    console.log('\n=== Testing Guest User Search ===');
    const guestSearch = await GymBrosProfile.findOne({ 
      phone: targetPhone, 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    console.log('Guest search result:', guestSearch ? {
      _id: guestSearch._id,
      name: guestSearch.name,
      phone: guestSearch.phone,
      userId: guestSearch.userId
    } : 'null');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugPhoneSearch();

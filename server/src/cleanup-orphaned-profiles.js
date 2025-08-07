#!/usr/bin/env node
/**
 * Cleanup script for orphaned GymBros profiles
 * Run this to clean up profiles that have no userId (orphaned after user account deletion)
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
const envPath = path.join(__dirname, '../.env');
config({ path: envPath });

console.log('Environment loaded from:', envPath);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
  process.exit(1);
}

// Import models
import GymBrosProfile from './models/GymBrosProfile.js';
import GymBrosPreference from './models/GymBrosPreference.js';
import GymBrosMatch from './models/GymBrosMatch.js';

async function cleanupOrphanedProfiles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find orphaned profiles (no userId or null userId)
    const orphanedProfiles = await GymBrosProfile.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`Found ${orphanedProfiles.length} orphaned profiles to clean up:`);
    
    for (const profile of orphanedProfiles) {
      console.log(`- Profile ${profile._id}: ${profile.name} (${profile.phone})`);
    }

    if (orphanedProfiles.length === 0) {
      console.log('✅ No orphaned profiles found. Database is clean!');
      return;
    }

    // Ask for confirmation
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`\nDo you want to delete these ${orphanedProfiles.length} orphaned profiles? (yes/no): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Cleanup cancelled');
      return;
    }

    // Delete orphaned profiles and related data
    let deletedCount = 0;
    for (const profile of orphanedProfiles) {
      try {
        // Delete the profile
        await GymBrosProfile.findByIdAndDelete(profile._id);
        
        // Delete related preferences
        await GymBrosPreference.deleteMany({ profileId: profile._id });
        
        // Deactivate related matches
        await GymBrosMatch.updateMany(
          { profileIds: profile._id },
          { $set: { active: false } }
        );
        
        console.log(`✅ Deleted profile ${profile._id}: ${profile.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error deleting profile ${profile._id}:`, error);
      }
    }

    console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount} orphaned profiles.`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanupOrphanedProfiles();

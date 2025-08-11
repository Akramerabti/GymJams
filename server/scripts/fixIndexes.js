// server/src/scripts/fixIndexes.js
/**
 * Comprehensive fix script for MongoDB index conflicts and duplicates
 * Fixes both geospatial index conflicts AND schema index duplications
 */

import mongoose from 'mongoose';
import 'dotenv/config';

// Import models AFTER fixing the warnings to prevent schema issues
let Gym, GymBrosProfile;

async function fixIndexes() {
  try {
    console.log('🔧 Fixing index conflicts and duplications...');
    
    // Connect to MongoDB first
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Now import models to check their current state
    const gymModule = await import('../src/models/Gym.js');
    const profileModule = await import('../src/models/GymBrosProfile.js');
    Gym = gymModule.default;
    GymBrosProfile = profileModule.default;

    console.log('\n📋 STEP 1: Fixing Gym collection indexes...');
    
    // Check current Gym indexes
    const gymIndexes = await Gym.collection.indexes();
    console.log('Current Gym indexes:');
    gymIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Find and drop problematic location indexes
    const locationIndexes = gymIndexes.filter(index => 
      index.name !== '_id_' && // Never touch the _id index
      (index.key.location === '2dsphere' || index.name.includes('location'))
    );

    if (locationIndexes.length > 0) {
      console.log(`\n🗑️ Dropping ${locationIndexes.length} existing location indexes...`);
      
      for (const index of locationIndexes) {
        try {
          await Gym.collection.dropIndex(index.name);
          console.log(`✅ Dropped: ${index.name}`);
        } catch (error) {
          console.log(`ℹ️ Could not drop ${index.name}: ${error.message}`);
        }
      }
    }

    // Create proper Gym indexes
    console.log('\n🏗️ Creating proper Gym indexes...');

    try {
      await Gym.collection.createIndex(
        { location: "2dsphere" },
        { 
          name: "gym_location_2dsphere",
          background: true 
        }
      );
      console.log('✅ Created gym_location_2dsphere index');
    } catch (error) {
      console.log(`ℹ️ Gym location index: ${error.message}`);
    }

    try {
      await Gym.collection.createIndex(
        { isActive: 1, location: "2dsphere" },
        { 
          name: "gym_active_location_compound",
          background: true 
        }
      );
      console.log('✅ Created gym_active_location_compound index');
    } catch (error) {
      console.log(`ℹ️ Gym compound index: ${error.message}`);
    }

    console.log('\n📋 STEP 2: Fixing GymBrosProfile collection indexes...');

    // Check current GymBrosProfile indexes
    const profileIndexes = await GymBrosProfile.collection.indexes();
    console.log('Current GymBrosProfile indexes:');
    profileIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check for duplicate userId indexes
    const userIdIndexes = profileIndexes.filter(index => 
      index.name !== '_id_' && 
      (index.key.userId === 1 || index.name.includes('userId'))
    );

    if (userIdIndexes.length > 1) {
      console.log(`\n🗑️ Found ${userIdIndexes.length} userId indexes, keeping only one...`);
      
      // Keep the first one, drop the rest
      for (let i = 1; i < userIdIndexes.length; i++) {
        try {
          await GymBrosProfile.collection.dropIndex(userIdIndexes[i].name);
          console.log(`✅ Dropped duplicate userId index: ${userIdIndexes[i].name}`);
        } catch (error) {
          console.log(`ℹ️ Could not drop ${userIdIndexes[i].name}: ${error.message}`);
        }
      }
    }

    // Check for duplicate phone indexes
    const phoneIndexes = profileIndexes.filter(index => 
      index.name !== '_id_' && 
      (index.key.phone === 1 || index.name.includes('phone'))
    );

    if (phoneIndexes.length > 1) {
      console.log(`\n🗑️ Found ${phoneIndexes.length} phone indexes, keeping only one...`);
      
      // Keep the first one, drop the rest
      for (let i = 1; i < phoneIndexes.length; i++) {
        try {
          await GymBrosProfile.collection.dropIndex(phoneIndexes[i].name);
          console.log(`✅ Dropped duplicate phone index: ${phoneIndexes[i].name}`);
        } catch (error) {
          console.log(`ℹ️ Could not drop ${phoneIndexes[i].name}: ${error.message}`);
        }
      }
    }

    // Create profile location index if missing
    const hasProfileLocationIndex = profileIndexes.some(index => 
      index.key['location.lat'] && index.key['location.lng']
    );

    if (!hasProfileLocationIndex) {
      try {
        await GymBrosProfile.collection.createIndex(
          { "location.lat": 1, "location.lng": 1 },
          { 
            name: "profile_location_2d",
            background: true 
          }
        );
        console.log('✅ Created profile_location_2d index');
      } catch (error) {
        console.log(`ℹ️ Profile location index: ${error.message}`);
      }
    } else {
      console.log('✅ Profile location index already exists');
    }

    // Verify final state
    console.log('\n🔍 FINAL VERIFICATION...');
    
    const finalGymIndexes = await Gym.collection.indexes();
    console.log('Final Gym indexes:');
    finalGymIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    const finalProfileIndexes = await GymBrosProfile.collection.indexes();
    console.log('\nFinal GymBrosProfile indexes:');
    finalProfileIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check for any remaining duplicates
    const finalUserIdIndexes = finalProfileIndexes.filter(index => 
      index.key.userId === 1 || index.name.includes('userId')
    );
    
    if (finalUserIdIndexes.length > 1) {
      console.log(`⚠️ WARNING: Still have ${finalUserIdIndexes.length} userId indexes`);
    } else {
      console.log(`✅ userId indexes: ${finalUserIdIndexes.length} (good)`);
    }

    console.log('\n🎉 Index fix completed successfully!');
    console.log('\n💡 To prevent future warnings, update your schema files to remove duplicate index definitions.');

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the fix if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixIndexes()
    .then(() => {
      console.log('✅ Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix failed:', error);
      process.exit(1);
    });
}

export default fixIndexes;
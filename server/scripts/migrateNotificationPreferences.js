import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Add debugging
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

// Default notification preferences structure
const defaultNotificationPreferences = {
  pushNotifications: true,
  emailNotifications: true,
  
  gymBros: {
    matches: true,
    messages: true,
    workoutInvites: true,
    profileViews: true,
    boosts: true
  },
  
  coaching: {
    newClients: true,
    clientMessages: true,
    sessionReminders: true,
    paymentUpdates: true,
    coachApplications: true
  },
  
  games: {
    dailyRewards: true,
    streakReminders: true,
    leaderboardUpdates: false,
    newGames: true
  },
  
  shop: {
    orderUpdates: true,
    shippingNotifications: true,
    salesAndPromotions: true, 
    stockAlerts: false,
    cartReminders: false
  },
  
  general: {
    systemUpdates: true,
    maintenanceNotices: true,
    securityAlerts: true,
    accountUpdates: true,
    appUpdates: true // Set to true as requested
  },
  
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    timezone: "UTC"
  }
};

async function migrateNotificationPreferences() {
  try {
    // Connect to MongoDB - using MONGODB_URI instead of MONGO_URI
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymjams');
    console.log('Connected to MongoDB');

    // Find users without notification preferences
    const usersWithoutPrefs = await User.find({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null },
        { 'notificationPreferences.gymBros': { $exists: false } },
        { 'notificationPreferences.coaching': { $exists: false } },
        { 'notificationPreferences.games': { $exists: false } },
        { 'notificationPreferences.shop': { $exists: false } },
        { 'notificationPreferences.general': { $exists: false } }
      ]
    });

    console.log(`Found ${usersWithoutPrefs.length} users needing notification preferences`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update each user
    for (const user of usersWithoutPrefs) {
      try {
        // Merge with existing preferences if any exist
        const existingPrefs = user.notificationPreferences || {};
        
        const mergedPreferences = {
          pushNotifications: existingPrefs.pushNotifications ?? defaultNotificationPreferences.pushNotifications,
          emailNotifications: existingPrefs.emailNotifications ?? defaultNotificationPreferences.emailNotifications,
          
          gymBros: {
            ...defaultNotificationPreferences.gymBros,
            ...(existingPrefs.gymBros || {})
          },
          
          coaching: {
            ...defaultNotificationPreferences.coaching,
            ...(existingPrefs.coaching || {})
          },
          
          games: {
            ...defaultNotificationPreferences.games,
            ...(existingPrefs.games || {})
          },
          
          shop: {
            ...defaultNotificationPreferences.shop,
            ...(existingPrefs.shop || {})
          },
          
          general: {
            ...defaultNotificationPreferences.general,
            ...(existingPrefs.general || {})
          },
          
          quietHours: {
            ...defaultNotificationPreferences.quietHours,
            ...(existingPrefs.quietHours || {})
          }
        };

        // Update the user
        await User.updateOne(
          { _id: user._id },
          { $set: { notificationPreferences: mergedPreferences } }
        );

        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} users...`);
        }
      } catch (error) {
        console.error(`Error updating user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`Successfully updated: ${updatedCount} users`);
    console.log(`Errors: ${errorCount} users`);

    // Verify a sample
    const sampleUser = await User.findOne({ email: "coraliecharlebois@hotmail.com" });
    if (sampleUser) {
      console.log('\nSample user notification preferences:');
      console.log(JSON.stringify(sampleUser.notificationPreferences, null, 2));
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateNotificationPreferences();
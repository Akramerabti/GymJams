import mongoose from 'mongoose';

const gymBrosPreferenceSchema = new mongoose.Schema({
  // User identification - only one should be present per document
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Allow this to be optional
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    sparse: true // Allow this to be optional
  },
  phone: {
    type: String,
    sparse: true // Allow this to be optional
  },
  
  // Matching preferences
  ageRange: {
    min: {
      type: Number,
      default: 18,
      min: 18,
      max: 99
    },
    max: {
      type: Number,
      default: 99,
      min: 18,
      max: 99
    }
  },
  genderPreference: {
    type: String,
    enum: ['Male', 'Female', 'Non-Binary', 'All'],
    default: 'All'
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Any'],
    default: 'Any'
  },
  workoutTypes: {
    type: [String],
    default: []
  },
  // FIXED: preferredTime should be a single string, not array
  preferredTime: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Flexible', 'Weekends Only', 'Any'],
    default: 'Any'
  },
  maxDistance: {
    type: Number,
    default: 50, // km
    min: 1,
    max: 100
  },
  
  // Interaction tracking - MAIN LEVEL (not duplicated)
  likedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    index: true // Add index for better query performance
  }],
  dislikedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    index: true // Add index for better query performance
  }],
  
  // App settings
  settings: {
    showMe: {
      type: Boolean,
      default: true
    },
    notifications: {
      matches: {
        type: Boolean,
        default: true
      },
      messages: {
        type: Boolean,
        default: true
      },
      profileUpdates: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      showWorkoutTypes: {
        type: Boolean,
        default: true
      },
      showExperienceLevel: {
        type: Boolean,
        default: true
      },
      showGoals: {
        type: Boolean,
        default: true
      },
      profileVisibility: {
        type: String,
        enum: ['everyone', 'matches', 'nobody'],
        default: 'everyone'
      }
      // REMOVED: Duplicate likedProfiles and dislikedProfiles from here
    }
  }
}, { 
  timestamps: true,
  // Add compound index to prevent duplicate preferences
  index: [
    { userId: 1 }, 
    { profileId: 1 }, 
    { phone: 1 }
  ]
});

gymBrosPreferenceSchema.index({ userId: 1 }, { sparse: true });

gymBrosPreferenceSchema.index({ profileId: 1 }, { 
  sparse: true,
  unique: true // Unique only when profileId exists  
});

gymBrosPreferenceSchema.index({ phone: 1 }, { 
  sparse: true,
  unique: true // Unique only when phone exists
});

// Add compound index for better query performance
gymBrosPreferenceSchema.index({ 
  userId: 1, 
  profileId: 1, 
  phone: 1 
}, { sparse: true });

// Pre-save validation to ensure at least one identifier exists
gymBrosPreferenceSchema.pre('save', function(next) {
  if (!this.userId && !this.profileId && !this.phone) {
    next(new Error('Either userId, profileId, or phone must be provided'));
  } else {
    next();
  }
});

// Add method to get the user identifier
gymBrosPreferenceSchema.methods.getUserIdentifier = function() {
  return this.userId || this.profileId || this.phone;
};

// Add static method to find preferences by any identifier
gymBrosPreferenceSchema.statics.findByAnyId = function(userId, profileId, phone) {
  const query = { $or: [] };
  
  if (userId) query.$or.push({ userId });
  if (profileId) query.$or.push({ profileId });  
  if (phone) query.$or.push({ phone });
  
  return this.findOne(query);
};

const GymBrosPreference = mongoose.model('GymBrosPreference', gymBrosPreferenceSchema);

export default GymBrosPreference;
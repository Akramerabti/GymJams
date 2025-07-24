import mongoose from 'mongoose';

const gymBrosPreferenceSchema = new mongoose.Schema({
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
  ageRange: {
    min: {
      type: Number,
      default: 18
    },
    max: {
      type: Number,
      default: 99
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
  preferredTime: {
    type: [String],
    default: []
  },
  maxDistance: {
    type: Number,
    default: 50 // km
  },
  likedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile'
  }],
  dislikedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile'
  }],
  // Settings
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
      },
      likedProfiles: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
        index: true  // Add index for better performance
      },
      
      dislikedProfiles: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
        index: true  // Add index for better performance
      },
    }
  }
}, { timestamps: true });

gymBrosPreferenceSchema.index({ userId: 1 }, { sparse: true });
gymBrosPreferenceSchema.index({ profileId: 1 }, { sparse: true });
gymBrosPreferenceSchema.index({ phone: 1 }, { sparse: true });

gymBrosPreferenceSchema.pre('save', function(next) {
  if (!this.userId && !this.profileId && !this.phone) {
    next(new Error('Either userId, profileId, or phone must be provided'));
  } else {
    next();
  }
});

const GymBrosPreference = mongoose.model('GymBrosPreference', gymBrosPreferenceSchema);

export default GymBrosPreference;
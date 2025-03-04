// models/GymBrosPreference.js
import mongoose from 'mongoose';

const gymBrosPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
    enum: ['male', 'female', 'non-binary', 'all'],
    default: 'all'
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'any'],
    default: 'any'
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
  likedProfiles: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  dislikedProfiles: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
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
      }
    }
  }
}, { timestamps: true });

const GymBrosPreference = mongoose.model('GymBrosPreference', gymBrosPreferenceSchema);

export default GymBrosPreference;
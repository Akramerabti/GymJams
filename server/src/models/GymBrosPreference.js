// server/src/models/GymBrosPreference.js

import mongoose from 'mongoose';

const gymBrosPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  workoutTypePreferences: [{
    type: {
      type: String,
      enum: [
        'Strength Training', 'Cardio', 'HIIT', 'CrossFit', 'Bodybuilding',
        'Yoga', 'Pilates', 'Calisthenics', 'Powerlifting', 'Olympic Lifting',
        'Functional Training', 'Group Classes'
      ]
    },
    weight: {
      type: Number,
      default: 1.0
    }
  }],
  experienceLevelPreferences: [{
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    weight: {
      type: Number,
      default: 1.0
    }
  }],
  likedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikedProfiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  engagementScore: {
    type: Number,
    default: 1.0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

const GymBrosPreference = mongoose.model('GymBrosPreference', gymBrosPreferenceSchema);

export default GymBrosPreference;
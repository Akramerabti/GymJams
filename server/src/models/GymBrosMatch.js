// server/src/models/GymBrosMatch.js

import mongoose from 'mongoose';

const gymBrosMatchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  lastMessage: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  quality: {
    type: Number,
    default: 0 // Will be updated based on message frequency and length
  }
}, { 
  timestamps: true 
});

// Add index for querying user matches
gymBrosMatchSchema.index({ users: 1 });

const GymBrosMatch = mongoose.model('GymBrosMatch', gymBrosMatchSchema);

export default GymBrosMatch;
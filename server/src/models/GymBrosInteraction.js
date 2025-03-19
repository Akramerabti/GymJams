// server/src/models/GymBrosInteraction.js
import mongoose from 'mongoose';

const gymBrosInteractionSchema = new mongoose.Schema({
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Profile that received the action
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Type of interaction
  type: {
    type: String,
    enum: ['like', 'dislike', 'view', 'message', 'block', 'report'],
    required: true,
    index: true
  },
  
  // How long the user viewed the profile (in milliseconds)
  viewDuration: {
    type: Number,
    default: 0
  },
  
  // Additional metadata for the interaction
  metadata: {
    type: Object,
    default: {}
  },
  
  // When the interaction happened
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create compound indexes for common queries
gymBrosInteractionSchema.index({ userId: 1, type: 1, timestamp: -1 });
gymBrosInteractionSchema.index({ targetId: 1, type: 1, timestamp: -1 });

// Add TTL index to automatically delete old interactions after 90 days
gymBrosInteractionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const GymBrosInteraction = mongoose.model('GymBrosInteraction', gymBrosInteractionSchema);
export default GymBrosInteraction;
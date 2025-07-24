// server/src/models/GymBrosFeatureUsage.js
import mongoose from 'mongoose';

const gymBrosFeatureUsageSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  featureType: {
    type: String,
    enum: ['superlike', 'boost', 'rekindle', 'filter'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  count: {
    type: Number,
    default: 1
  },
  resetDate: {
    type: Date,
    required: true
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosMembership',
    sparse: true
  }
});

// Create compound index for efficient querying
gymBrosFeatureUsageSchema.index({ profileId: 1, featureType: 1, date: 1 });

const GymBrosFeatureUsage = mongoose.model('GymBrosFeatureUsage', gymBrosFeatureUsageSchema);
export default GymBrosFeatureUsage;
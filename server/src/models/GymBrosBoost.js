// server/src/models/GymBrosBoost.js
import mongoose from 'mongoose';

const gymBrosBoostSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  boostType: {
    type: String,
    enum: ['boost-basic', 'boost-premium', 'boost-ultra'],
    required: true
  },
  boostFactor: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  activatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // Index for efficient querying of active boosts
  },
  paymentMethod: {
    type: String,
    enum: ['points', 'stripe', 'membership'],
    required: true
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosMembership',
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add compound index for efficient querying
gymBrosBoostSchema.index({ profileId: 1, isActive: 1 });

// Add method to check if boost is active
gymBrosBoostSchema.methods.isActiveNow = function() {
  return this.isActive && this.expiresAt > new Date();
};

// Add virtual property for remaining time
gymBrosBoostSchema.virtual('remainingTime').get(function() {
  const now = new Date();
  return Math.max(0, this.expiresAt - now);
});

const GymBrosBoost = mongoose.model('GymBrosBoost', gymBrosBoostSchema);
export default GymBrosBoost;
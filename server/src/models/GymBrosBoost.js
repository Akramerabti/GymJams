import mongoose from 'mongoose';

const gymBrosBoostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Allow this to be optional
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    sparse: true // Allow this to be optional for users with no profile
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
    max: 20 // Reasonable upper limit
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // Index this for efficient queries on active boosts
  },
  active: {
    type: Boolean,
    default: true
  },
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['points', 'stripe', 'gift', 'reward'],
    required: true
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  stripePaymentId: {
    type: String,
    sparse: true
  }
}, { 
  timestamps: true 
});

// Index for finding active boosts
gymBrosBoostSchema.index({ userId: 1, active: 1 });
gymBrosBoostSchema.index({ profileId: 1, active: 1 });

// Methods to check if a boost is active
gymBrosBoostSchema.methods.isActive = function() {
  return this.active && this.expiresAt > new Date();
};

// Static method to find active boosts for a user
gymBrosBoostSchema.statics.findActiveBoostsForUser = async function(userId) {
  const now = new Date();
  return this.find({
    userId,
    active: true,
    expiresAt: { $gt: now }
  }).sort({ expiresAt: 1 });
};

// Static method to find active boosts for a profile
gymBrosBoostSchema.statics.findActiveBoostsForProfile = async function(profileId) {
  const now = new Date();
  return this.find({
    profileId,
    active: true,
    expiresAt: { $gt: now }
  }).sort({ expiresAt: 1 });
};

// Get highest active boost factor for a user/profile
gymBrosBoostSchema.statics.getHighestActiveBoostFactor = async function(identifier) {
  const now = new Date();
  
  // Check if identifier is userId or profileId
  const query = mongoose.Types.ObjectId.isValid(identifier)
    ? {
        $or: [
          { userId: identifier },
          { profileId: identifier }
        ],
        active: true,
        expiresAt: { $gt: now }
      }
    : { active: false }; // Use a query that returns no results if identifier is invalid
  
  const boosts = await this.find(query).sort({ boostFactor: -1 }).limit(1);
  
  return boosts.length > 0 ? boosts[0].boostFactor : 1; // Default to 1x if no active boosts
};

const GymBrosBoost = mongoose.model('GymBrosBoost', gymBrosBoostSchema);

export default GymBrosBoost;
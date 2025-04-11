// server/src/models/GymBrosMembership.js
import mongoose from 'mongoose';

const gymBrosMembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    required: true,
    index: true
  },
  membershipType: {
    type: String,
    enum: ['membership-week', 'membership-month', 'membership-platinum'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['points', 'stripe'],
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
  benefits: {
    unlimitedLikes: { type: Boolean, default: true },
    unlimitedSuperLikes: { type: Boolean, default: true }, // Changed from superLikesPerDay
    profileBoost: { type: Number, default: 10 },           // Changed from boostsPerWeek
  },
  recurringId: {
    type: String,
    sparse: true
  },
  lastRenewal: {
    type: Date
  },
  cancellationDate: {
    type: Date
  }
}, { timestamps: true });

// Method to check if membership is active
gymBrosMembershipSchema.methods.isActiveNow = function() {
  return this.isActive && this.endDate > new Date();
};

// Virtual property for remaining days
gymBrosMembershipSchema.virtual('remainingDays').get(function() {
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const GymBrosMembership = mongoose.model('GymBrosMembership', gymBrosMembershipSchema);
export default GymBrosMembership;
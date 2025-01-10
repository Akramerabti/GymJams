import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestEmail: {
    type: String,
    sparse: true
  },
  subscription: {
    type: String,
    required: true,
    enum: ['basic', 'premium', 'elite']
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'cancelled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  accessToken: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
}, {
  timestamps: true
});

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date());
});

// Method to check if subscription can be cancelled with refund
subscriptionSchema.methods.isEligibleForRefund = function() {
  const daysSinceStart = (new Date() - this.startDate) / (1000 * 60 * 60 * 24);
  return daysSinceStart <= 10;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
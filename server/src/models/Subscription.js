import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  // Optional: Reference to the User model (if the user is logged in)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Optional: Email for unauthenticated users
  guestEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  // Subscription details
  subscription: {
    type: String,
    required: true,
    enum: ['basic', 'premium', 'elite'] // Ensure only valid plans are stored
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
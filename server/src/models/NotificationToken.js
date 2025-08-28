import mongoose from 'mongoose';

const notificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fcmToken: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
notificationTokenSchema.index({ userId: 1, isActive: 1 });
notificationTokenSchema.index({ fcmToken: 1, isActive: 1 });

export default mongoose.model('NotificationToken', notificationTokenSchema);
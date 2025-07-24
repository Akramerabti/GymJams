// server/src/models/GymBrosSuperLike.js
import mongoose from 'mongoose';

const gymBrosSuperLikeSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    required: true,
    index: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    required: true,
    index: true
  },
  message: {
    type: String,
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  viewed: {
    type: Boolean,
    default: false
  },
  responded: {
    type: Boolean,
    default: false
  },
  responseType: {
    type: String,
    enum: ['like', 'dislike', 'none'],
    default: 'none'
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
  superLikeType: {
    type: String,
    enum: ['superlike-basic', 'superlike-premium'],
    default: 'superlike-basic'
  }
}, { timestamps: true });

// Compound indices for efficient querying
gymBrosSuperLikeSchema.index({ recipientId: 1, viewed: 1 });
gymBrosSuperLikeSchema.index({ senderId: 1, createdAt: -1 });

const GymBrosSuperLike = mongoose.model('GymBrosSuperLike', gymBrosSuperLikeSchema);
export default GymBrosSuperLike;
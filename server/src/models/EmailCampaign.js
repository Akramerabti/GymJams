// server/src/models/EmailCampaign.js
import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  filters: {
    role: {
      type: String,
      default: 'all'
    },
    hasSubscription: {
      type: Boolean,
      default: undefined
    },
    lastActiveWithin: {
      type: Number, // days
      default: undefined
    },
    acceptsMarketing: {
      type: Boolean,
      default: true
    }
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  opens: {
    type: Number,
    default: 0
  },
  uniqueOpens: {
    type: Number,
    default: 0
  },
  openedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  clicks: {
    type: Number,
    default: 0
  },
  uniqueClicks: {
    type: Number,
    default: 0
  },
  clickedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  clickedUrls: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    url: String,
    clickedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  sentAt: Date,
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
emailCampaignSchema.index({ status: 1, createdAt: -1 });
emailCampaignSchema.index({ sentBy: 1, createdAt: -1 });

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);
export default EmailCampaign;
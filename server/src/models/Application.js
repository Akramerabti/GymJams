// server/src/models/Application.js
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  applicationType: {
    type: String,
    required: [true, 'Application type is required'],
    enum: ['coach', 'affiliate', 'taskforce', 'general', 'support'],
    default: 'general'
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  portfolioUrl: {
    type: String,
    trim: true
  },
  resume: {
    type: String 
  }, 
   status: {
    type: String,
    enum: ['pending', 'awaiting', 'received', 'approved', 'rejected'],
    default: 'pending'
  },
  feedback: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },

  documentSent: {
    type: Boolean,
    default: false
  },
  documentSentAt: {
    type: Date,
    default: null
  },  signedDocumentPath: {
    type: String,
    default: null
  },
  additionalDocuments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      default: 'application/octet-stream'
    },
    size: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  signedDocumentReceivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for time since submission
applicationSchema.virtual('timeSinceSubmission').get(function() {
  return new Date() - this.createdAt;
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
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
    type: String // Path to the uploaded resume file
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
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
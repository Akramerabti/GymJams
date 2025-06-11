import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true
    },
    time: {
      type: String, // HH:MM format
      required: true
    },
    sessionType: {
      type: String,
      required: true,
      enum: [
        'Workout Review', 
        'Progress Check', 
        'Training Session', 
        'Nutrition Consultation', 
        'Goal Setting',
        'Other'
      ]
    },
    duration: {
      type: String,
      default: '60 minutes'
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    },
    feedback: {
      type: String,
      default: ''
    },
    // Optional fields for virtual sessions
    meetingLink: String,
    meetingId: String,
    meetingPassword: String,
    meetingPlatform: {
      type: String,
      enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Other', '']
    },
    
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  clientRequested: {
    type: Boolean,
    default: false
  },
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
  rejectedAt: Date,
  rejectionReason: String,
  },
  {
    timestamps: true
  }
);

// Create a compound index on coach and date for efficient queries
sessionSchema.index({ coachId: 1, date: 1 });

// Virtual for getting the full date and time as a Date object
sessionSchema.virtual('dateTime').get(function() {
  if (this.date && this.time) {
    const [hours, minutes] = this.time.split(':');
    const dateTime = new Date(this.date);
    dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return dateTime;
  }
  return null;
});

// Method to check if this session is in the past
sessionSchema.methods.isPast = function() {
  const now = new Date();
  const sessionDateTime = this.dateTime;
  return sessionDateTime && sessionDateTime < now;
};

// Method to check if this session is happening soon (within the next 24 hours)
sessionSchema.methods.isSoon = function() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const sessionDateTime = this.dateTime;
  return sessionDateTime && sessionDateTime > now && sessionDateTime < tomorrow;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
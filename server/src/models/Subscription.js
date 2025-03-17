// server/src/models/Subscription.js (updated)
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true, // Automatically generate a unique ObjectId
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    default: "", // Make content optional and default to an empty string
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  file: [
    {
      path: { type: String, required: true }, // File path on the server
      type: { type: String, required: true }, // File type (e.g., 'image' or 'video')
    },
  ],
});

// Exercise schema for workout plans
const exerciseSchema = new mongoose.Schema({
  id: String,
  name: String,
  sets: Number,
  reps: Number,
  weight: String,
  notes: String
});

// Workout schema for client workout plans
const workoutSchema = new mongoose.Schema({
  id: String,
  title: String,
  date: String,
  time: String,
  type: {
    type: String,
    enum: ['strength', 'cardio', 'hiit', 'flexibility', 'recovery']
  },
  description: String,
  exercises: [exerciseSchema],
  completed: {
    type: Boolean,
    default: false
  },
  completedDate: Date,
  feedback: String,
  performance: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  }
});

// Progress entry schema for tracking client metrics
const progressEntrySchema = new mongoose.Schema({
  date: String,
  value: Number,
  notes: String
});

// Custom metric schema for client progress
const customMetricSchema = new mongoose.Schema({
  id: String,
  name: String,
  unit: String,
  target: Number,
  current: Number,
  trackingFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly']
  },
  data: [progressEntrySchema]
});

// Progress schema for client progress tracking
const progressSchema = new mongoose.Schema({
  weightProgress: [progressEntrySchema],
  strengthProgress: [progressEntrySchema],
  cardioProgress: [progressEntrySchema],
  bodyFatProgress: [progressEntrySchema],
  customMetrics: [customMetricSchema]
});

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    guestEmail: {
      type: String,
      sparse: true,
    },
    subscription: {
      type: String,
      required: true,
      enum: ['basic', 'premium', 'elite'],
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'cancelled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    accessToken: {
      type: String,
      sparse: true,
      index: {
        unique: true,
        partialFilterExpression: { accessToken: { $type: 'string' } },
      },
    },
    hasCompletedQuestionnaire: {
      type: Boolean,
      default: false,
    },
    questionnaireData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
    questionnaireCompletedAt: {
      type: Date,
    },
    assignedCoach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    coachAssignmentStatus: {
      type: String,
      enum: ['pending', 'assigned', 'declined', 'changed'],
      default: 'pending',
    },
    coachAssignmentDate: {
      type: Date,
    },
    coachDeclineReason: String,
    coachDeclineDate: Date,
    coachPreferences: {
      specialties: [String],
      preferredGender: String,
      preferredLanguages: [String],
      timeZone: String,
    },
    stats: {
      workoutsCompleted: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      monthlyProgress: {
        type: Number,
        default: 0,
      },
      goalsAchieved: {
        type: Number,
        default: 0,
      },
      weeklyTarget: {
        type: Number,
        default: 3
      },
      nutritionCompliance: {
        type: Number,
        default: 0
      },
      strengthProgress: {
        type: Number,
        default: 0
      },
      cardioProgress: {
        type: Number,
        default: 0
      },
      customGoalTitle: String,
      customGoalTarget: String,
      customGoalProgress: {
        type: Number,
        default: 0
      },
      customGoalDue: String,
      strengthFocus: String
    },
    messages: [messageSchema], // Add messages field to store messages
    workouts: [workoutSchema], // Client workout plan
    progress: {
      type: progressSchema,
      default: () => ({})
    },
    coachNotes: String, // Coach's notes about the client
    lastLogin: Date, // Last time client logged in
    lastUpdated: Date, // Last time the subscription was updated
    unreadCounts: {
      user: {
        type: Number,
        default: 0
      },
      coach: {
        type: Number,
        default: 0
      }
    },
    lastMessageTime: Date // Timestamp of the last message sent
  },
  {
    timestamps: true,
  }
);


// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date());
});

// Method to check if subscription can be cancelled with refund
subscriptionSchema.methods.isEligibleForRefund = function () {
  const daysSinceStart = (new Date() - this.startDate) / (1000 * 60 * 60 * 24);
  return daysSinceStart <= 10;
};

subscriptionSchema.methods.sendMessage = async function (message) {
  this.messages.push(message);
  this.lastMessageTime = new Date();
  await this.save();
  return this;
};

// Method to fetch messages
subscriptionSchema.methods.fetchMessages = async function () {
  // Return all messages associated with this subscription
  return this.messages;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
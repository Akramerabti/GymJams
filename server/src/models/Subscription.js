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
    },
    messages: [messageSchema], // Add messages field to store messages
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
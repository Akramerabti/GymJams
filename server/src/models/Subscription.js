// models/Subscription.js
import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Basic', 'Premium', 'Elite'],
  },
  price: {
    type: Number,
    required: true,
  },
  stripePriceId: {
    type: String,
    required: true,
  },
  pointsPerMonth: {
    type: Number,
    required: true,
  },
});

// models/UserSubscription.js
const userSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
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
  stripeSubscriptionId: String
});

// models/UserPoints.js
const userPointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  history: [{
    amount: Number,
    type: {
      type: String,
      enum: ['earned', 'spent']
    },
    source: {
      type: String,
      enum: ['subscription', 'purchase', 'reward']
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

// models/Questionnaire.js
const questionnaireSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fitnessGoals: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility']
  }],
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'very_active', 'extra_active']
  },
  workoutFrequency: Number,
  dietaryRestrictions: [String],
  healthConditions: [String],
  favouriteFoods: [String],
  measurements: {
    height: Number,
    weight: Number,
    age: Number
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
const UserPoints = mongoose.model('UserPoints', userPointsSchema);
const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema);

export { Subscription, UserSubscription, UserPoints, Questionnaire };
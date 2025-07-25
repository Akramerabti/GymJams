import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: async function(email) {
        if (!this.isModified('email')) return true;
        const user = await this.constructor.findOne({ email });
        return !user;
      },
      message: 'This email is already registered'
    }
  },  password: {
    type: String,
    required: function() {
      // Password is only required for non-OAuth users
      return !this.oauth || !this.oauth.googleId && !this.oauth.facebookId;
    },
    minlength: 8,
    select: false // Don't include password by default
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },  lastName: {
    type: String,
    required: function() {
      // lastName is optional for OAuth users until they complete their profile
      return !this.oauth || !this.oauth.isIncomplete;
    },
    trim: true
  },  phone: {
    type: String,
    required: function() {
      // Phone is optional for OAuth users until they complete their profile
      return !this.oauth || !this.oauth.isIncomplete;
    },
    unique: true,
    trim: true,
    sparse: true,
    validate: {
      validator: async function(phone) {
        // Convert empty strings to null/undefined for sparse index compatibility
        if (!phone || phone === '') {
          this.phone = undefined;
          return true; // Allow empty phone for OAuth users
        }
        if (!this.isModified('phone')) return true;
        
        // Validate phone format (should start with + and have 10-15 digits)
        const phoneRegex = /^\+\d{10,15}$/;
        if (!phoneRegex.test(phone)) {
          throw new Error('Phone number must be in international format (e.g., +15149127545)');
        }
        
        const user = await this.constructor.findOne({ phone });
        return !user;
      },
      message: 'This phone number is already registered'
    }
  },oauth: {
    googleId: String,
    facebookId: String,
    lastProvider: String,
    isIncomplete: {
      type: Boolean,
      default: false
    },
    needsPhoneNumber: {
      type: Boolean,
      default: false
    },
    needsLastName: {
      type: Boolean,
      default: false
    }
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },
  addresses: [{
    type: {
      type: String,
      enum: ['shipping', 'billing'],
      required: true
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  role: {
    type: String,
    enum: ['user', 'admin', 'coach', 'affiliate', 'taskforce'],
    default: 'user'
  },
  points: {
    type: Number,
    default: 0
  },
  profileImage: String,
  bio: String,
  rating: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  ratedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number
  }],
  socialLinks: {
    instagram: String,
    twitter: String,
    youtube: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  coachingSubscriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  }],
  specialties: [{
    type: String,
    enum: ['HIIT', 'Cardio', 'Weight Training', 'Nutrition','Bodybuilding', 'Nutrition', 'Sports Performance', 'Yoga', 'Weight Loss', 'CrossFit','Powerlifting']
  }],
  
  availability: {
    maxClients: {
      type: Number,
      default: 10
    },
    currentClients: {
      type: Number,
      default: 0
    }
  },

  hasReceivedFirstLoginBonus: {
    type: Boolean,
    default: false
  },
  coachStatus: {
    type: String,
    enum: ['available', 'full', 'unavailable'],
    default: 'available'
  },
  stripeAccountId: {
    type: String,
    unique: true,
    sparse: true,
  },
  payoutSetupComplete: {
    type: Boolean,
    default: false,
  },
  earnings: {
    pendingAmount: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    lastPayout: {
      type: Date
    },  
    payoutHistory: [{
      amount: Number,
      date: Date,
      stripeTransferId: String,
      subscriptions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
      }]
    }]
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  lastGameReset: {
    type: Date,
    default: Date.now
  },
  learningStreak: {
    type: Number,
    default: 0
  },
  gymBrosProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.methods.checkDailyGames = function() {
  const now = new Date();
  const lastReset = new Date(this.lastGameReset);
  
  if (now.getDate() !== lastReset.getDate()) {
    this.gamesPlayed = 0;
    this.lastGameReset = now;
  }
  
  return this.gamesPlayed;
};

// Virtual for getting active clients count
userSchema.virtual('activeClientsCount').get(function() {
  return this.coachingSubscriptions?.length || 0;
});

// Method to check if coach can take new clients
userSchema.methods.canAcceptNewClients = function() {
  return this.role === 'coach' && 
         this.coachStatus === 'available' && 
         this.availability.currentClients < this.availability.maxClients;
};

// Pre-save middleware to update coachStatus
userSchema.pre('save', function(next) {
  if (this.role === 'coach') {
    if (this.availability.currentClients >= this.availability.maxClients) {
      this.coachStatus = 'full';
    } else if (this.coachStatus !== 'unavailable') {
      this.coachStatus = 'available';
    }
  }
  next();
});

// Keep existing methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to clean up empty phone values
userSchema.pre('save', function(next) {
  // Convert empty phone strings to undefined to work properly with sparse unique index
  if (this.phone === '' || this.phone === null) {
    this.phone = undefined;
  }
  next();
});

userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    next(new Error(`This ${field} is already registered`));
  } else {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
export default User;
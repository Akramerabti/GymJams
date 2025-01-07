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
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password by default
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    sparse: true,
    validate: {
      validator: async function(phone) {
        if (!this.isModified('phone')) return true;
        const user = await this.constructor.findOne({ phone });
        return !user;
      },
      message: 'This phone number is already registered'
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
    enum: ['user', 'admin'],
    default: 'user'
  },
  points: {
    type: Number,
    default: 0
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer'],
      required: true
    },
    cardNumber: String, // Last 4 digits for credit cards
    expirationDate: String, // MM/YY format
    paypalEmail: String, // For PayPal
    bankAccount: { // For bank transfers
      accountNumber: String,
      routingNumber: String
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  verificationToken: String,
  verificationTokenExpires: Date,
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});



// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Get user's full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
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
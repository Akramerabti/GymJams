import mongoose from 'mongoose';

const ambassadorCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  ambassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalUses: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: null // null = unlimited
  },
  totalCommissionEarned: {
    type: Number,
    default: 0 // in cents
  },
  validFor: [{
    type: String,
    enum: ['products', 'coaching', 'all'],
    default: 'all'
  }],
  expiryDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

ambassadorCodeSchema.index({ code: 1, isActive: 1 });

const AmbassadorCode = mongoose.model('AmbassadorCode', ambassadorCodeSchema);
export default AmbassadorCode;
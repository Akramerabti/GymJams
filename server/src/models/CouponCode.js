import mongoose from 'mongoose';

const couponCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount: { type: Number, required: true, min: 1, max: 100 },
  type: {
    type: String,
    required: true,
    enum: ['product', 'coaching', 'both'],
    default: 'product',
  },
  subscription: {
    type: String,
    enum: ['all', 'basic', 'premium', 'elite'],
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  categories: [{ type: String }],
  duration: {
    type: String,
    enum: ['once', 'forever', 'repeating'],
  },
  duration_in_months: {
    type: Number,
    min: 1,
  },
  maxUses: { type: Number, min: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

couponCodeSchema.pre('save', function() {
  if (this.type !== 'coaching' && this.type !== 'both') {
    this.duration = undefined;
    this.duration_in_months = undefined;
  } else {
    if (!this.duration) {
      this.duration = 'once';
    }
    if (this.duration !== 'repeating') {
      this.duration_in_months = undefined;
    }
  }
});

const CouponCode = mongoose.model('CouponCode', couponCodeSchema);
export default CouponCode;

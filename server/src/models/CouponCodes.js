
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
  // For coaching coupons
  subscription: {
    type: String,
    enum: ['all', 'basic', 'premium', 'elite'],
  },
  // For product coupons
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  categories: [{ type: String }],
  // Usage limits
  maxUses: { type: Number, min: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const CouponCode = mongoose.model('CouponCode', couponCodeSchema);
export default CouponCode;

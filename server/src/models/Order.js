import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  phone: String,
  address: String,
  apartment: String,
  email: String
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  email: {
    type: String,
    required: function () {
      return !this.user; 
    },
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  billingAddress: {
    type: addressSchema,
    required: true
  },
  subtotal: {
    type: Number,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    unique: true,
    sparse: true // This allows multiple null values
  },
  stripeChargeId: String,
  shippingMethod: {
    type: String,
    enum: ['standard', 'express'],
    default: 'standard'
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  trackingNumber: String,
  estimatedDeliveryDate: Date,
  notes: String,
  pointsUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundStatus: {
    status: {
      type: String,
      enum: ['none', 'requested', 'processed', 'denied'],
      default: 'none'
    },
    reason: String,
    amount: Number,
    date: Date
  },
  cancelledAt: Date
}, {
  timestamps: true
});

// Virtual to calculate subtotal if it's not set
orderSchema.virtual('calculatedSubtotal').get(function() {
  if (this.subtotal) return this.subtotal;
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

orderSchema.virtual('calculatedTotal').get(function() {
  if (this.total) return this.total;
  const subtotal = this.calculatedSubtotal;
  const pointsDiscount = this.pointsDiscount || 0;
  const total = Math.max(0, subtotal + this.shippingCost + (this.tax || 0) - pointsDiscount);
  return parseFloat(total.toFixed(2)); // Round to 2 decimal places
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
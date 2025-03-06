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
  phone: String
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
  paymentIntentId: String,
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
  trackingNumber: String,
  estimatedDeliveryDate: Date,
  notes: String,
  refundStatus: {
    status: {
      type: String,
      enum: ['none', 'requested', 'processed', 'denied'],
      default: 'none'
    },
    reason: String,
    amount: Number,
    date: Date
  }
}, {
  timestamps: true
});

// Calculate subtotal
orderSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Calculate total with shipping
orderSchema.virtual('totalWithShipping').get(function() {
  return this.total + this.shippingCost;
});

// Update stock quantities after order
orderSchema.post('save', async function() {
  if (this.status === 'processing') {
    for (const item of this.items) {
      await mongoose.model('Product').updateOne(
        { _id: item.product },
        { $inc: { stockQuantity: -item.quantity } }
      );
    }
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
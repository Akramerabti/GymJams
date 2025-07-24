// server/src/models/ShippingMethod.js
import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  carrier: {
    type: String,
    required: true,
    trim: true
  },
  serviceCode: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  estimatedDeliveryDays: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  domesticOnly: {
    type: Boolean,
    default: false
  },
  baseRate: {
    type: Number,
    default: 0
  },
  freeShippingThreshold: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supportedWarehouses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  }]
}, {
  timestamps: true
});

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
export default ShippingMethod;
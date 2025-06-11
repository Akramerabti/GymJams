// server/src/models/Warehouse.js
import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['internal', 'shipbob', 'shipmonk', 'deliverr', 'other']
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  contact: {
    name: String,
    email: String,
    phone: String
  },
  apiCredentials: {
    apiKey: String,
    secretKey: String,
    accessToken: String,
    warehouseId: String,
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox'
    }
  },
  settings: {
    defaultForNewProducts: Boolean,
    priorityLevel: {
      type: Number,
      default: 1
    },
    cutoffTime: String, // Format: "HH:MM"
    processingDays: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
// server/src/models/PhoneVerification.js
import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL index: automatically remove documents after 10 minutes
  }
});

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);
export default PhoneVerification;
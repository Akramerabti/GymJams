import mongoose from 'mongoose';

const commissionTransactionSchema = new mongoose.Schema({
  ambassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ambassadorCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbassadorCode',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerEmail: {
    type: String,
    required: true
  },
  
  // Transaction details
  type: {
    type: String,
    enum: ['product_purchase', 'coaching_monthly'],
    required: true
  },
  originalAmount: {
    type: Number,
    required: true // in cents
  },
  discountAmount: {
    type: Number,
    required: true // in cents
  },
  commissionAmount: {
    type: Number,
    required: true // in cents (same as discount amount)
  },
  
  // Related records
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  
  // For coaching subscriptions only
  monthNumber: {
    type: Number,
    default: null // 1, 2, or 3 for first three months
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

commissionTransactionSchema.index({ ambassador: 1, status: 1 });
commissionTransactionSchema.index({ subscriptionId: 1, monthNumber: 1 });

const CommissionTransaction = mongoose.model('CommissionTransaction', commissionTransactionSchema);
export default CommissionTransaction;

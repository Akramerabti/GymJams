import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['addition', 'reduction', 'adjustment'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  newQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.Mixed, // Changed from ObjectId to Mixed
    ref: 'User',
    required: true,
    // Custom validator to ensure it's either an ObjectId or the string "guest"
    validate: {
      validator: function(value) {
        return mongoose.Types.ObjectId.isValid(value) || value === 'guest';
      },
      message: props => `${props.value} is not a valid user ID or the string "guest"`
    }
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  notes: String
}, {
  timestamps: true
});

// Create indexes for frequent queries
inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ user: 1 });

// Check if the model already exists before defining it
const InventoryTransaction = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);

export default InventoryTransaction;
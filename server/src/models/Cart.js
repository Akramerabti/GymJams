import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified when cart is modified
cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Calculate cart total
cartSchema.methods.calculateTotal = async function() {
  let total = 0;
  await this.populate('items.product');
  
  for (const item of this.items) {
    total += item.product.price * item.quantity;
  }
  
  return total;
};

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Weights', 'Machines', 'Accessories', 'CardioEquipment']
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  imageUrl: {
    type: String,
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  specs: {
    weight: Number,
    dimensions: String,
    material: String,
    warranty: String
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  discount: {
    percentage: Number,
    startDate: Date,
    endDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Calculate discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount || !this.discount.percentage) return this.price;
  if (this.discount.startDate && this.discount.startDate > new Date()) return this.price;
  if (this.discount.endDate && this.discount.endDate < new Date()) return this.price;
  
  return this.price * (1 - this.discount.percentage / 100);
});

// Update average rating when ratings are modified
productSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, item) => sum + item.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
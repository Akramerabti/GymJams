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
    enum: ['Clothes', 'Machines', 'Accessories', 'CardioEquipment']
  },
  // Add color variants - array to support multiple colors
  colors: [{
    type: String,
    trim: true
  }],
  // Add gender field - only relevant for Clothes category
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex', null],
    default: null
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Modified to support color-specific images
  imageUrls: [{ 
    url: { type: String, required: true },
    color: { type: String, default: null } // Associate image with specific color
  }],
  featured: {
    type: Boolean,
    default: false
  },
  preOrder: {
    type: Boolean,
    default: false
  },
  specs: {
    weight: { type: String },
    dimensions: { type: String },
    material: { type: String },
    warranty: { type: String }
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
  ratedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  averageRating: {
    type: Number,
    default: 0
  },
  discount: {
    percentage: Number,
    startDate: Date,
    endDate: Date
  },
  thirdPartyData: {
    sku3PL: {
      type: String,
      sparse: true,
      index: true
    },
    warehouses: [{
      warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
      },
      stockQuantity: {
        type: Number,
        default: 0
      },
      binLocation: String,
      lastSyncDate: Date
    }],
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
      unit: {
        type: String,
        enum: ['in', 'cm'],
        default: 'in'
      },
      weightUnit: {
        type: String,
        enum: ['oz', 'lb', 'g', 'kg'],
        default: 'oz'
      }
    },
    handlingInstructions: String,
    hazardous: {
      type: Boolean,
      default: false
    },
    requiresTemperatureControl: {
      type: Boolean,
      default: false
    }
  },
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
    this.ratedBy = [];
    this.ratings.forEach(r => {
      if (!this.ratedBy.some(u => u.toString() === r.user.toString())) {
        this.ratedBy.push(r.user);
      }
    });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
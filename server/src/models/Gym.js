import mongoose from 'mongoose';

const GymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    lat: { 
      type: Number, 
      required: true,
      min: -90,
      max: 90
    },
    lng: { 
      type: Number, 
      required: true,
      min: -180,
      max: 180
    },
    address: { 
      type: String, 
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'US',
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    }
  },
  // Gym details
  description: {
    type: String,
    trim: true
  },
  amenities: [{
    type: String,
    enum: [
      'Free Weights', 'Cardio Equipment', 'Swimming Pool', 'Sauna', 'Steam Room',
      'Group Classes', 'Personal Training', 'Locker Rooms', 'Parking',
      'Juice Bar', 'Towel Service', '24/7 Access', 'CrossFit Box',
      'Rock Climbing Wall', 'Basketball Court', 'Racquetball Court'
    ]
  }],
  gymChain: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  // Hours of operation
  hours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  // Verification and moderation
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.Mixed, // Accept ObjectId (user) or String (guest email)
    ref: 'User',
    validate: {
      validator: function(v) {
        // Accept valid ObjectId or non-empty string (email)
        return (
          v == null || // allow null/undefined (not required)
          (typeof v === 'string' && v.length > 0) ||
          (v && typeof v === 'object' && mongoose.Types.ObjectId.isValid(v))
        );
      },
      message: 'verifiedBy must be a valid user ObjectId or guest email.'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed, // Accept ObjectId (user) or String (guest email)
    required: true,
    validate: {
      validator: function(v) {
        // Accept valid ObjectId or non-empty string (email)
        return (
          (typeof v === 'string' && v.length > 0) ||
          (v && typeof v === 'object' && mongoose.Types.ObjectId.isValid(v))
        );
      },
      message: 'createdBy must be a valid user ObjectId or guest email.'
    }
  },
  // Analytics
  memberCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for location-based queries
GymSchema.index({ 'location.lat': 1, 'location.lng': 1 });
GymSchema.index({ 'location.city': 1 });
GymSchema.index({ name: 'text', description: 'text' });
GymSchema.index({ gymChain: 1 });
GymSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for getting active members
GymSchema.virtual('activeMembers', {
  ref: 'GymBrosProfile',
  localField: '_id',
  foreignField: 'primaryGym',
  count: true
});

// Method to calculate distance from a point
GymSchema.methods.distanceFrom = function(lat, lng) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat - this.location.lat);
  const dLon = toRadians(lng - this.location.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(this.location.lat)) * Math.cos(toRadians(lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Static method to find gyms within radius
GymSchema.statics.findNearby = function(lat, lng, radiusMiles = 25) {
  return this.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        maxDistance: radiusMiles * 1609.34, // Convert miles to meters
        spherical: true,
        query: { isActive: true }
      }
    },
    {
      $addFields: {
        distanceMiles: { $divide: ["$distance", 1609.34] }
      }
    },
    {
      $sort: { distance: 1 }
    }
  ]);
};

const Gym = mongoose.model('Gym', GymSchema);
export default Gym;

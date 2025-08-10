import mongoose from 'mongoose';

const GymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
  type: String,
  enum: ['gym', 'community', 'event', 'sport_center', 'other'],
  default: 'gym',
  required: true
},
  location: {
    // GeoJSON Point format for proper geospatial queries
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90; // latitude
        },
        message: 'Invalid coordinates format [lng, lat]'
      }
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
  // Legacy lat/lng fields for backward compatibility (virtual getters)
  lat: {
    type: Number,
    get: function() {
      return this.location?.coordinates?.[1];
    }
  },
  lng: {
    type: Number,
    get: function() {
      return this.location?.coordinates?.[0];
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
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    validate: {
      validator: function(v) {
        return (
          v == null ||
          (typeof v === 'string' && v.length > 0) ||
          (v && typeof v === 'object' && mongoose.Types.ObjectId.isValid(v))
        );
      },
      message: 'verifiedBy must be a valid user ObjectId or guest email.'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(v) {
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

// IMPORTANT: Only ONE 2dsphere index for location
GymSchema.index({ location: '2dsphere' });

// Other non-geospatial indexes
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

// Helper method to get lat/lng for backward compatibility
GymSchema.methods.getLatLng = function() {
  if (this.location && this.location.coordinates) {
    return {
      lat: this.location.coordinates[1],
      lng: this.location.coordinates[0]
    };
  }
  return { lat: null, lng: null };
};

// Method to calculate distance from a point
GymSchema.methods.distanceFrom = function(lat, lng) {
  const R = 3958.8; // Earth's radius in miles
  const gymLat = this.location.coordinates[1];
  const gymLng = this.location.coordinates[0];
  
  const dLat = toRadians(lat - gymLat);
  const dLon = toRadians(lng - gymLng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(gymLat)) * Math.cos(toRadians(lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Static method to find gyms within radius
GymSchema.statics.findNearby = async function(lat, lng, radiusMiles = 25) {
  try {
    const results = await this.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat] // GeoJSON uses [lng, lat] order
          },
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
    
    return results;
  } catch (error) {
    console.error('Error in findNearby:', error);
    // Fallback to simple query if geospatial fails
    return this.find({ isActive: true }).limit(20);
  }
};

// Pre-save middleware to ensure GeoJSON format
GymSchema.pre('save', function(next) {
  // If old format data exists, convert it
  if (this.isNew && !this.location.coordinates && this.lat !== undefined && this.lng !== undefined) {
    this.location.coordinates = [this.lng, this.lat];
  }
  next();
});

// Static method to migrate existing gyms to new format
GymSchema.statics.migrateToGeoJSON = async function() {
  const gyms = await this.find({
    $or: [
      { 'location.coordinates': { $exists: false } },
      { 'location.type': { $ne: 'Point' } }
    ]
  });
  
  for (const gym of gyms) {
    // Look for lat/lng in various places
    let lat, lng;
    
    if (gym.location && typeof gym.location.lat === 'number' && typeof gym.location.lng === 'number') {
      lat = gym.location.lat;
      lng = gym.location.lng;
    } else if (typeof gym.lat === 'number' && typeof gym.lng === 'number') {
      lat = gym.lat;
      lng = gym.lng;
    }
    
    if (lat && lng) {
      gym.location = {
        type: 'Point',
        coordinates: [lng, lat],
        address: gym.location?.address || '',
        city: gym.location?.city || '',
        state: gym.location?.state || '',
        country: gym.location?.country || 'US',
        zipCode: gym.location?.zipCode || ''
      };
      await gym.save();
    }
  }
};

const Gym = mongoose.model('Gym', GymSchema);
export default Gym;
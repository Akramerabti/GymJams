// server/src/models/GymBrosProfile.js

import mongoose from 'mongoose';

const GymBrosProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true, // Allow profiles without userId for guest users
  },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 99 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  height: { type: Number, required: true },
  heightUnit: { type: String, enum: ['cm', 'inches'], default: 'cm' },
  bio: { type: String }, // Added bio/about me field
  religion: { type: String }, // Added religion field
  politicalStance: { type: String }, // Added political stance field
  sexualOrientation: { type: String }, // Added sexual orientation field
  interests: [{ type: String }],
  work: { type: String },
  studies: { type: String },
  phone: { type: String },
  workoutTypes: [{ type: String }],
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true,
  },
  preferredTime: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Late Night', 'Weekends Only', 'Flexible'],
    required: true,
  },
  goals: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: 'US' },
    zipCode: { type: String },
    source: { 
      type: String, 
      enum: ['gps', 'ip-geolocation', 'manual', 'imported'],
      default: 'manual'
    },
    accuracy: {
      type: String,
      enum: ['high', 'medium', 'low', 'approximate'],
      default: 'medium'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Primary gym where user works out most
  primaryGym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym'
  },
  // Enhanced gym associations with more details
  gyms: [{
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true
    },
    membershipType: {
      type: String,
      enum: ['member', 'day_pass', 'guest', 'trial', 'owner', 'staff', 'volunteer'],
      default: 'member'
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Frequency of visits
    visitFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'occasional'],
      default: 'weekly'
    },
    // Preferred workout times at this facility
    preferredTimes: [{
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Late Night']
    }],
    // User's role or status at this facility
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'active'
    },
    // Notes about this gym association
    notes: {
      type: String,
      maxlength: 500
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    lastVisit: {
      type: Date
    }
  }],
  // Groups user belongs to
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosGroup'
  }],
  // Image handling fields
  profileImage: { 
    type: String, 
    default: null
  }, // Main profile image URL
  images: [{ 
    type: String 
  }], // Array of image URLs
  isProfileComplete: { type: Boolean, default: false },
  lastActive: {
    type: Date,
    default: Date.now
  },
  metrics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    matches: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 50 }
  },
  // For guest users
  guestCreatedAt: { 
    type: Date, 
    default: null 
  },
  isGuest: { 
    type: Boolean, 
    default: false 
  },
  // Preferences for matching
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 99 }
    },
    maxDistance: { type: Number, default: 25 }, // in miles
    showMe: {
      type: String,
      enum: ['everyone', 'same_gym_only', 'nearby_only'],
      default: 'everyone'
    },
    experienceLevelPreference: [{
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced']
    }]
  }
}, {
  timestamps: true,
});

// Indexes for better performance
GymBrosProfileSchema.index({ 'location.lat': 1, 'location.lng': 1 });
GymBrosProfileSchema.index({ phone: 1 }, { sparse: true });
GymBrosProfileSchema.index({ userId: 1 }, { sparse: true });
GymBrosProfileSchema.index({ primaryGym: 1 });
GymBrosProfileSchema.index({ 'gyms.gym': 1 });
GymBrosProfileSchema.index({ isProfileComplete: 1, isGuest: 1 });
GymBrosProfileSchema.index({ lastActive: 1 });

// Pre-save middleware to handle data normalization and validation
GymBrosProfileSchema.pre('save', function (next) {
  if (!this.images) {
    this.images = [];
  }
  
  const normalizeImagePath = (imagePath) => {
    if (!imagePath) return null;

    // Remove blob URLs - the critical part!
    if (typeof imagePath === 'string' && imagePath.startsWith('blob:')) {
      console.warn('🔴 Removing blob URL:', imagePath);
      return null;
    }

    // IMPORTANT: Don't modify Supabase URLs - they start with http/https
    if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
      return imagePath;
    }

    // Fix paths with duplicate "/uploads/" prefixes (legacy only)
    if (typeof imagePath === 'string' && imagePath.match(/\/uploads.*\/uploads/)) {
      const filename = imagePath.split('/').pop();
      return `/uploads/${filename}`;
    }

    if (typeof imagePath === 'string' && imagePath.includes('\\')) {
      const normalized = imagePath.replace(/\\/g, '/');
      if (!normalized.startsWith('/uploads/') && !normalized.startsWith('http')) {
        const filename = normalized.split('/').pop();
        return `/uploads/${filename}`;
      }
      return normalized;
    }

    // Only normalize legacy local paths (not Supabase URLs)
    if (typeof imagePath === 'string' && !imagePath.startsWith('/uploads/') && !imagePath.startsWith('http')) {
      return `/uploads/${imagePath.split('/').pop()}`;
    }

    return imagePath;
  };

  // Normalize profileImage path
  if (this.profileImage) {
    const normalized = normalizeImagePath(this.profileImage);
    if (normalized) {
      this.profileImage = normalized;
    } else if (this.images && this.images.length > 0) {
      const validImages = this.images.filter(img => img && !img.startsWith('blob:'));
      if (validImages.length > 0) {
        this.profileImage = validImages[0];
      }
    }
  }

  const originalCount = this.images.length;
  this.images = this.images
    .map(normalizeImagePath) 
    .filter(path => path !== null); 

  if (this.profileImage && !this.images.includes(this.profileImage)) {
    this.images.push(this.profileImage);
  }

  if (!this.profileImage && this.images.length > 0) {
    this.profileImage = this.images[0];
  }

  // Ensure primary gym is in the gyms array
  if (this.primaryGym && this.gyms) {
    const primaryGymExists = this.gyms.some(g => g.gym.toString() === this.primaryGym.toString());
    if (!primaryGymExists) {
      this.gyms.push({
        gym: this.primaryGym,
        isPrimary: true,
        membershipType: 'member',
        status: 'active'
      });
    } else {
      // Update existing entry to mark as primary
      this.gyms.forEach(g => {
        g.isPrimary = g.gym.toString() === this.primaryGym.toString();
      });
    }
  }

  // Ensure only one primary gym
  if (this.gyms) {
    let primaryCount = 0;
    this.gyms.forEach(g => {
      if (g.isPrimary) primaryCount++;
    });
    
    // If multiple primaries, keep only the first one
    if (primaryCount > 1) {
      let foundFirst = false;
      this.gyms.forEach(g => {
        if (g.isPrimary && foundFirst) {
          g.isPrimary = false;
        } else if (g.isPrimary && !foundFirst) {
          foundFirst = true;
        }
      });
    }
  }

  // Update profile completeness
  this.isProfileComplete = Boolean(
    this.name &&
    this.age &&
    this.gender &&
    this.height &&
    this.workoutTypes?.length &&
    this.experienceLevel &&
    this.preferredTime &&
    this.location?.lat &&
    this.location?.lng &&
    this.location?.address &&
    this.images?.length >= 1
  );

  next();
});

// Instance methods
GymBrosProfileSchema.methods.addGym = function(gymId, options = {}) {
  const gymAssociation = {
    gym: gymId,
    membershipType: options.membershipType || 'member',
    isPrimary: options.isPrimary || false,
    visitFrequency: options.visitFrequency || 'weekly',
    preferredTimes: options.preferredTimes || [],
    status: options.status || 'active',
    notes: options.notes || ''
  };

  // Check if gym already exists
  const existingIndex = this.gyms.findIndex(g => g.gym.toString() === gymId.toString());
  
  if (existingIndex !== -1) {
    // Update existing association
    this.gyms[existingIndex] = { ...this.gyms[existingIndex].toObject(), ...gymAssociation };
  } else {
    // Add new association
    this.gyms.push(gymAssociation);
  }

  // Set as primary gym if specified
  if (options.isPrimary) {
    this.primaryGym = gymId;
    // Unset other primary flags
    this.gyms.forEach(g => {
      g.isPrimary = g.gym.toString() === gymId.toString();
    });
  }

  return this;
};

GymBrosProfileSchema.methods.removeGym = function(gymId) {
  this.gyms = this.gyms.filter(g => g.gym.toString() !== gymId.toString());
  
  // If removed gym was primary, clear primary
  if (this.primaryGym && this.primaryGym.toString() === gymId.toString()) {
    this.primaryGym = null;
    
    // Set first remaining gym as primary if any exist
    if (this.gyms.length > 0) {
      this.primaryGym = this.gyms[0].gym;
      this.gyms[0].isPrimary = true;
    }
  }

  return this;
};

GymBrosProfileSchema.methods.setPrimaryGym = function(gymId) {
  // Check if gym is in the list
  const gymExists = this.gyms.some(g => g.gym.toString() === gymId.toString());
  
  if (!gymExists) {
    throw new Error('Cannot set primary gym that is not in the gym list');
  }

  this.primaryGym = gymId;
  
  // Update primary flags
  this.gyms.forEach(g => {
    g.isPrimary = g.gym.toString() === gymId.toString();
  });

  return this;
};

GymBrosProfileSchema.methods.getActiveGyms = function() {
  return this.gyms.filter(g => g.isActive && g.status === 'active');
};

GymBrosProfileSchema.methods.updateLastVisit = function(gymId) {
  const gym = this.gyms.find(g => g.gym.toString() === gymId.toString());
  if (gym) {
    gym.lastVisit = new Date();
  }
  return this;
};

// Static methods
GymBrosProfileSchema.statics.findByGym = function(gymId, options = {}) {
  const query = {
    'gyms.gym': gymId,
    'gyms.status': options.status || 'active'
  };

  if (options.membershipType) {
    query['gyms.membershipType'] = options.membershipType;
  }

  return this.find(query).populate('gyms.gym');
};

GymBrosProfileSchema.statics.findNearbyWithCommonGyms = function(lat, lng, maxDistance = 25) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat]
        },
        distanceField: "distance",
        maxDistance: maxDistance * 1609.34, // Convert miles to meters
        spherical: true,
        query: { isProfileComplete: true, isGuest: false }
      }
    },
    {
      $lookup: {
        from: 'gyms',
        localField: 'gyms.gym',
        foreignField: '_id',
        as: 'gymDetails'
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

const GymBrosProfile = mongoose.model('GymBrosProfile', GymBrosProfileSchema);
export default GymBrosProfile;
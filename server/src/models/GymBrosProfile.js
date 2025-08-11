// server/src/models/GymBrosProfile.js - FIXED VERSION
import mongoose from 'mongoose';

const GymBrosProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true, // This creates an index, so don't add another one with schema.index()
  },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 99 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  height: { type: Number, required: true },
  heightUnit: { type: String, enum: ['cm', 'inches'], default: 'cm' },
  bio: { type: String },
  religion: { type: String },
  politicalStance: { type: String },
  sexualOrientation: { type: String },
  interests: [{ type: String }],
  work: { type: String },
  studies: { type: String },
  phone: { 
    type: String,
    sparse: true // This creates an index, so don't add another one with schema.index()
  },
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
  
  // AVATAR SYSTEM - Replace SVG with image-based avatars
  avatar: {
    type: {
      type: String,
      enum: ['mouse', 'human', 'cartoon'],
      default: 'mouse'
    },
    baseCharacter: {
      type: String,
      default: 'gym_mouse'
    },
    furColor: {
      type: String,
      default: '#8B4513',
      enum: ['#8B4513', '#6B7280', '#F3F4F6', '#1F2937', '#D97706', '#FEF3C7', '#FFC0CB', '#93C5FD']
    },
    clothing: {
      shirt: {
        style: {
          type: String,
          enum: ['none', 'tshirt', 'hoodie', 'tank', 'jersey', 'polo', 'button_shirt'],
          default: 'tshirt'
        },
        color: {
          type: String,
          default: '#3B82F6'
        },
        pattern: {
          type: String,
          enum: ['solid', 'stripes', 'dots', 'gym_logo', 'band_logo'],
          default: 'solid'
        },
        customImageUrl: { type: String }
      },
      pants: {
        style: {
          type: String,
          enum: ['shorts', 'joggers', 'leggings', 'jeans', 'sweatpants', 'board_shorts'],
          default: 'shorts'
        },
        color: {
          type: String,
          default: '#1F2937'
        },
        pattern: {
          type: String,
          enum: ['solid', 'stripes', 'camo', 'gym_logo'],
          default: 'solid'
        }
      },
      shoes: {
        style: {
          type: String,
          enum: ['sneakers', 'running', 'lifting', 'basketball', 'sandals', 'barefoot'],
          default: 'sneakers'
        },
        color: {
          type: String,
          default: '#FFFFFF'
        },
        brand: {
          type: String,
          enum: ['generic', 'nike', 'adidas', 'under_armour', 'reebok'],
          default: 'generic'
        }
      }
    },
    accessories: {
      headwear: {
        type: String,
        enum: ['none', 'cap', 'beanie', 'headband', 'sunglasses', 'glasses'],
        default: 'none'
      },
      jewelry: {
        type: String,
        enum: ['none', 'watch', 'chain', 'earrings', 'bracelet'],
        default: 'none'
      },
      gear: {
        type: String,
        enum: ['none', 'backpack', 'gym_bag', 'water_bottle', 'towel', 'headphones'],
        default: 'none'
      }
    },
    mood: {
      type: String,
      enum: ['happy', 'excited', 'determined', 'cool', 'neutral', 'pumped'],
      default: 'happy'
    },
    pose: {
      type: String,
      enum: ['standing', 'flexing', 'running', 'lifting', 'sitting', 'waving'],
      default: 'standing'
    },
    background: {
      type: String,
      enum: ['none', 'gym', 'outdoor', 'home', 'gradient'],
      default: 'none'
    },
    customAvatarUrl: { type: String },
    generatedImageUrl: { type: String },
    lastGenerated: { type: Date },
    version: { type: Number, default: 1 }
  },

  primaryGym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym'
  },
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
    visitFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'occasional'],
      default: 'weekly'
    },
    preferredTimes: [{
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Late Night']
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'active'
    },
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
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosGroup'
  }],
  profileImage: { 
    type: String, 
    default: null
  },
  images: [{ 
    type: String 
  }],
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
  guestCreatedAt: { 
    type: Date, 
    default: null 
  },
  isGuest: { 
    type: Boolean, 
    default: false 
  },
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 99 }
    },
    maxDistance: { type: Number, default: 25 },
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

// FIXED: Only define indexes that are NOT already created by field options
// The userId field already has sparse: true, so it creates its own index
// The phone field already has sparse: true, so it creates its own index
// Don't add them again with schema.index()

GymBrosProfileSchema.index({ 'location.lat': 1, 'location.lng': 1 });
GymBrosProfileSchema.index({ primaryGym: 1 });
GymBrosProfileSchema.index({ 'gyms.gym': 1 });
GymBrosProfileSchema.index({ isProfileComplete: 1, isGuest: 1 });
GymBrosProfileSchema.index({ lastActive: 1 });

// Add avatar-specific methods
GymBrosProfileSchema.methods.updateAvatar = function(avatarData) {
  this.avatar = { ...this.avatar, ...avatarData };
  this.avatar.version += 1;
  this.avatar.lastGenerated = null;
  this.avatar.generatedImageUrl = null;
  return this;
};

GymBrosProfileSchema.methods.invalidateAvatarCache = function() {
  this.avatar.lastGenerated = null;
  this.avatar.generatedImageUrl = null;
  this.avatar.version += 1;
  return this;
};

// Pre-save middleware (existing logic + avatar initialization)
GymBrosProfileSchema.pre('save', function (next) {
  // Initialize avatar if not present
  if (!this.avatar) {
    this.avatar = {
      type: 'mouse',
      baseCharacter: 'gym_mouse',
      furColor: '#8B4513',
      clothing: {
        shirt: { style: 'tshirt', color: '#3B82F6', pattern: 'solid' },
        pants: { style: 'shorts', color: '#1F2937', pattern: 'solid' },
        shoes: { style: 'sneakers', color: '#FFFFFF', brand: 'generic' }
      },
      accessories: {
        headwear: 'none',
        jewelry: 'none',
        gear: 'none'
      },
      mood: 'happy',
      pose: 'standing',
      background: 'none',
      version: 1
    };
  }

  // Existing normalization logic...
  if (!this.images) {
    this.images = [];
  }
  
  const normalizeImagePath = (imagePath) => {
    if (!imagePath) return null;
    if (typeof imagePath === 'string' && imagePath.startsWith('blob:')) {
      console.warn('🔴 Removing blob URL:', imagePath);
      return null;
    }
    if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
      return imagePath;
    }
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
    if (typeof imagePath === 'string' && !imagePath.startsWith('/uploads/') && !imagePath.startsWith('http')) {
      return `/uploads/${imagePath.split('/').pop()}`;
    }
    return imagePath;
  };

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

  // Rest of existing pre-save logic...
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
      this.gyms.forEach(g => {
        g.isPrimary = g.gym.toString() === this.primaryGym.toString();
      });
    }
  }

  if (this.gyms) {
    let primaryCount = 0;
    this.gyms.forEach(g => {
      if (g.isPrimary) primaryCount++;
    });
    
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
    (this.images?.length >= 1 || this.avatar?.generatedImageUrl)
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
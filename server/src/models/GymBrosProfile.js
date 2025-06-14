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
  },
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
  }
}, {
  timestamps: true,
});

GymBrosProfileSchema.index({ 'location.lat': 1, 'location.lng': 1 });
GymBrosProfileSchema.index({ phone: 1 }, { sparse: true });


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

  const removedCount = originalCount - this.images.length;

  if (this.profileImage && !this.images.includes(this.profileImage)) {
    this.images.push(this.profileImage);
  }

  if (!this.profileImage && this.images.length > 0) {
    this.profileImage = this.images[0];
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
    this.images?.length >= 1
  );

  next();
});

const GymBrosProfile = mongoose.model('GymBrosProfile', GymBrosProfileSchema);
export default GymBrosProfile;
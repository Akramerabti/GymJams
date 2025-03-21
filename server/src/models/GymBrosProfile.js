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

// Fix: Use GymBrosProfileSchema (uppercase S) instead of gymBrosProfileSchema (lowercase s)
GymBrosProfileSchema.index({ 'location.lat': 1, 'location.lng': 1 });
GymBrosProfileSchema.index({ phone: 1 }, { sparse: true });


// In server/src/models/GymBrosProfile.js
// Replace the pre-save hook with this enhanced version:

GymBrosProfileSchema.pre('save', function (next) {
  console.log('Running pre-save hook for GymBrosProfile');
  console.log('Original images:', this.images);
  
  // Ensure images array exists
  if (!this.images) {
    this.images = [];
  }

  // Helper function to normalize image paths and remove blob URLs
  const normalizeImagePath = (imagePath) => {
    if (!imagePath) return null;

    // Remove blob URLs - the critical part!
    if (typeof imagePath === 'string' && imagePath.startsWith('blob:')) {
      console.warn('🔴 Removing blob URL:', imagePath);
      return null;
    }

    // Fix paths containing "/gym-bros/"
    if (typeof imagePath === 'string' && imagePath.includes('/gym-bros/')) {
      console.warn('Fixing gym-bros path:', imagePath);
      const filename = imagePath.split('/').pop();
      return `/uploads/${filename}`;
    }

    // Fix paths with duplicate "/uploads/" prefixes
    if (typeof imagePath === 'string' && imagePath.match(/\/uploads.*\/uploads/)) {
      console.warn('Fixing duplicate uploads path:', imagePath);
      const filename = imagePath.split('/').pop();
      return `/uploads/${filename}`;
    }

    // Fix Windows-style backslashes in paths
    if (typeof imagePath === 'string' && imagePath.includes('\\')) {
      console.warn('Fixing Windows backslashes:', imagePath);
      const normalized = imagePath.replace(/\\/g, '/');
      if (!normalized.startsWith('/uploads/')) {
        const filename = normalized.split('/').pop();
        return `/uploads/${filename}`;
      }
      return normalized;
    }

    // Ensure the path starts with "/uploads/"
    if (typeof imagePath === 'string' && !imagePath.startsWith('/uploads/') && !imagePath.startsWith('http')) {
      console.warn('Fixing missing /uploads/ prefix:', imagePath);
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
      // If profileImage was a blob and got nullified, use the first valid image instead
      const validImages = this.images.filter(img => img && !img.startsWith('blob:'));
      if (validImages.length > 0) {
        this.profileImage = validImages[0];
      }
    }
  }

  // Normalize and filter images array paths - IMPORTANT: Must filter out ALL blob URLs
  const originalCount = this.images.length;
  this.images = this.images
    .map(normalizeImagePath) // Normalize each path
    .filter(path => path !== null); // Remove any nullified paths (including blob URLs)

  const removedCount = originalCount - this.images.length;
  if (removedCount > 0) {
    console.log(`🧹 Removed ${removedCount} invalid image paths (blob URLs)`);
  }

  console.log('Normalized images:', this.images);

  // Ensure profileImage is part of the images array
  if (this.profileImage && !this.images.includes(this.profileImage)) {
    this.images.push(this.profileImage);
  }

  // If profileImage is not set but images exist, set it to the first image
  if (!this.profileImage && this.images.length > 0) {
    this.profileImage = this.images[0];
  }

  // Set isProfileComplete to true if all required fields are present
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
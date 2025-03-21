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

// Add middleware to ensure images array always exists
GymBrosProfileSchema.pre('save', function(next) {
  if (!this.images) {
    this.images = [];
  }
  
  // If profileImage is set but not in images array, add it
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
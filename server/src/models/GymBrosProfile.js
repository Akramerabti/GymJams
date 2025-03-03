import mongoose from 'mongoose';

const GymBrosProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
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
  images: [{ type: String }], // Array of image URLs
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
}, {
  timestamps: true,
});

// Fix: Use GymBrosProfileSchema (uppercase S) instead of gymBrosProfileSchema (lowercase s)
GymBrosProfileSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const GymBrosProfile = mongoose.model('GymBrosProfile', GymBrosProfileSchema);
export default GymBrosProfile;
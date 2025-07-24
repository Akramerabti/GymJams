import mongoose from 'mongoose';

const coachingPromoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount: { type: Number, required: true, min: 1, max: 100 },
  subscription: {
    type: String,
    required: true,
    enum: ['all', 'basic', 'premium', 'elite'],
  },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track users who have used this promo
  createdAt: { type: Date, default: Date.now }
});

const CoachingPromo = mongoose.model('CoachingPromo', coachingPromoSchema);
export default CoachingPromo;

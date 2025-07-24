import CoachingPromo from '../models/CoachingPromo.js';

// Create a new coaching promo code
export const createCoachingPromo = async (req, res) => {
  try {
    const { code, discount, subscription } = req.body;
    if (!code || !discount || !subscription) {
      return res.status(400).json({ message: 'Code, discount, and subscription are required.' });
    }
    const exists = await CoachingPromo.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(409).json({ message: 'Promo code already exists.' });
    }
    const promo = await CoachingPromo.create({
      code: code.toUpperCase(),
      discount: Number(discount),
      subscription
    });
    res.status(201).json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Validate a coaching promo code and check if user has used it
export const validateCoachingPromo = async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required.' });
    const promo = await CoachingPromo.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ message: 'Invalid promo code.' });

    // If userId is provided, check if user has already used this promo
    if (userId && promo.usedBy && promo.usedBy.some(id => id.toString() === userId)) {
      return res.status(409).json({ message: 'Promo code already used by this user.' });
    }

    res.status(200).json({ valid: true, discount: promo.discount, subscription: promo.subscription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a promo code as used by a user
export const markPromoAsUsed = async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ message: 'Code and userId are required.' });
    }
    const promo = await CoachingPromo.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ message: 'Promo code not found.' });

    // Only add user if not already present
    if (!promo.usedBy.some(id => id.toString() === userId)) {
      promo.usedBy.push(userId);
      await promo.save();
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List all coaching promos
export const getCoachingPromos = async (req, res) => {
  try {
    // Ignore guestToken or any other query params, just return all promos
    const promos = await CoachingPromo.find({});
    res.status(200).json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import CouponCode from '../models/CouponCode.js';

// Return all coupon codes of type 'coaching'
export const getCoachingPromos = async (req, res) => {
  try {
    const promos = await CouponCode.find({ type: 'coaching' });
    res.status(200).json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

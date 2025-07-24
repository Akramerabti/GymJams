import CouponCode from '../models/CouponCodes.js';


export const createCouponCode = async (req, res) => {
  try {
    const { code, discount, type, subscription, products, categories, maxUses } = req.body;
    if (!code || !discount || !type) {
      return res.status(400).json({ message: 'Code, discount, and type are required.' });
    }
    const exists = await CouponCode.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }
    const coupon = await CouponCode.create({
      code: code.toUpperCase(),
      discount: Number(discount),
      type,
      subscription: type === 'coaching' || type === 'both' ? subscription : undefined,
      products: type === 'product' || type === 'both' ? products : [],
      categories: type === 'product' || type === 'both' ? categories : [],
      maxUses: maxUses ? Number(maxUses) : undefined
    });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Validate a coupon code and check if user has used it or if maxUses is reached
export const validateCouponCode = async (req, res) => {
  try {
    const { code, userId, productId, category } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required.' });
    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code.' });

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(409).json({ message: 'Coupon code usage limit reached.' });
    }
    // If userId is provided, check if user has already used this coupon
    if (userId && coupon.usedBy && coupon.usedBy.some(id => id.toString() === userId)) {
      return res.status(409).json({ message: 'Coupon code already used by this user.' });
    }
    // For product coupons, check if product/category matches
    if (coupon.type === 'product' || coupon.type === 'both') {
      if (coupon.products.length > 0 && productId && !coupon.products.some(pid => pid.toString() === productId)) {
        return res.status(400).json({ message: 'Coupon does not apply to this product.' });
      }
      if (coupon.categories.length > 0 && category && !coupon.categories.includes(category)) {
        return res.status(400).json({ message: 'Coupon does not apply to this category.' });
      }
    }
    res.status(200).json({ valid: true, discount: coupon.discount, type: coupon.type, subscription: coupon.subscription, products: coupon.products, categories: coupon.categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a coupon code as used by a user
export const markCouponAsUsed = async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ message: 'Code and userId are required.' });
    }
    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Coupon code not found.' });

    // Only add user if not already present
    if (!coupon.usedBy.some(id => id.toString() === userId)) {
      coupon.usedBy.push(userId);
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List all coupon codes
export const getCouponCodes = async (req, res) => {
  try {
    const coupons = await CouponCode.find({});
    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import CouponCode from '../models/CouponCode.js';

export const updateCouponDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount } = req.body;
    if (!discount || isNaN(Number(discount)) || Number(discount) < 1 || Number(discount) > 100) {
      return res.status(400).json({ message: 'Discount must be a number between 1 and 100.' });
    }
    const coupon = await CouponCode.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code not found.' });
    }
    coupon.discount = Number(discount);
    await coupon.save();
    res.status(200).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



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

export const validateCouponCode = async (req, res) => {
  try {
    const { code, userId, productId, category, subscription } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required.' });
    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code.' });

    // Debug info
    console.log('--- Coupon Validation Debug ---');
    console.log('Request:', { code, userId, productId, category, subscription });
    console.log('Coupon:', coupon);

    // Check max uses
    if (coupon.maxUses && coupon.usedBy.length >= coupon.maxUses) {
      console.log('Coupon usage limit reached');
      // Delete coupon if maxUses is set and reached
      await CouponCode.deleteOne({ _id: coupon._id });
      return res.status(409).json({ valid: false, message: 'Coupon code usage limit reached and deleted.' });
    }
    // If userId is provided, check if user has already used this coupon
    if (userId && coupon.usedBy && coupon.usedBy.some(id => id.toString() === userId)) {
      console.log('Coupon already used by this user');
      return res.status(409).json({ message: 'Coupon code already used by this user.' });
    }
    // For product coupons, check if product/category matches
    if (coupon.type === 'product' || coupon.type === 'both') {
      if (coupon.products.length > 0 && productId && !coupon.products.some(pid => pid.toString() === productId)) {
        console.log('Coupon does not apply to this product');
        return res.status(400).json({ message: 'Coupon does not apply to this product.' });
      }
      if (coupon.categories.length > 0 && category && !coupon.categories.includes(category)) {
        console.log('Coupon does not apply to this category');
        return res.status(400).json({ message: 'Coupon does not apply to this category.' });
      }
    }
    // For coaching coupons, check subscription
    if ((coupon.type === 'coaching' || coupon.type === 'both') && coupon.subscription && coupon.subscription !== 'all') {
      if (subscription && coupon.subscription !== subscription) {
        console.log('Coupon does not apply to this subscription');
        return res.status(400).json({ message: 'Coupon does not apply to this subscription.' });
      }
    }
    console.log('Coupon valid!');
    res.status(200).json({ valid: true, discount: coupon.discount, type: coupon.type, subscription: coupon.subscription, products: coupon.products, categories: coupon.categories });
  } catch (err) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ message: err.message });
  }
};

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

export const getCouponCodes = async (req, res) => {
  try {
    const coupons = await CouponCode.find({});
    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete coupon code
export const deleteCouponCode = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await CouponCode.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon code not found.' });
    }
    res.status(200).json({ message: 'Coupon code deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

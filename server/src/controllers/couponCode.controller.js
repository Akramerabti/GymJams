import CouponCode from '../models/CouponCode.js';
import AmbassadorCode from '../models/AmbassadorCode.js';

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
    const { code, discount, type, subscription, products, categories, maxUses, duration, duration_in_months } = req.body;
    
    // Debug logging
    console.log('Creating coupon code with data:', {
      code, discount, type, subscription, products, categories, maxUses, duration, duration_in_months
    });
    
    if (!code || !discount || !type) {
      return res.status(400).json({ message: 'Code, discount, and type are required.' });
    }
    const exists = await CouponCode.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }
    let couponData = {
      code: code.toUpperCase(),
      discount: Number(discount),
      type,
      products: type === 'product' || type === 'both' ? products : [],
      categories: type === 'product' || type === 'both' ? categories : [],
      maxUses: maxUses ? Number(maxUses) : undefined
    };
    console.log('subscription:', subscription, 'type:', type);

    // Always set subscription to 'all' if type is coaching or both and subscription is empty
    if (type === 'coaching' || type === 'both') {
      couponData.subscription = subscription && subscription !== '' ? subscription : 'all';
    }

    if (type === 'coaching') {
      // Set duration with proper default if not provided or empty
      couponData.duration = duration && duration.trim() !== '' ? duration : 'once';
      if ((duration === 'repeating' || couponData.duration === 'repeating') && duration_in_months) {
        couponData.duration_in_months = Number(duration_in_months);
      }
    } else if (type === 'both') {
      couponData.duration = 'once';
    }
    
    // Final debug logging before creating the coupon
    console.log('Final couponData before creation:', couponData);
    
    const coupon = await CouponCode.create(couponData);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const validateCouponCode = async (req, res) => {
  try {
    const { code, userId, productId, category, type = 'all' } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code is required'
      });
    }

    const upperCode = code.toUpperCase();
    
    // FIRST: Try to find it as a regular coupon code (YOUR EXISTING LOGIC)
    const coupon = await CouponCode.findOne({ 
      code: upperCode,
      // Your existing coupon validation logic here
    });

    if (coupon) {
      // YOUR EXISTING COUPON VALIDATION LOGIC
      // Check if user already used it
      if (userId && coupon.usedBy && coupon.usedBy.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon code'
        });
      }

      // Check usage limits
      if (coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check if it applies to the requested type
      const isValidForType = 
        coupon.type === 'both' ||
        coupon.type === type ||
        (type === 'all' && (coupon.type === 'product' || coupon.type === 'coaching'));

      if (!isValidForType) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is not valid for this type of purchase'
        });
      }

      // Check if it applies to specific products
      if (coupon.products && coupon.products.length > 0 && productId) {
        if (!coupon.products.includes(productId)) {
          return res.status(400).json({
            success: false,
            message: 'This coupon is not valid for this product'
          });
        }
      }

      // Check if it applies to specific categories
      if (coupon.categories && coupon.categories.length > 0 && category) {
        if (!coupon.categories.includes(category)) {
          return res.status(400).json({
            success: false,
            message: 'This coupon is not valid for this category'
          });
        }
      }

      // Check subscription type for coaching coupons
      if (coupon.type === 'coaching' || coupon.type === 'both') {
        if (coupon.subscription && coupon.subscription !== 'all' && type !== coupon.subscription) {
          return res.status(400).json({
            success: false,
            message: 'This coupon is not valid for this subscription type'
          });
        }
      }

      return res.status(200).json({
        success: true,
        valid: true,
        codeType: 'coupon', // Add this to distinguish
        code: coupon.code,
        discount: coupon.discount,
        couponType: coupon.type,
        data: {
          _id: coupon._id,
          maxUses: coupon.maxUses,
          usedCount: coupon.usedCount,
          duration: coupon.duration,
          duration_in_months: coupon.duration_in_months
        }
      });
    }

    // SECOND: If not found as regular coupon, try as ambassador code
    const ambassadorCode = await AmbassadorCode.findOne({
      code: upperCode,
      isActive: true
    }).populate('ambassador', 'firstName lastName email');

    if (ambassadorCode) {
      // Validate ambassador code
      if (ambassadorCode.expiryDate && ambassadorCode.expiryDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'This ambassador code has expired'
        });
      }

      if (ambassadorCode.maxUses && ambassadorCode.totalUses >= ambassadorCode.maxUses) {
        return res.status(400).json({
          success: false,
          message: 'This ambassador code has reached its usage limit'
        });
      }

      // Check if user already used this ambassador code (if you want to prevent multiple uses)
      // You could add a usedBy array to ambassador codes too if needed

      // Check if it applies to the requested type
      const validFor = ambassadorCode.validFor || ['all'];
      const isValidForType = 
        validFor.includes('all') ||
        validFor.includes(type) ||
        (type === 'all' && (validFor.includes('products') || validFor.includes('coaching')));

      if (!isValidForType) {
        return res.status(400).json({
          success: false,
          message: 'This ambassador code is not valid for this type of purchase'
        });
      }

      // Ambassador codes work for all products/categories by default
      // But you could add specific product/category restrictions if needed

      return res.status(200).json({
        success: true,
        valid: true,
        codeType: 'ambassador', // Add this to distinguish
        code: ambassadorCode.code,
        discount: ambassadorCode.discountPercentage,
        ambassador: {
          id: ambassadorCode.ambassador._id,
          name: `${ambassadorCode.ambassador.firstName} ${ambassadorCode.ambassador.lastName}`,
          email: ambassadorCode.ambassador.email
        },
        data: {
          _id: ambassadorCode._id,
          maxUses: ambassadorCode.maxUses,
          totalUses: ambassadorCode.totalUses,
          validFor: ambassadorCode.validFor
        }
      });
    }

    // Code not found anywhere
    return res.status(404).json({
      success: false,
      valid: false,
      message: 'Invalid or inactive code'
    });

  } catch (error) {
    logger.error('Error validating code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate code',
      error: error.message
    });
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

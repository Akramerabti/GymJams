import CouponCode from '../models/CouponCode.js';
import AmbassadorCode from '../models/AmbassadorCode.js';
import logger from '../utils/logger.js';

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
    
    // Check if code exists in either CouponCode or AmbassadorCode
    const [existingCoupon, existingAmbassador] = await Promise.all([
      CouponCode.findOne({ code: code.toUpperCase() }),
      AmbassadorCode.findOne({ code: code.toUpperCase() })
    ]);
    
    if (existingCoupon || existingAmbassador) {
      return res.status(409).json({ message: 'Code already exists (either as coupon or ambassador code)' });
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
    const { code, userId, productId, category, subscription } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required.' });

    console.log('🔍 [CODE VALIDATION] Checking code:', code.toUpperCase());

    // First check if it's a regular coupon code
    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });
    
    if (coupon) {
      console.log('✅ [COUPON] Found coupon code:', coupon.code);
      
      // Debug info
      console.log('--- Coupon Validation Debug ---');
      console.log('Request:', { code, userId, productId, category, subscription });
      console.log('Coupon:', coupon);

      // Check max uses
      if (coupon.maxUses && coupon.usedBy.length >= coupon.maxUses) {
        console.log('❌ [COUPON] Usage limit reached');
        await CouponCode.deleteOne({ _id: coupon._id });
        return res.status(409).json({ valid: false, message: 'Coupon code usage limit reached and deleted.' });
      }
      
      // If userId is provided, check if user has already used this coupon
      if (userId && coupon.usedBy && coupon.usedBy.some(id => id.toString() === userId)) {
        console.log('❌ [COUPON] Already used by this user');
        return res.status(409).json({ message: 'Coupon code already used by this user.' });
      }
      
      // For product coupons, check if product/category matches
      if (coupon.type === 'product' || coupon.type === 'both') {
        if (coupon.products.length > 0 && productId && !coupon.products.some(pid => pid.toString() === productId)) {
          console.log('❌ [COUPON] Does not apply to this product');
          return res.status(400).json({ message: 'Coupon does not apply to this product.' });
        }
        if (coupon.categories.length > 0 && category && !coupon.categories.includes(category)) {
          console.log('❌ [COUPON] Does not apply to this category');
          return res.status(400).json({ message: 'Coupon does not apply to this category.' });
        }
      }
      
      // For coaching coupons, check subscription
      if ((coupon.type === 'coaching' || coupon.type === 'both') && coupon.subscription && coupon.subscription !== 'all') {
        if (subscription && coupon.subscription !== subscription) {
          console.log('❌ [COUPON] Does not apply to this subscription');
          return res.status(400).json({ message: 'Coupon does not apply to this subscription.' });
        }
      }
      
      console.log('✅ [COUPON] Valid!');
      return res.status(200).json({ 
        valid: true, 
        discount: coupon.discount, 
        type: coupon.type, 
        subscription: coupon.subscription, 
        products: coupon.products, 
        categories: coupon.categories,
        codeType: 'coupon'
      });
    }

    // If not found as coupon, check if it's an ambassador code
    console.log('🔍 [AMBASSADOR] Checking for ambassador code...');
    const ambassadorCode = await AmbassadorCode.findOne({ code: code.toUpperCase() })
      .populate('ambassador', 'firstName lastName email role payoutSetupComplete');
    
    if (ambassadorCode) {
      console.log('✅ [AMBASSADOR] Found ambassador code:', ambassadorCode.code);
      console.log('--- Ambassador Code Validation Debug ---');
      console.log('Request:', { code, userId, productId, category, subscription });
      console.log('Ambassador Code:', ambassadorCode);

      // Check if code is active
      if (!ambassadorCode.isActive) {
        console.log('❌ [AMBASSADOR] Code is inactive');
        return res.status(400).json({ message: 'Ambassador code is currently inactive.' });
      }

      // Check expiry date
      if (ambassadorCode.expiryDate && new Date() > new Date(ambassadorCode.expiryDate)) {
        console.log('❌ [AMBASSADOR] Code has expired');
        return res.status(400).json({ message: 'Ambassador code has expired.' });
      }

      // Check max uses
      if (ambassadorCode.maxUses && ambassadorCode.totalUses >= ambassadorCode.maxUses) {
        console.log('❌ [AMBASSADOR] Usage limit reached');
        return res.status(409).json({ message: 'Ambassador code usage limit reached.' });
      }

      // Check if ambassador has payout setup (important for commission processing)
      if (!ambassadorCode.ambassador?.payoutSetupComplete) {
        console.log('⚠️ [AMBASSADOR] Ambassador payout not complete, but code still valid for customer');
      }

      // Convert validFor array to type string for compatibility
      let codeType = 'both'; // default
      if (ambassadorCode.validFor?.includes('products')) {
        codeType = 'product';
      } else if (ambassadorCode.validFor?.includes('coaching')) {
        codeType = 'coaching';
      } else if (ambassadorCode.validFor?.includes('all')) {
        codeType = 'both';
      }

      // For product validation
      if (codeType === 'product' && subscription) {
        console.log('❌ [AMBASSADOR] Product-only code used for subscription');
        return res.status(400).json({ message: 'This ambassador code is only valid for products.' });
      }

      // For coaching validation  
      if (codeType === 'coaching' && (productId || category)) {
        console.log('❌ [AMBASSADOR] Coaching-only code used for product');
        return res.status(400).json({ message: 'This ambassador code is only valid for coaching subscriptions.' });
      }

      console.log('✅ [AMBASSADOR] Valid!');
      return res.status(200).json({
        valid: true,
        discount: ambassadorCode.discountPercentage,
        type: codeType,
        subscription: codeType === 'coaching' || codeType === 'both' ? 'all' : undefined,
        products: [],
        categories: [],
        codeType: 'ambassador',
        ambassadorName: `${ambassadorCode.ambassador?.firstName} ${ambassadorCode.ambassador?.lastName}`
      });
    }

    // Code not found in either collection
    console.log('❌ [NOT FOUND] Code not found in coupons or ambassador codes');
    return res.status(404).json({ message: 'Invalid code.' });

  } catch (err) {
    console.error('Code validation error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const markCouponAsUsed = async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ message: 'Code and userId are required.' });
    }

    console.log('🏷️ [MARK AS USED] Code:', code.toUpperCase(), 'User:', userId);

    // First check if it's a regular coupon code
    const coupon = await CouponCode.findOne({ code: code.toUpperCase() });
    
    if (coupon) {
      console.log('✅ [COUPON] Marking coupon as used');
      // Only add user if not already present
      if (!coupon.usedBy.some(id => id.toString() === userId)) {
        coupon.usedBy.push(userId);
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
        console.log('✅ [COUPON] Marked as used, total uses:', coupon.usedCount);
      }
      return res.status(200).json({ success: true, codeType: 'coupon' });
    }

    // Check if it's an ambassador code
    const ambassadorCode = await AmbassadorCode.findOne({ code: code.toUpperCase() })
      .populate('ambassador', 'firstName lastName email');
    
    if (ambassadorCode) {
      console.log('✅ [AMBASSADOR] Marking ambassador code as used');
      
      // Update usage count
      ambassadorCode.totalUses = (ambassadorCode.totalUses || 0) + 1;
      await ambassadorCode.save();
      
      logger.info(`[AMBASSADOR] Code ${ambassadorCode.code} used by user ${userId}. Total uses: ${ambassadorCode.totalUses}`);
      console.log('✅ [AMBASSADOR] Marked as used, total uses:', ambassadorCode.totalUses);
      
      return res.status(200).json({ 
        success: true, 
        codeType: 'ambassador',
        ambassadorName: `${ambassadorCode.ambassador?.firstName} ${ambassadorCode.ambassador?.lastName}`,
        discount: ambassadorCode.discountPercentage
      });
    }

    console.log('❌ [NOT FOUND] Code not found for marking as used');
    return res.status(404).json({ message: 'Code not found.' });

  } catch (err) {
    console.error('Error marking code as used:', err);
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
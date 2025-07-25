import express from 'express';
import { getCoachingPromos } from '../controllers/coachingPromos.controller.js';
import { 
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  applyPromotion,
  getProductById,
} from '../controllers/product.controller.js';
import {
  createCouponCode,
  validateCouponCode,
  getCouponCodes,
  markCouponAsUsed,
  updateCouponDiscount,
} from '../controllers/couponCode.controller.js';
import upload from '../config/storage.js';

const router = express.Router();

router.get('/', getProducts);

// Delete coupon code
import { deleteCouponCode } from '../controllers/couponCode.controller.js';
import { addReview } from '../controllers/product.controller.js';
router.delete('/coupon-codes/:id', deleteCouponCode);


router.post('/coupon-codes', createCouponCode);
router.post('/coupon-codes/validate', validateCouponCode);
router.post('/coupon-codes/mark-used', markCouponAsUsed);
router.get('/coupon-codes', getCouponCodes);

// Get all coaching promos
router.get('/coaching-promos', getCoachingPromos);

// Get all coaching promos
router.get('/coaching-promos', getCoachingPromos);

// Edit coupon code discount (Taskforce/admin only in real app)
router.put('/coupon-codes/:id/discount', updateCouponDiscount);

router.get('/:id', getProductById);

// Get product reviews and ratedBy
import { getProductReviews } from '../controllers/product.controller.js';
router.get('/:id/reviews', getProductReviews);

// Add or update review for product
router.post('/:id/reviews', addReview);

// Taskforce-only routes
router.post('/', upload.array('images', 8), addProduct);
router.put('/:id', upload.array('images', 8), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/promotion', applyPromotion);

export default router;
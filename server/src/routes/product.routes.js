import express from 'express';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  applyPromotion,
  getProductById,
} from '../controllers/product.controller.js';
import {
  createCoachingPromo,
  validateCoachingPromo,
  getCoachingPromos,
  markPromoAsUsed, // <-- import the new controller
} from '../controllers/coachingPromo.controller.js';
import upload from '../config/storage.js';

const router = express.Router();

// Public route to get products
router.get('/', getProducts);

// Coaching promo routes (must come BEFORE /:id)
router.post('/coaching-promos', createCoachingPromo);
router.post('/coaching-promos/validate', validateCoachingPromo);
router.post('/coaching-promos/mark-used', markPromoAsUsed); // <-- new route
router.get('/coaching-promos', getCoachingPromos);

router.get('/:id', getProductById);

// Taskforce-only routes
router.post('/', upload.array('images', 8), addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/promotion', applyPromotion);

export default router;
import express from 'express';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  applyPromotion,
} from '../controllers/product.controller.js';

import upload from '../config/storage.js';

const router = express.Router();

// Public route to get products
router.get('/', getProducts);

// Taskforce-only routes
router.post('/', upload.array('images', 8), addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/promotion', applyPromotion);


export default router;
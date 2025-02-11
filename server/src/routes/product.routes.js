import express from 'express';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  applyPromotion,
} from '../controllers/product.controller.js';
import { isTaskforce } from '../middleware/auth.middleware.js';
import { validateProduct } from '../middleware/validate.middleware.js';

import upload from '../config/storage.js';

const router = express.Router();

// Public route to get products
router.get('/', getProducts);

// Taskforce-only routes
router.post('/', isTaskforce,validateProduct, addProduct);
router.put('/:id', isTaskforce, updateProduct);
router.delete('/:id', isTaskforce, deleteProduct);
router.post('/:id/promotion', isTaskforce, applyPromotion);


export default router;
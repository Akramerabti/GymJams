import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
} from '../controllers/product.controller.js';
import { authenticateJWT } from '../config/passport.js';
import { validateProduct } from '../middleware/validate.middleware.js';
import upload from '../config/storage.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.post(
  '/',
  authenticateJWT,
  upload.single('image'),
  validateProduct,
  createProduct
);

export default router;
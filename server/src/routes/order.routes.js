import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getOrders,
  getOrderDetails
} from '../controllers/order.controller.js';

const router = express.Router();

// Protected routes
router.get('/orders', authenticate, getOrders);
router.get('/orders/:id', authenticate, getOrderDetails);

export default router;
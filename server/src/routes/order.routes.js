import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getOrders,
  getOrderDetails,
  createOrder,
  processPayment,
  cancelOrder,
  handleStripeWebhook
} from '../controllers/order.controller.js';

const router = express.Router();

// Stripe webhook - needs raw body parser
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Get all orders for the current user
router.get('/', getOrders);

// Get order details
router.get('/:id', getOrderDetails);

// Create a new order
router.post('/', createOrder);

// Process payment (after Stripe confirmation)
router.post('/payment', processPayment);

// Cancel an order
router.post('/:id/cancel', cancelOrder);

export default router;
import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
  getOrders,
  getOrderDetails,
  createOrder,
  updateOrder,
  processPayment,
  cancelOrder,
  handleStripeWebhook,
  getGuestOrder,
  updateOrderEmail
} from '../controllers/order.controller.js';

const router = express.Router();

// Stripe webhook - needs raw body parser
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Get all orders for the current user
router.get('/', optionalAuthenticate, getOrders);

// Get order details
router.get('/:id', optionalAuthenticate, getOrderDetails);

// Look up guest order by email and order ID
router.post('/guest/lookup', getGuestOrder);

// Create a new order
router.post('/', optionalAuthenticate, createOrder);

// Update an existing order
router.put('/:id', optionalAuthenticate, updateOrder);

// Process payment (after Stripe confirmation)
router.post('/payment', optionalAuthenticate, processPayment);

// Cancel an order
router.post('/:id/cancel', optionalAuthenticate, cancelOrder);

router.put('/:id/email', optionalAuthenticate, updateOrderEmail);


export default router;
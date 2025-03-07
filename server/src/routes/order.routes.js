import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
  getOrders,
  getOrderDetails,
  createOrder,
  updateOrder, // Add this new controller
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
router.get('/', optionalAuthenticate, getOrders);

// Get order details
router.get('/:id', optionalAuthenticate, getOrderDetails);

// Create a new order
router.post('/', optionalAuthenticate, createOrder);

// Update an existing order
router.put('/:id', optionalAuthenticate, updateOrder); // Add this new route

// Process payment (after Stripe confirmation)
router.post('/payment', optionalAuthenticate, processPayment);

// Cancel an order
router.post('/:id/cancel', optionalAuthenticate, cancelOrder);

export default router;
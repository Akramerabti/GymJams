// payment.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  addPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod
} from '../controllers/payment.controller.js';

const router = express.Router();

// Protected routes
router.post('/payment-methods', authenticate, addPaymentMethod);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.put('/payment-methods/:id', authenticate, updatePaymentMethod);
router.delete('/payment-methods/:id', authenticate, deletePaymentMethod);

export default router;
import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
} from '../controllers/order.controller.js';
import { authenticateJWT } from '../config/passport.js';
import { validateOrder } from '../middleware/validate.middleware.js';

const router = express.Router();

// All order routes are protected
router.use(authenticateJWT);

router.post('/', validateOrder, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

export default router;

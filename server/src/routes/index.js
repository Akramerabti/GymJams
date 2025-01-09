// routes/index.js
import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/subscription', subscriptionRoutes);  // Add this line
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);

export default router;
// routes/index.js
import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import stripeRoutes from './stripe.routes.js';
import gymBrosRoutes from './gymBrosRoutes.js';

const router = express.Router();

// API Routes

router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/stripe', stripeRoutes);
router.use('/gym-bros', gymBrosRoutes);


export default router;
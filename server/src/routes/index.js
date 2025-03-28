import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import stripeRoutes from './stripe.routes.js';
import gymBrosRoutes from './gymBrosRoutes.js';
import inventoryRoutes from './inventory.routes.js';
import clientRoutes from './client.routes.js';
import applicationRoutes from './application.routes.js';
import supportTicketRoutes from './supportTicket.routes.js';

const router = express.Router();

// API Routes
router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/stripe', stripeRoutes);
router.use('/gym-bros', gymBrosRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/client', clientRoutes);
router.use('/applications', applicationRoutes);
router.use('/support-tickets', supportTicketRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
import express from 'express';
import authRoutes from './auth.routes.js';
import paymentRoutes from './payment.routes.js'; // Add this
import orderRoutes from './order.routes.js'; // Add this

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes); // Add this
router.use('/orders', orderRoutes); // Add this

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
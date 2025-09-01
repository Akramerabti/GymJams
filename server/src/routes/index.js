import express from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import stripeRoutes from './stripe.routes.js';
import gymBrosRoutes from './gymBrosRoutes.js';
import gymBrosLocationRoutes from './gymBrosLocation.routes.js';
import inventoryRoutes from './inventory.routes.js';
import clientRoutes from './client.routes.js';
import applicationRoutes from './application.routes.js';
import supportTicketRoutes from './supportTicket.routes.js';
import blogRoutes from './blog.routes.js'; // Import the blog routes
import thirdPartyLogisticsRoutes from './thirdPartyLogistics.routes.js'; // Import the 3PL routes
import notificationRoutes from './notification.routes.js'; // Import the notification routes
import ambassadorRoutes from './ambassador.routes.js'; // Import the ambassador routes

const router = express.Router();

// API Routes
router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/stripe', stripeRoutes);
router.use('/gym-bros', gymBrosRoutes);
router.use('/gym-bros-location', gymBrosLocationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/client', clientRoutes);
router.use('/applications', applicationRoutes);
router.use('/support-tickets', supportTicketRoutes);
router.use('/blog', blogRoutes);
router.use('/3pl', thirdPartyLogisticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ambassador', ambassadorRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
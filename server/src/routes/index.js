import express from 'express';
import authRoutes from './auth.routes.js';
// Import other route files here

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
// Mount other routes here

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
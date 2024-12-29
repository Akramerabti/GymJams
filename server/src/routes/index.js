import express from 'express';
import apiRoutes from './api.routes.js';

const router = express.Router();

// Mount API routes
router.use('/api', apiRoutes);

// Base route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to GymShop API' });
});

// 404 handler
router.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default router;
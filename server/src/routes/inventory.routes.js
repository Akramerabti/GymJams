import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { isAdmin, isTaskforce } from '../middleware/auth.middleware.js';
import {
  getInventory,
  updateInventory,
  validateStock,
  getLowStockAlerts,
  getInventoryHistory
} from '../controllers/inventory.controller.js';

const router = express.Router();

// Public route for validating stock during checkout
router.post('/validate', validateStock);

// Protected routes - require authentication
router.use(authenticate);

// Get all inventory - accessible to all authenticated users
router.get('/', getInventory);

// Routes requiring admin or taskforce role
router.use(isTaskforce);

// Update product inventory
router.put('/:productId', updateInventory);

// Get low stock alerts
router.get('/low-stock', getLowStockAlerts);

// Get inventory history for a specific product
router.get('/:productId/history', getInventoryHistory);

export default router;
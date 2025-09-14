// server/src/routes/thirdPartyLogistics.routes.js
import express from 'express';
import { authenticate, isAdmin, isTaskforce } from '../middleware/auth.middleware.js';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  syncInventory,
  createFulfillmentOrder,
  getShippingRates,
  updateOrderTracking,
  handle3PLWebhook
} from '../controllers/thirdPartyLogistics.controller.js';

const router = express.Router();

// PUBLIC ENDPOINT - No auth needed for shipping rates
router.post('/shipping/rates', getShippingRates);

// Webhooks - no auth needed
router.post('/webhooks/:provider', express.json(), handle3PLWebhook);

// Protect admin routes
router.use(authenticate);
router.use(isTaskforce);

// Warehouse management
router.get('/warehouses', getWarehouses);
router.post('/warehouses', isAdmin, createWarehouse);
router.put('/warehouses/:id', isAdmin, updateWarehouse);

// Inventory management
router.post('/warehouses/:warehouseId/sync', syncInventory);

// Order fulfillment
router.post('/orders/:orderId/fulfill', createFulfillmentOrder);
router.get('/orders/:orderId/tracking', updateOrderTracking);

export default router;
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { isTaskforce, isAdmin } from '../middleware/auth.middleware.js';
import {
  getAmbassadors,
  getAllAmbassadorCodes,
  createAmbassadorCode,
  updateAmbassadorCode,
  deleteAmbassadorCode,
  toggleAmbassadorCodeStatus
} from '../controllers/ambassador.controller.js';

const router = express.Router();

// All ambassador routes require authentication and taskforce/admin role
router.use(authenticate);
router.use(isTaskforce);

// Get all ambassadors (only those with payout setup complete)
router.get('/ambassadors', getAmbassadors);

// Get all ambassador codes
router.get('/codes', getAllAmbassadorCodes);

// Create new ambassador code
router.post('/codes', createAmbassadorCode);

// Update ambassador code
router.put('/codes/:id', updateAmbassadorCode);

// Delete ambassador code
router.delete('/codes/:id', deleteAmbassadorCode);

// Toggle ambassador code status
router.patch('/codes/:id/status', toggleAmbassadorCodeStatus);

export default router;
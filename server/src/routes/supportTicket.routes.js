// Update server/src/routes/supportTicket.routes.js

import express from 'express';
import { 
  getSupportTickets, 
  getSupportTicketById, 
  updateSupportTicket, 
  addResponseToTicket,
  getSupportTicketStats,
  createFromContact // Add this new import
} from '../controllers/supportTicket.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Add route for contact form submissions
router.post('/contact', createFromContact);

// Protected routes (taskforce/admin only)
router.use(authenticate);
router.get('/', getSupportTickets);
router.get('/stats', getSupportTicketStats);
router.get('/:id', getSupportTicketById);
router.put('/:id', updateSupportTicket);
router.post('/:id/respond', addResponseToTicket);

export default router;
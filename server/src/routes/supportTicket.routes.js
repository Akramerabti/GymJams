// server/src/routes/supportTicket.routes.js
import express from 'express';
import { 
  handleIncomingEmail, 
  getSupportTickets, 
  getSupportTicketById, 
  updateSupportTicket, 
  addResponseToTicket,
  getSupportTicketStats
} from '../controllers/supportTicket.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public webhook route for email services like Mailgun
router.post('/email-webhook', handleIncomingEmail);

// Protected routes (taskforce/admin only)
router.use(authenticate);
router.get('/', getSupportTickets);
router.get('/stats', getSupportTicketStats);
router.get('/:id', getSupportTicketById);
router.put('/:id', updateSupportTicket);
router.post('/:id/respond', addResponseToTicket);

export default router;
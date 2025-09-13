// server/src/routes/emailMarketing.routes.js
import express from 'express';
import {
  sendCampaign,
  getCampaigns,
  getCampaignDetails,
  getRecipientCount,
  trackEmailOpen,
  handleUnsubscribe
} from '../controllers/emailMarketing.controller.js';
import { authenticate, isTaskforce } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes (taskforce only)
router.post('/send', authenticate, isTaskforce, sendCampaign);
router.get('/campaigns', authenticate, isTaskforce, getCampaigns);
router.get('/campaigns/:campaignId', authenticate, isTaskforce, getCampaignDetails);
router.post('/recipients/count', authenticate, isTaskforce, getRecipientCount);

// Public routes
router.get('/track/:campaignId/:userId', trackEmailOpen);
router.get('/unsubscribe', handleUnsubscribe);

export default router;


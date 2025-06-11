import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
 createStripeAccount,
 initiateVerification,
 checkPayoutSetup,
    createStripeDashboardLink,
} from '../controllers/stripe.controller.js';
import stripe from '../config/stripe.js';

const router = express.Router();

router.post('/create-account', authenticate, createStripeAccount);
router.post('/create-account-link', authenticate, initiateVerification);
router.get('/check-payout-setup', authenticate, checkPayoutSetup);
router.post('/create-dashboard-link', authenticate, createStripeDashboardLink);

export default router;
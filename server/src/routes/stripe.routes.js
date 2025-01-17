import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
 createStripeAccount,
 createStripeAccountLink,
 checkPayoutSetup,
} from '../controllers/stripe.controller.js';
import stripe from '../config/stripe.js';

const router = express.Router();

router.post('/create-account', authenticate, createStripeAccount);
router.post('/create-account-link', authenticate, createStripeAccountLink);
router.get('/check-payout-setup', authenticate, checkPayoutSetup);

export default router;
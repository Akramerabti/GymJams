import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
  getCurrentSubscription,
  createSubscriptionIntent,
  handleSubscriptionSuccess,
  cancelSubscription
} from '../controllers/subscription.Controller.js';

const router = express.Router();

router.get('/current', authenticate, getCurrentSubscription);
router.delete('/:subscriptionId', authenticate, cancelSubscription);

router.post('/create-intent', createSubscriptionIntent);
router.post('/handle-success', optionalAuthenticate, handleSubscriptionSuccess);

export default router;
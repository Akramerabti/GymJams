import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getCurrentSubscription,
  createSubscriptionIntent,
  handleSubscriptionSuccess,
  cancelSubscription
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.get('/current', authenticate, getCurrentSubscription);
router.post('/create-intent', authenticate, createSubscriptionIntent);

router.post('/handle-success', (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) {
      req.user = null;
      next();
    } else {
      next();
    }
  });
}, handleSubscriptionSuccess);
router.delete('/:subscriptionId', authenticate, cancelSubscription);

export default router;
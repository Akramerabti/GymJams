// routes/subscription.routes.js
import express from 'express';
import { 
  createSubscriptionIntent,
  createSubscription,
  cancelSubscription,
  updateSubscription,
  handleSubscriptionSuccess
} from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-intent', authenticate, createSubscriptionIntent);
router.post('/', authenticate, createSubscription);
router.put('/:subscriptionId', authenticate, updateSubscription);
router.delete('/:subscriptionId', authenticate, cancelSubscription);

router.post('/handle-success', (req, res, next) => {
    authenticate(req, res, (err) => {
      if (err) {
        // If authentication fails, proceed without attaching the user
        req.user = null; // Explicitly set req.user to null
        next();
      } else {
        // If authentication succeeds, proceed with the user attached
        next();
      }
    });
  }, handleSubscriptionSuccess);

export default router;
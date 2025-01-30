import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
  getCurrentSubscription,
  createSetupIntent,
  handleSubscriptionSuccess,
  cancelSubscription,
  accessSubscription,
  finishCurrentMonth,
  handleWebhook,
  getQuestionnaireStatus,
  submitQuestionnaire,
  assignCoach,
  messaging,
} from '../controllers/subscription.Controller.js';
import stripe from '../config/stripe.js';

const router = express.Router();

router.get('/current', optionalAuthenticate, getCurrentSubscription);
router.delete('/:subscriptionId', authenticate, cancelSubscription);
router.post('/:subscriptionId/finish-month', authenticate, finishCurrentMonth);
router.post('/create-intent', createSetupIntent);
router.post('/handle-success', optionalAuthenticate, handleSubscriptionSuccess);
router.post('/access', optionalAuthenticate, accessSubscription);
router.get('/questionnaire-status', optionalAuthenticate, getQuestionnaireStatus);
router.post('/submit-questionnaire', optionalAuthenticate, submitQuestionnaire);
router.post('/assign-coach', optionalAuthenticate, assignCoach);
router.post('/subscriptions/:id/send-message', messaging);

router.post('/webhook', express.raw({ type: 'application/json' }),  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      await handleWebhook(event);
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook Verification Error:', {
        message: err.message,
        stack: err.stack
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;
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
} from '../controllers/subscription.Controller.js';

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

router.post('/webhook', express.raw({ type: 'application/json' }),
async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const result = await subscriptionController.handleWebhook(event);
    res.json(result);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
);


export default router;
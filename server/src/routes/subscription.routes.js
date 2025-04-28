import express from 'express';
import { authenticate, optionalAuthenticate, isCoach } from '../middleware/auth.middleware.js';
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
  getMessages,
  markMessagesAsRead, 
  addGoal,
  updateGoal,
  deleteGoal,
  requestGoalCompletion,
  approveGoalCompletion,
  rejectGoalCompletion,
  saveQuestionnaireDerivedGoals,
  getSubscriptionGoals,
  getPendingGoalApprovals,
  getClientSessions,
  requestSession,
} from '../controllers/subscription.Controller.js';
import stripe from '../config/stripe.js';
import upload from '../config/multer.js';

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
router.post('/:subscriptionId/send-message', upload.array('files', 10), messaging);
router.get('/:subscriptionId/messages', getMessages);
router.put('/:subscriptionId/mark-read', optionalAuthenticate, markMessagesAsRead);

router.post('/:subscriptionId/goals', optionalAuthenticate, addGoal);
router.put('/:subscriptionId/goals/:goalId', optionalAuthenticate, updateGoal);
router.delete('/:subscriptionId/goals/:goalId', optionalAuthenticate, deleteGoal);
router.post('/:subscriptionId/goals/:goalId/request-completion', optionalAuthenticate, requestGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/approve', optionalAuthenticate, approveGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/reject', optionalAuthenticate, rejectGoalCompletion);
router.post('/:subscriptionId/questionnaire-goals', optionalAuthenticate, saveQuestionnaireDerivedGoals);
router.get('/:subscriptionId/goals', optionalAuthenticate, getSubscriptionGoals);
router.get('/pending-goal-approvals', authenticate, isCoach, getPendingGoalApprovals);
router.post('/:subscriptionId/goals/:goalId/request-completion', optionalAuthenticate, requestGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/approve', optionalAuthenticate, isCoach, approveGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/reject', optionalAuthenticate, isCoach, rejectGoalCompletion);
router.get('/:subscriptionId/sessions', optionalAuthenticate, getClientSessions);
router.post('/:subscriptionId/request-session', optionalAuthenticate, requestSession);

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // Add logging to troubleshoot
    console.log('Received webhook request to /api/webhook');
    console.log('Webhook Signature:', sig ? 'Present' : 'Missing');
    
    if (!sig) {
      console.error('No Stripe signature found in webhook request');
      return res.status(400).send('No Stripe signature found');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
      return res.status(500).send('Webhook secret not configured');
    }
    
    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log(`Webhook event verified: ${event.type}`);
    
    // Process the event
    await handleWebhook(event);
    
    // Respond to Stripe
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;
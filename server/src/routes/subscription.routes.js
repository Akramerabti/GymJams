import express from 'express';
import { authenticate, optionalAuthenticate, isCoach } from '../middleware/auth.middleware.js';
import { requirePhone, requireCompleteProfile } from '../middleware/requirePhone.middleware.js';
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
  syncSubscriptionFromStripe,
  syncAllSubscriptions
} from '../controllers/subscription.Controller.js';
import stripe from '../config/stripe.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/current', optionalAuthenticate, requireCompleteProfile, getCurrentSubscription);
router.delete('/:subscriptionId', authenticate, requireCompleteProfile, cancelSubscription);
router.post('/:subscriptionId/finish-month', authenticate, requireCompleteProfile, finishCurrentMonth);
router.post('/create-intent', requireCompleteProfile, createSetupIntent);
router.post('/handle-success', optionalAuthenticate, requireCompleteProfile, handleSubscriptionSuccess);
router.post('/access', optionalAuthenticate, requireCompleteProfile, accessSubscription);
router.get('/questionnaire-status', optionalAuthenticate, requireCompleteProfile, getQuestionnaireStatus);
router.post('/submit-questionnaire', optionalAuthenticate, requireCompleteProfile, submitQuestionnaire);
router.post('/assign-coach', optionalAuthenticate, requireCompleteProfile, assignCoach);
router.post('/:subscriptionId/send-message', requireCompleteProfile, upload.array('files', 10), messaging);
router.get('/:subscriptionId/messages', requireCompleteProfile, getMessages);
router.put('/:subscriptionId/mark-read', optionalAuthenticate, requireCompleteProfile, markMessagesAsRead);

router.post('/:subscriptionId/goals', optionalAuthenticate, addGoal);
router.put('/:subscriptionId/goals/:goalId', optionalAuthenticate, updateGoal);
router.delete('/:subscriptionId/goals/:goalId', optionalAuthenticate, deleteGoal);
router.post('/:subscriptionId/goals/:goalId/request-completion', optionalAuthenticate, requestGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/approve', (req, res, next) => {
  next();
}, optionalAuthenticate, approveGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/reject', optionalAuthenticate, rejectGoalCompletion);
router.post('/:subscriptionId/questionnaire-goals', optionalAuthenticate, saveQuestionnaireDerivedGoals);
router.get('/:subscriptionId/goals', optionalAuthenticate, getSubscriptionGoals);
router.get('/pending-goal-approvals', authenticate, isCoach, getPendingGoalApprovals);
router.post('/:subscriptionId/goals/:goalId/request-completion', optionalAuthenticate, requestGoalCompletion);
router.post('/:subscriptionId/goals/:goalId/reject', optionalAuthenticate, isCoach, rejectGoalCompletion);
router.get('/:subscriptionId/sessions', optionalAuthenticate, getClientSessions);
router.post('/:subscriptionId/request-session', optionalAuthenticate, requestSession);

// Admin routes for syncing subscription data
router.post('/sync/:subscriptionId', authenticate, syncSubscriptionFromStripe);
router.post('/sync-all', authenticate, syncAllSubscriptions);

export default router;
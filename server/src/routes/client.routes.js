import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getCoachClients,
  getClientById,
  updateClientProgress,
  updateClientWorkouts,
  updateClientNotes,
  updateClientStats,
  exportClientData,
  getPendingRequests,
  acceptCoachingRequest,
  declineCoachingRequest,
  // Session management
  getCoachSessions,
  createSession,
  updateSession,
  deleteSession
} from '../controllers/client.controller.js';

const router = express.Router();

// All routes are protected by authentication
router.use(authenticate);

// Coach client management routes
router.get('/coach-clients', getCoachClients);
router.get('/pending-requests', getPendingRequests);
router.post('/accept-request/:requestId', acceptCoachingRequest);
router.post('/decline-request/:requestId', declineCoachingRequest);

router.get('/sessions', getCoachSessions);
router.post('/sessions', createSession);
router.put('/sessions/:sessionId', updateSession);
router.delete('/sessions/:sessionId', deleteSession);

// Client-specific routes
router.get('/:clientId', getClientById);
router.put('/:clientId/progress', updateClientProgress);
router.put('/:clientId/workouts', updateClientWorkouts);
router.put('/:clientId/notes', updateClientNotes);
router.put('/:clientId/stats', updateClientStats);
router.get('/:clientId/export', exportClientData);

export default router;
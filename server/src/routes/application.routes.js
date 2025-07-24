// server/src/routes/application.routes.js
import express from 'express';
import { 
  submitApplication, 
  getApplications, 
  getApplicationById, 
  updateApplicationStatus, 
  deleteApplication,
  receiveSignedDocument
} from '../controllers/application.controller.js';
import { authenticate, isAdmin, isTaskforce } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public route - Anyone can submit an application
router.post('/submit', upload.single('resume'), submitApplication);

// Protected routes - Only authenticated admins/taskforce can access
router.get('/', authenticate, getApplications);
router.get('/:id', authenticate, getApplicationById);
router.put('/:id/status', authenticate, isTaskforce, updateApplicationStatus);
router.delete('/:id', authenticate, isAdmin, deleteApplication);
router.post('/:id/document', authenticate, isTaskforce, upload.single('signedDocument'), receiveSignedDocument);

export default router;
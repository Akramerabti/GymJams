// server/src/routes/application.routes.js
import express from 'express';
import { authenticate, isAdmin, isTaskforce } from '../middleware/auth.middleware.js';
import { 
  submitApplication, 
  getApplications, 
  getApplicationById, 
  updateApplicationStatus,
  deleteApplication
} from '../controllers/application.controller.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public route - Anyone can submit an application
router.post('/submit', upload.single('resume'), submitApplication);

// Protected routes - Only authenticated admins/taskforce can access
router.get('/', authenticate, isTaskforce, getApplications);
router.get('/:id', authenticate, isTaskforce, getApplicationById);
router.put('/:id/status', authenticate, isTaskforce, updateApplicationStatus);
router.delete('/:id', authenticate, isAdmin, deleteApplication);

export default router;
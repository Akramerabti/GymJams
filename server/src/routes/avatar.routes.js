import express from 'express';
import upload from '../config/multer.js';
import avatarController from '../controllers/simpleAvatarController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Avatar generation endpoints
router.post('/generate-preview', avatarController.generatePreview);
router.post('/generate', authenticateToken, avatarController.generateAvatar);
router.post('/generate-map', avatarController.generateMapAvatar);
router.post('/regenerate', authenticateToken, avatarController.regenerateIfNeeded);

// Get current user's avatar info
router.get('/current', authenticateToken, avatarController.getCurrentAvatar);

// Custom avatar upload
router.post('/upload-custom', authenticateToken, upload.single('customAvatar'), avatarController.uploadCustomAvatar);
router.delete('/custom', authenticateToken, avatarController.deleteCustomAvatar);

// Avatar options and assets
router.get('/options',avatarController.getOptions);
router.get('/fallback/:gender',avatarController.getFallback);

// Cache management
router.post('/clear-cache',avatarController.clearCache);

export default router;
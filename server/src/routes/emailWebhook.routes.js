// server/src/routes/emailWebhook.routes.js
import express from 'express';
import multer from 'multer';
import { handleEmailWebhook } from '../controllers/emailWebhook.controller.js';

const router = express.Router();

// Configure multer to handle multipart/form-data from Mailgun
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files
  }
});

// Middleware to handle Mailgun webhook format specifically
const mailgunMiddleware = (req, res, next) => {

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  next();
};

// Handle OPTIONS requests for CORS preflight
router.options('/email-webhook', mailgunMiddleware, (req, res) => {
  //('[WEBHOOK] Handling OPTIONS preflight request');
  res.sendStatus(200);
});

// Mailgun typically sends POST requests, but let's handle all methods to be safe
// Use upload.any() to handle all attachments in multipart/form-data
router.post('/email-webhook', mailgunMiddleware, upload.any(), handleEmailWebhook);
router.get('/email-webhook', mailgunMiddleware, handleEmailWebhook);
router.put('/email-webhook', mailgunMiddleware, upload.any(), handleEmailWebhook);
router.patch('/email-webhook', mailgunMiddleware, upload.any(), handleEmailWebhook);

export default router;

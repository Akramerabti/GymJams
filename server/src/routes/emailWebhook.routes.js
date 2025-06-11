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
  // Log detailed information about the webhook request
  console.log(`[MAILGUN MIDDLEWARE] ${new Date().toISOString()} - Method: ${req.method}, URL: ${req.url}`);
  console.log(`[MAILGUN MIDDLEWARE] Content-Type: ${req.headers['content-type']}`);
  console.log(`[MAILGUN MIDDLEWARE] User-Agent: ${req.headers['user-agent']}`);
  console.log(`[MAILGUN MIDDLEWARE] Origin: ${req.headers.origin || 'none'}`);
  console.log(`[MAILGUN MIDDLEWARE] X-Forwarded-For: ${req.headers['x-forwarded-for'] || 'none'}`);
  console.log(`[MAILGUN MIDDLEWARE] Real IP: ${req.ip}`);
  
  // Set CORS headers for webhook endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  next();
};

// Handle OPTIONS requests for CORS preflight
router.options('/email-webhook', mailgunMiddleware, (req, res) => {
  console.log('[WEBHOOK] Handling OPTIONS preflight request');
  res.sendStatus(200);
});

// Mailgun typically sends POST requests, but let's handle all methods to be safe
// Use upload.any() to handle all attachments in multipart/form-data
router.post('/email-webhook', mailgunMiddleware, upload.any(), handleEmailWebhook);
router.get('/email-webhook', mailgunMiddleware, handleEmailWebhook);
router.put('/email-webhook', mailgunMiddleware, upload.any(), handleEmailWebhook);
router.patch('/email-webhook', mailgunMiddleware, upload.any(), handleEmailWebhook);

export default router;

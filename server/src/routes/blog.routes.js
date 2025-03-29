// server/src/routes/blog.routes.js (updated)
import express from 'express';
import {
  createBlog,
  getAllBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  getCategories,
  getTags,
  addComment,
  getAuthorBlogs,
  getRelatedBlogs,
  addAdPlacement,
  updateAdPlacement,
  removeAdPlacement,
  getBlogAnalytics,
  getAdPerformance,
  // New import functions
  importContent,
  getImportStats,
  updateImportedContent
} from '../controllers/blog.controller.js';
import { authenticate, isAdmin, optionalAuthenticate, isTaskforce } from '../middleware/auth.middleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllBlogs);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/:slug', optionalAuthenticate, getBlog);
router.get('/:slug/related', getRelatedBlogs);

// Protected routes (authentication required)
router.use(authenticate);

// Blog post management
router.post('/', createBlog);
router.put('/:slug', updateBlog);
router.delete('/:slug', deleteBlog);

// Comments
router.post('/:slug/comments', addComment);

// Author specific routes
router.get('/author/:authorId', getAuthorBlogs);

// Content import routes (admin/taskforce only)
router.post('/import', isAdmin, importContent);
router.get('/import/stats', isAdmin, getImportStats);
router.put('/import/:id', isAdmin, updateImportedContent);

// Ad management (admin only)
router.post('/:slug/ads', isAdmin, addAdPlacement);
router.put('/:slug/ads/:adId', isAdmin, updateAdPlacement);
router.delete('/:slug/ads/:adId', isAdmin, removeAdPlacement);

// Analytics
router.get('/:slug/analytics', isAdmin, getBlogAnalytics);
router.get('/ads/performance', isAdmin, getAdPerformance);

export default router;
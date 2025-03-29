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
  getAdPerformance
} from '../controllers/blog.controller.js';
import { authenticate, isAdmin, optionalAuthenticate } from '../middleware/auth.middleware.js';
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

// Ad management (admin only)
router.post('/:slug/ads', isAdmin, addAdPlacement);
router.put('/:slug/ads/:adId', isAdmin, updateAdPlacement);
router.delete('/:slug/ads/:adId', isAdmin, removeAdPlacement);

// Analytics
router.get('/:slug/analytics', isAdmin, getBlogAnalytics);
router.get('/ads/performance', isAdmin, getAdPerformance);

export default router;
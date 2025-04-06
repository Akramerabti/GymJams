// server/src/controllers/blog.controller.js
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { sanitizeHtml, generateReadingTime } from '../utils/helpers.js';
import RSS from 'rss-parser';

// Create new blog post
export const createBlog = async (req, res) => {
  try {
    const { title, content, metaDescription, category, tags, status } = req.body;
    
    // Create new blog
    const blog = new Blog({
      title,
      content,
      metaDescription,
      category,
      tags,
      status,
      author: req.user._id
    });
    
    // Set publish date if published
    if (status === 'published') {
      blog.publishDate = new Date();
    }
    
    // Calculate reading time
    blog.readingTime = generateReadingTime(content);
    
    // Save blog
    await blog.save();
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    logger.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all blogs (with filters)
export const getAllBlogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      tag = '',
      author = '',
      status = 'published', // Default to published for public access
      sort = 'publishDate:desc'
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add tag filter
    if (tag) {
      query.tags = tag;
    }
    
    // Add author filter
    if (author) {
      query.author = author;
    }
    
    // Add status filter
    if (req.user) {
      // If user is authenticated, respect status filter
      if (status) {
        // If the user is the author or admin/taskforce, they can view all statuses
        if (req.user.role === 'admin' || req.user.role === 'taskforce' || author === req.user._id.toString()) {
          if (status !== 'all') {
            query.status = status;
          }
        } else {
          // Otherwise, only show published posts
          query.status = 'published';
        }
      }
    } else {
      // If not authenticated, only show published posts
      query.status = 'published';
    }
    
    // Parse sort parameter
    let sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.publishDate = -1; // Default sort
    }
    
    // Execute query with pagination
    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName profileImage')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count
    const totalItems = await Blog.countDocuments(query);
    
    // Respond with blogs and pagination
    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit
      }
    });
  } catch (error) {
    logger.error('Error getting blogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blog by slug
export const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'firstName lastName profileImage bio')
      .populate('comments.user', 'firstName lastName profileImage')
      .populate('comments.replies.user', 'firstName lastName profileImage');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is published or user is author/admin
    if (blog.status !== 'published') {
      if (!req.user || (req.user._id.toString() !== blog.author._id.toString() && req.user.role !== 'admin' && req.user.role !== 'taskforce')) {
        return res.status(403).json({
          success: false,
          message: 'This blog post is not published'
        });
      }
    }
    
    // Increment view count
    blog.analytics.views += 1;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    logger.error('Error getting blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update blog
export const updateBlog = async (req, res) => {
  try {
    const { title, content, metaDescription, category, tags, status } = req.body;
    
    // Find blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user is author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'taskforce') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this blog'
      });
    }
    
    // Update fields
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.metaDescription = metaDescription || blog.metaDescription;
    blog.category = category || blog.category;
    blog.tags = tags || blog.tags;
    
    // Set publish date if newly published
    if (status === 'published' && blog.status !== 'published') {
      blog.publishDate = new Date();
    }
    
    blog.status = status || blog.status;
    blog.lastModified = new Date();
    
    // Recalculate reading time if content changed
    if (content) {
      blog.readingTime = generateReadingTime(content);
    }
    
    // Save blog
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    logger.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    // Find blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user is author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'taskforce') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this blog'
      });
    }
    
    // Delete blog
    await blog.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blog categories
export const getCategories = async (req, res) => {
  try {
    // Aggregate blogs by category
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blog tags
export const getTags = async (req, res) => {
  try {
    // Aggregate blogs by tags
    const tags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    logger.error('Error getting tags:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add comment to blog
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    // Find blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Add comment
    blog.comments.push({
      user: req.user._id,
      content
    });
    
    await blog.save();
    
    // Get the newly added comment with user info
    const populatedBlog = await Blog.findById(blog._id)
      .populate('comments.user', 'firstName lastName profileImage');
    
    const newComment = populatedBlog.comments[populatedBlog.comments.length - 1];
    
    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get related blogs
export const getRelatedBlogs = async (req, res) => {
  try {
    // Find the current blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Find related blogs based on category and tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: blog._id }, // Exclude current blog
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
    .populate('author', 'firstName lastName')
    .sort({ publishDate: -1 })
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: relatedBlogs
    });
  } catch (error) {
    logger.error('Error getting related blogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blogs by author
export const getAuthorBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Find blogs by author
    const blogs = await Blog.find({ 
      author: req.params.authorId,
      status: 'published'
    })
    .sort({ publishDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    // Get total count
    const totalItems = await Blog.countDocuments({ 
      author: req.params.authorId,
      status: 'published'
    });
    
    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit
      }
    });
  } catch (error) {
    logger.error('Error getting author blogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== Ad Management Functions =====

// Add ad placement to blog
export const addAdPlacement = async (req, res) => {
  try {
    const { position, adNetwork, adCode, isActive, displayCondition } = req.body;
    
    // Find blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Add ad placement
    const adPlacement = {
      position,
      adNetwork,
      adCode,
      isActive: isActive !== undefined ? isActive : true,
      displayCondition: displayCondition || {
        minReadTime: 0,
        deviceTypes: ['all']
      }
    };
    
    blog.adPlacements.push(adPlacement);
    await blog.save();
    
    // Get the newly added ad placement
    const newAdPlacement = blog.adPlacements[blog.adPlacements.length - 1];
    
    res.status(201).json({
      success: true,
      data: newAdPlacement
    });
  } catch (error) {
    logger.error('Error adding ad placement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update ad placement
export const updateAdPlacement = async (req, res) => {
  try {
    const { position, adNetwork, adCode, isActive, displayCondition } = req.body;
    
    // Find blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Find ad placement
    const adPlacement = blog.adPlacements.id(req.params.adId);
    
    if (!adPlacement) {
      return res.status(404).json({
        success: false,
        message: 'Ad placement not found'
      });
    }
    
    // Update fields
    adPlacement.position = position || adPlacement.position;
    adPlacement.adNetwork = adNetwork || adPlacement.adNetwork;
    adPlacement.adCode = adCode || adPlacement.adCode;
    adPlacement.isActive = isActive !== undefined ? isActive : adPlacement.isActive;
    
    if (displayCondition) {
      adPlacement.displayCondition = {
        ...adPlacement.displayCondition,
        ...displayCondition
      };
    }
    
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: adPlacement
    });
  } catch (error) {
    logger.error('Error updating ad placement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove ad placement
export const removeAdPlacement = async (req, res) => {
  try {
    // Find blog
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Find ad placement
    const adPlacement = blog.adPlacements.id(req.params.adId);
    
    if (!adPlacement) {
      return res.status(404).json({
        success: false,
        message: 'Ad placement not found'
      });
    }
    
    // Remove ad placement
    adPlacement.remove();
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error removing ad placement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get blog analytics
export const getBlogAnalytics = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Return analytics data
    res.status(200).json({
      success: true,
      data: blog.analytics
    });
  } catch (error) {
    logger.error('Error getting blog analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get ad performance data
export const getAdPerformance = async (req, res) => {
  try {
    // This would typically query ad performance from ad networks APIs
    // For demonstration, we'll return mock data
    
    const adPerformance = {
      adsense: {
        impressions: 12500,
        clicks: 320,
        ctr: 2.56,
        rpm: 3.78,
        revenue: 47.25
      },
      mediavine: {
        impressions: 8700,
        clicks: 190,
        ctr: 2.18,
        rpm: 5.12,
        revenue: 44.54
      }
    };
    
    res.status(200).json({
      success: true,
      data: adPerformance
    });
  } catch (error) {
    logger.error('Error getting ad performance data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Extract potential category based on content analysis
const determineCategory = (article) => {
  const title = (article.title || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const combinedText = title + ' ' + content;
  
  // Define category keywords
  const categoryKeywords = {
    'Fitness': ['fitness', 'workout', 'exercise', 'training', 'gym', 'cardio', 'strength'],
    'Nutrition': ['nutrition', 'diet', 'food', 'eating', 'meal', 'protein', 'carbs'],
    'Workout Plans': ['workout plan', 'training program', 'routine', 'split', 'schedule'],
    'Equipment Reviews': ['review', 'gear', 'equipment', 'machine', 'product'],
    'Success Stories': ['transformation', 'success', 'journey', 'progress', 'before and after'],
    'Health Tips': ['health', 'wellness', 'tips', 'advice', 'lifestyle'],
    'Motivation': ['motivation', 'inspire', 'mindset', 'mental', 'goals']
  };
  
  // Find the category with the most keyword matches
  let bestCategory = 'Fitness'; // Default
  let maxMatches = 0;
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        matches++;
      }
    }
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }
  
  return bestCategory;
};

// Extract tags from content
const extractTags = (article) => {
  const title = (article.title || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const combinedText = title + ' ' + content;
  
  // Define tag keywords
  const tagKeywords = {
    'Strength Training': ['strength', 'weight', 'lifting', 'resistance', 'barbell', 'dumbbell', 'powerlifting'],
    'Cardio': ['cardio', 'aerobic', 'running', 'jogging', 'cycling', 'hiit'],
    'Bodybuilding': ['bodybuilding', 'muscle', 'hypertrophy', 'physique', 'mass', 'olympia', 'ifbb'],
    'Weight Loss': ['weight loss', 'fat loss', 'cutting', 'calorie deficit', 'diet'],
    'Muscle Building': ['muscle', 'gain', 'bulk', 'mass', 'hypertrophy', 'growth'],
    'Recovery': ['recovery', 'rest', 'sleep', 'stretching', 'mobility', 'flexibility'],
    'Supplements': ['supplement', 'protein', 'creatine', 'pre-workout', 'bcaa', 'vitamins'],
    'Beginner': ['beginner', 'starting', 'novice', 'new', 'basics'],
    'Advanced': ['advanced', 'expert', 'elite', 'professional', 'competition'],
    'Nutrition': ['nutrition', 'diet', 'food', 'macro', 'calorie', 'eating', 'meal'],
    'Mental Health': ['mental', 'mind', 'psychology', 'stress', 'anxiety', 'motivation']
  };
  
  // Find matching tags
  const matchedTags = [];
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        matchedTags.push(tag);
        break; // One match per tag is enough
      }
    }
  }
  
  // Limit to 5 most relevant tags
  return matchedTags.slice(0, 5);
};


// Helper function to calculate reading time
const calculateReadingTime = (content) => {
  if (!content) return 1;
  
  // Remove HTML tags
  const textContent = content.replace(/<[^>]+>/g, ' ');
  
  // Count words (approximately)
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225;
  
  // Calculate minutes and round up
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  // Return at least 1 minute
  return Math.max(1, minutes);
};

// Helper function to generate a slug
const generateSlug = (title) => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim() + '-' + Math.random().toString(36).substring(2, 8); // Add random string for uniqueness
};

const isContentTruncated = (content) => {
  return (
    content.includes('[&#8230;]') || 
    content.includes('...') ||
    content.endsWith('…') ||
    content.includes('continue reading') ||
    content.includes('read more')
  );
};

export const trackBlogView = async (req, res) => {
  try {
    // Get client IP address for rate limiting check
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const blogSlug = req.params.slug;
    
    // Use an in-memory cache or Redis cache to track recent views
    // For simplicity, we'll use a Map in this example (in a real app, use Redis)
    const recentViewsCache = req.app.locals.recentBlogViews || new Map();
    if (!req.app.locals.recentBlogViews) {
      req.app.locals.recentBlogViews = recentViewsCache;
    }
    
    // Check if this IP + slug combination has already tracked a view recently
    const cacheKey = `${clientIP}:${blogSlug}`;
    if (recentViewsCache.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        message: 'View already counted for this session',
        data: { counted: false }
      });
    }
    
    // Track the view with a 5-minute expiration (to prevent rapid refresh spam)
    recentViewsCache.set(cacheKey, true);
    setTimeout(() => recentViewsCache.delete(cacheKey), 5 * 60 * 1000); // 5 minutes
    
    // Use findOneAndUpdate instead of find + save for atomic operation
    const blog = await Blog.findOneAndUpdate(
      { slug: blogSlug },
      { $inc: { 'analytics.views': 1 } },
      { new: true, select: 'analytics.views' }
    );
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { views: blog.analytics.views, counted: true }
    });
  } catch (error) {
    logger.error('Error tracking blog view:', error);
    // Send a 200 response anyway to prevent client retries
    res.status(200).json({
      success: false,
      message: 'View tracking failed, but continuing',
      data: { counted: false }
    });
  }
};

// Get import statistics
export const getImportStats = async (req, res) => {
  try {
    // Count total imported blogs
    const total = await Blog.countDocuments({
      'source.url': { $exists: true }
    });
    
    // Count pending/draft imported blogs
    const pending = await Blog.countDocuments({
      'source.url': { $exists: true },
      status: 'draft'
    });
    
    // Count approved/published imported blogs
    const approved = await Blog.countDocuments({
      'source.url': { $exists: true },
      status: 'published'
    });
    
    // Count rejected/archived imported blogs
    const rejected = await Blog.countDocuments({
      'source.url': { $exists: true },
      status: 'archived'
    });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        processed: approved + rejected
      }
    });
  } catch (error) {
    logger.error('Error getting import stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const fetchDefaultFitnessContent = async () => {
  // These URLs should work reliably
  const fitnessUrls = [
    'https://www.nih.gov/news-events/news-releases/physical-activity-may-reduce-depression-symptoms',
    'https://www.nih.gov/news-events/news-releases/lack-sleep-may-increase-calorie-consumption',
    'https://www.nih.gov/news-events/news-releases/moderate-exercise-may-improve-memory-learning',
    'https://www.nih.gov/news-events/news-releases/exercise-may-improve-brain-function-older-adults',
    'https://www.nih.gov/news-events/news-releases/stretching-routines-benefit-vascular-health'
  ];
  
  const articles = [];
  
  for (const url of fitnessUrls) {
    try {
      const response = await axios.get(url);
      
      // Extract content using regex - this is more reliable than DOM parsing
      const titleMatch = /<h1[^>]*>(.*?)<\/h1>/s.exec(response.data);
      const contentMatch = /<div class="content"[^>]*>(.*?)<\/div>\s*<\/div>/s.exec(response.data);
      
      if (titleMatch && contentMatch) {
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const content = contentMatch[1];
        
        articles.push({
          title: title,
          description: title.substring(0, 150) + '...',
          content: content,
          url: url,
          publishDate: new Date(),
          source: {
            name: 'NIH Research',
            url: url,
            type: 'fallback',
            importedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      // Continue to next URL
    }
  }
  
  return articles;
};

// Update imported content
export const updateImportedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, metaDescription, content, category, tags, status } = req.body;
    
    // Find blog by ID
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is imported
    if (!blog.source || !blog.source.url) {
      return res.status(400).json({
        success: false,
        message: 'Blog is not imported content'
      });
    }
    
    // Update fields
    blog.title = title || blog.title;
    blog.metaDescription = metaDescription || blog.metaDescription;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.tags = tags || blog.tags;
    
    // Set publish date if newly published
    if (status === 'published' && blog.status !== 'published') {
      blog.publishDate = new Date();
    }
    
    blog.status = status || blog.status;
    blog.lastModified = new Date();
    
    // Recalculate reading time if content changed
    if (content) {
      blog.readingTime = generateReadingTime(content);
    }
    
    // Save blog
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    logger.error('Error updating imported content:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve imported blogs
export const approveImportedBlogs = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No blog IDs provided'
      });
    }
    
    // Update blogs to published status
    const result = await Blog.updateMany(
      { 
        _id: { $in: ids },
        'source.url': { $exists: true } // Ensure these are imported blogs
      },
      {
        $set: { 
          status: 'published',
          publishDate: new Date()
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        count: result.modifiedCount || 0
      },
      message: `Approved ${result.modifiedCount || 0} blog posts`
    });
  } catch (error) {
    logger.error('Error approving imported blogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reject imported blogs
export const rejectImportedBlogs = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No blog IDs provided'
      });
    }
    
    // Update blogs to archived status (rejected)
    const result = await Blog.updateMany(
      { 
        _id: { $in: ids },
        'source.url': { $exists: true } // Ensure these are imported blogs
      },
      {
        $set: { status: 'archived' }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        count: result.modifiedCount || 0
      },
      message: `Rejected ${result.modifiedCount || 0} blog posts`
    });
  } catch (error) {
    logger.error('Error rejecting imported blogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Improved blog content fetching functions

// Fetch from News API with better error handling and no fallbacks
const fetchFromNewsAPI = async (categories) => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.log('NEWS_API_KEY not found in environment variables');
      return [];
    }
    
    // Build more targeted search query based on categories
    const categoryKeywords = {
      'Fitness': ['fitness workout', 'exercise program', 'strength training', 'gym routine'],
      'Nutrition': ['nutrition diet', 'healthy eating', 'meal planning', 'macronutrients'],
      'Workout Plans': ['workout program', 'training plan', 'exercise routine', 'fitness schedule'],
      'Health Tips': ['health wellness', 'wellbeing tips', 'healthy lifestyle', 'fitness advice']
    };
    
    // Build search query based on selected categories
    let queries = [];
    categories.forEach(category => {
      if (categoryKeywords[category]) {
        queries = [...queries, ...categoryKeywords[category]];
      }
    });
    
    // If no categories specified, use a default set
    if (queries.length === 0) {
      queries = ['fitness workout', 'nutrition diet', 'strength training'];
    }

    // Make multiple requests for different queries to maximize results
    const articlesPromises = queries.map(async (query) => {
      try {
        const response = await axios.get(`https://newsapi.org/v2/everything`, {
          params: {
            q: query,
            pageSize: 10,
            language: 'en',
            sortBy: 'relevancy',
            apiKey
          }
        });
        
        if (response.data.status !== 'ok' || !response.data.articles) {
          console.error('News API error for query:', query, response.data);
          return [];
        }
        
        return response.data.articles;
      } catch (error) {
        console.error(`News API error for query "${query}":`, error);
        return [];
      }
    });
    
    const articlesArrays = await Promise.all(articlesPromises);
    
    // Flatten and deduplicate articles by URL
    const dedupedArticles = [];
    const urlSet = new Set();
    
    articlesArrays.flat().forEach(article => {
      if (!urlSet.has(article.url)) {
        urlSet.add(article.url);
        dedupedArticles.push(article);
      }
    });
    
    // Process articles
    return dedupedArticles.map(article => ({
      title: article.title,
      description: article.description || '',
      content: article.content || '',
      url: article.url,
      publishDate: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      source: {
        name: article.source.name || 'News API',
        url: article.url,
        type: 'newsapi',
        importedAt: new Date()
      }
    }));
  } catch (error) {
    console.error('Error fetching from News API:', error);
    return [];
  }
};

// Improved RSS feed parser with better feed sources
const parseRSSFeeds = async (categories) => {
  // More reliable fitness RSS feeds
  const fitnessFeeds = [
    'https://www.bodybuilding.com/rss/articles',
    'https://www.t-nation.com/feed/',
    'https://www.nerdfitness.com/blog/feed/',
    'https://www.menshealth.com/rss/all.xml/',
    'https://www.womenshealthmag.com/rss/all.xml/',
    'https://www.shape.com/feeds/all.rss.xml'
  ];
  
  const nutritionFeeds = [
    'https://www.precisionnutrition.com/feed',
    'https://www.healthline.com/nutrition/feed',
    'https://rss.sciencedaily.com/fitness_nutrition.xml',
    'https://www.eatingwell.com/feed/'
  ];
  
  const workoutFeeds = [
    'https://www.muscleandfitness.com/feed/',
    'https://breakingmuscle.com/feed/',
    'https://www.strongerbyscience.com/feed/'
  ];
  
  // Select feeds based on requested categories
  let feedsToFetch = [];
  if (categories.includes('Fitness')) {
    feedsToFetch = [...feedsToFetch, ...fitnessFeeds];
  }
  if (categories.includes('Nutrition')) {
    feedsToFetch = [...feedsToFetch, ...nutritionFeeds];
  }
  if (categories.includes('Workout Plans')) {
    feedsToFetch = [...feedsToFetch, ...workoutFeeds];
  }
  
  // If no specific category selected, use all feeds
  if (feedsToFetch.length === 0) {
    feedsToFetch = [...fitnessFeeds, ...nutritionFeeds, ...workoutFeeds];
  }
  
  // Randomly select up to 5 feeds to query for better performance
  if (feedsToFetch.length > 5) {
    feedsToFetch = feedsToFetch.sort(() => 0.5 - Math.random()).slice(0, 5);
  }
  
  const parser = new RSS({
    customFields: {
      item: [
        ['content:encoded', 'fullContent'],
        ['description', 'description']
      ]
    }
  });
  
  const results = [];
  
  for (const feedUrl of feedsToFetch) {
    try {
      console.log(`Fetching RSS feed: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      console.log(`Successfully parsed RSS feed: ${feedUrl}, found ${feed.items.length} items`);
      
      // Process each item
      const items = feed.items.map(item => ({
        title: item.title,
        description: item.contentSnippet || item.description?.substring(0, 160) || '',
        content: item.fullContent || item.content || item.description || '',
        url: item.link,
        publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: {
          name: feed.title || 'RSS Feed',
          url: item.link,
          type: 'rss',
          importedAt: new Date()
        }
      }));
      
      results.push(...items);
    } catch (error) {
      console.error(`Error parsing RSS feed ${feedUrl}:`, error);
    }
  }
  
  return results;
};

// Improved full content fetching with multiple fallback strategies
const fetchFullContent = async (url) => {
  try {
    console.log(`Fetching full content from: ${url}`);
    
    // Set timeout to avoid hanging on slow sites
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    
    // Try multiple parsing strategies
    
    // Strategy 1: WordPress REST API for WordPress sites
    try {
      const wpContent = await fetchWordPressContent(url);
      if (wpContent && wpContent.length > 1000) {
        console.log(`Successfully fetched WordPress content (${wpContent.length} chars)`);
        return wpContent;
      }
    } catch (wpError) {
      console.log('WordPress API strategy failed:', wpError.message);
    }
    
    // Strategy 2: JSDOM with common content selectors
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Very comprehensive list of content selectors
      const selectors = [
        'article .entry-content', 
        '.post-content',
        '.article-content',
        '.article__content',
        'article .content',
        '.post .entry',
        '.post-body-content',
        '.main-content article',
        '.article-body',
        '.entry-content',
        '.content-area',
        '.post__content',
        'main article',
        '#content-body',
        '.blog-post',
        '.single-post-content',
        '.story-body',
        '.story-content',
        '.page-content'
      ];
      
      for (const selector of selectors) {
        const contentElement = document.querySelector(selector);
        if (contentElement) {
          // Clean up the content
          const content = cleanupContent(contentElement.innerHTML);
          
          if (content.length > 1000) {
            console.log(`Found content with selector "${selector}" (${content.length} chars)`);
            return content;
          }
        }
      }
    } catch (domError) {
      console.log('JSDOM strategy failed:', domError.message);
    }
    
    // Strategy 3: Cheerio as a fallback
    try {
      const $ = cheerio.load(html);
      const selectors = [
        'article', '.post', '.entry', '.content', 'main', '#content', '.article'
      ];
      
      for (const selector of selectors) {
        const element = $(selector);
        if (element.length) {
          // Find the element with the most text
          let bestElement = element;
          let maxTextLength = element.text().length;
          
          element.find('div, section').each((i, el) => {
            const textLength = $(el).text().length;
            if (textLength > maxTextLength) {
              maxTextLength = textLength;
              bestElement = $(el);
            }
          });
          
          const content = cleanupContent(bestElement.html());
          
          if (content.length > 1000) {
            console.log(`Found content with cheerio selector "${selector}" (${content.length} chars)`);
            return content;
          }
        }
      }
    } catch (cheerioError) {
      console.log('Cheerio strategy failed:', cheerioError.message);
    }
    
    // Strategy 4: Extract the largest div by content
    try {
      const $ = cheerio.load(html);
      
      // Get all divs with substantial content
      const divs = $('div').filter((i, el) => {
        const text = $(el).text().trim();
        return text.length > 1000 && text.split(' ').length > 200;
      });
      
      if (divs.length > 0) {
        // Sort by content length
        const contentDivs = Array.from(divs).sort((a, b) => {
          return $(b).text().length - $(a).text().length;
        });
        
        const content = cleanupContent($(contentDivs[0]).html());
        
        if (content.length > 1000) {
          console.log(`Extracted content from largest div (${content.length} chars)`);
          return content;
        }
      }
    } catch (divError) {
      console.log('Largest div strategy failed:', divError.message);
    }
    
    // Strategy 5: Extract all paragraphs
    try {
      const $ = cheerio.load(html);
      let paragraphs = [];
      
      // Find all paragraphs with reasonable content
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) {
          paragraphs.push($(el).prop('outerHTML'));
        }
      });
      
      if (paragraphs.length > 5) {
        const content = paragraphs.join('');
        
        if (content.length > 1000) {
          console.log(`Extracted content from ${paragraphs.length} paragraphs (${content.length} chars)`);
          return content;
        }
      }
    } catch (pError) {
      console.log('Paragraph extraction strategy failed:', pError.message);
    }
    
    console.log('All content extraction strategies failed');
    return null;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error.message);
    return null;
  }
};

// Helper to fetch WordPress API content
const fetchWordPressContent = async (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    let postSlug = pathParts[pathParts.length - 1];
    
    // Handle trailing slash
    if (postSlug === '') {
      postSlug = pathParts[pathParts.length - 2];
    }
    
    // Remove .html if present
    postSlug = postSlug.replace(/\.html$/, '');
    
    // Try WordPress API
    const apiUrl = `${urlObj.origin}/wp-json/wp/v2/posts?slug=${postSlug}`;
    const response = await axios.get(apiUrl, { timeout: 5000 });
    
    if (response.data && response.data.length > 0) {
      return response.data[0].content.rendered;
    }
    
    throw new Error('No WordPress content found');
  } catch (error) {
    throw error;
  }
};

// Helper to clean up content
const cleanupContent = (content) => {
  if (!content) return '';
  
  let cleaned = content;
  
  // Remove common clutter elements
  const elementsToRemove = [
    // Navigation
    /<nav\b[^>]*>.*?<\/nav>/gis,
    /<div[^>]*\bclass\s*=\s*["'].*?\b(navigation|navbar|menu|nav-links).*?["'][^>]*>.*?<\/div>/gis,
    
    // Comments
    /<div[^>]*\bclass\s*=\s*["'].*?\b(comments|comment-section|disqus).*?["'][^>]*>.*?<\/div>/gis,
    /<section[^>]*\bclass\s*=\s*["'].*?\bcomments.*?["'][^>]*>.*?<\/section>/gis,
    
    // Social sharing
    /<div[^>]*\bclass\s*=\s*["'].*?\b(share|social|sharing).*?["'][^>]*>.*?<\/div>/gis,
    
    // Author bio
    /<div[^>]*\bclass\s*=\s*["'].*?\b(author-bio|about-author).*?["'][^>]*>.*?<\/div>/gis,
    
    // Related posts
    /<div[^>]*\bclass\s*=\s*["'].*?\b(related|read-more|read-next).*?["'][^>]*>.*?<\/div>/gis,
    
    // Ads
    /<div[^>]*\bclass\s*=\s*["'].*?\b(ads?|advertisement|banner|sponsor).*?["'][^>]*>.*?<\/div>/gis,
    /<ins\b[^>]*>.*?<\/ins>/gis,
    
    // Sidebar
    /<aside\b[^>]*>.*?<\/aside>/gis,
    /<div[^>]*\bclass\s*=\s*["'].*?\b(sidebar|widget).*?["'][^>]*>.*?<\/div>/gis
  ];
  
  elementsToRemove.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove empty HTML elements
  cleaned = cleaned.replace(/<(div|p|span)[^>]*>\s*<\/\1>/g, '');
  
  // Remove "read more", "continue reading" links
  cleaned = cleaned.replace(/<a[^>]*>(Read More|Continue Reading|More).*?<\/a>/gi, '');
  
  // Fix HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;|&hellip;/g, '...');
  
  return cleaned;
};

// Enhanced content processing that ensures minimum content length
const processContent = async (articles, categories) => {
  if (!Array.isArray(articles)) {
    console.error('Articles parameter is not an array:', typeof articles);
    return [];
  }
  
  const processedArticles = [];
  const MINIMUM_CONTENT_LENGTH = 1000; // Minimum 1000 characters of content
  
  for (const article of articles) {
    try {
      console.log(`Processing article: "${article.title}"`);
      
      // Skip articles without title
      if (!article.title) {
        console.log('Skipping article without title');
        continue;
      }
      
      // Check content length
      let finalContent = article.content || '';
      
      // Always try to fetch full content if URL is available
      if (article.source?.url) {
        console.log(`Attempting to fetch full content from: ${article.source.url}`);
        
        const fetchedContent = await fetchFullContent(article.source.url);
        
        if (fetchedContent && fetchedContent.length > MINIMUM_CONTENT_LENGTH) {
          console.log(`Successfully fetched full content (${fetchedContent.length} chars)`);
          finalContent = fetchedContent;
        } else {
          console.log(`Could not fetch content with minimum length (got ${fetchedContent?.length || 0} chars)`);
          
          // Skip this article if content is too short
          if (finalContent.length < MINIMUM_CONTENT_LENGTH) {
            console.log(`Skipping article with insufficient content (${finalContent.length} chars)`);
            continue;
          }
        }
      } else {
        // Skip articles without URL and with short content
        if (finalContent.length < MINIMUM_CONTENT_LENGTH) {
          console.log(`Skipping article without URL and insufficient content (${finalContent.length} chars)`);
          continue;
        }
      }
      
      // Determine category
      let category = article.category || '';
      
      if (!category || !categories.includes(category)) {
        category = determineCategory({
          title: article.title,
          content: finalContent
        });
      }
      
      // Extract tags
      const tags = article.tags?.length > 0 ? article.tags : extractTags({
        title: article.title,
        content: finalContent
      });
      
      // Create meta description
      let metaDescription = article.metaDescription || article.description || '';
      
      if (!metaDescription) {
        const textContent = finalContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        metaDescription = textContent.substring(0, 160);
        
        if (metaDescription.length >= 160) {
          metaDescription = metaDescription.substring(0, 157) + '...';
        }
      }
      
      // Calculate reading time
      const readingTime = calculateReadingTime(finalContent);
      
      // Create the processed article
      processedArticles.push({
        title: article.title,
        slug: article.slug || generateSlug(article.title),
        metaDescription: metaDescription,
        content: finalContent,
        category: category,
        tags: tags,
        status: 'draft',
        source: article.source || {
          name: 'Unknown',
          url: '',
          type: 'manual',
          importedAt: new Date()
        },
        readingTime: readingTime,
        publishDate: article.publishDate || new Date()
      });
      
      console.log(`Successfully processed "${article.title}" - ${finalContent.length} chars, ${readingTime} min read time`);
      
    } catch (error) {
      console.error(`Error processing article "${article.title}":`, error);
      // Skip this article if processing fails
    }
  }
  
  return processedArticles;
};

export const importContent = async (req, res) => {
  try {
    const { sources = [], categories = [], count = 10 } = req.body;
    
    // Validate sources
    const validSources = ['newsapi', 'rss', 'spoonacular'];
    const selectedSources = sources.filter(source => validSources.includes(source));
    
    if (selectedSources.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid sources selected'
      });
    }
    
    // Validate categories
    const validCategories = ['Fitness', 'Nutrition', 'Workout Plans', 'Health Tips', 'Motivation'];
    const selectedCategories = categories.filter(category => validCategories.includes(category));
    
    if (selectedCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid categories selected'
      });
    }
    
    console.log(`Importing content from sources: ${selectedSources.join(', ')}`);
    console.log(`Categories: ${selectedCategories.join(', ')}`);
    console.log(`Requested count: ${count}`);
    
    // First, get existing source URLs from the database
    const existingBlogs = await Blog.find({ 'source.url': { $exists: true, $ne: '' } }, 'source.url');
    const existingUrls = new Set(existingBlogs.map(blog => blog.source.url));
    
    console.log(`Found ${existingUrls.size} existing blog URLs in database`);
    
    // Fetch articles from selected sources in parallel
    const fetchPromises = [];
    
    if (selectedSources.includes('newsapi')) {
      fetchPromises.push(fetchFromNewsAPI(selectedCategories));
    }
    
    if (selectedSources.includes('rss')) {
      fetchPromises.push(parseRSSFeeds(selectedCategories));
    }
    
    // Execute all fetch promises in parallel
    const articlesArrays = await Promise.all(fetchPromises);
    let allArticles = articlesArrays.flat();
    
    // Filter out articles that already exist in the database
    let newArticles = allArticles.filter(article => {
      return article.source?.url && !existingUrls.has(article.source.url);
    });
    
    // Remove duplicates within the fetched articles (based on URL)
    const uniqueUrls = new Set();
    newArticles = newArticles.filter(article => {
      if (!article.source?.url || uniqueUrls.has(article.source.url)) {
        return false;
      }
      uniqueUrls.add(article.source.url);
      return true;
    });
    
    console.log(`Found ${allArticles.length} total articles, ${newArticles.length} are new unique articles`);
    
    if (newArticles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No new articles found from selected sources. All articles have already been imported or try different sources/categories.'
      });
    }
    
    // Process up to 3x the requested count to ensure we have enough
    // after content processing (some might be rejected due to content length)
    const articlesToProcess = newArticles.slice(0, count * 3);
    console.log(`Processing ${articlesToProcess.length} articles to meet target count of ${count}...`);
    
    // Process and clean articles
    const processedArticles = await processContent(articlesToProcess, selectedCategories);
    
    if (processedArticles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to process any articles with sufficient content. Try different sources or categories.'
      });
    }
    
    console.log(`Successfully processed ${processedArticles.length} articles with sufficient content`);
    
    // Limit to requested count
    const limitedArticles = processedArticles.slice(0, count);
    console.log(`Limited to ${limitedArticles.length} articles per user request`);
    
    // Save articles to database
    const importedBlogs = [];
    
    for (const article of limitedArticles) {
      try {
        const blog = new Blog({
          title: article.title,
          slug: article.slug,
          metaDescription: article.metaDescription,
          content: article.content,
          category: article.category,
          tags: article.tags,
          author: req.user._id,
          status: 'draft',
          readingTime: article.readingTime,
          source: {
            name: article.source.name,
            url: article.source.url,
            type: article.source.type,
            importedAt: new Date()
          }
        });
        
        await blog.save();
        importedBlogs.push(blog);
        console.log(`Saved blog "${article.title}" to database`);
      } catch (error) {
        console.error(`Error saving blog "${article.title}":`, error);
      }
    }
    
    if (importedBlogs.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save any blogs to database'
      });
    }
    
    // Include details about duplication in the response
    const stats = {
      totalFetched: allArticles.length,
      duplicatesSkipped: allArticles.length - newArticles.length,
      successfullyProcessed: processedArticles.length,
      actuallyImported: importedBlogs.length,
      requestedCount: count
    };
    
    res.status(200).json({
      success: true,
      data: importedBlogs,
      stats: stats,
      message: `Successfully imported ${importedBlogs.length} new blog posts with quality content`,
    });
  } catch (error) {
    console.error('Error importing content:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
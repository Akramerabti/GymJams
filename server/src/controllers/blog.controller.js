// server/src/controllers/blog.controller.js - Updated with content import functionality
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sanitizeQuery, asyncHandler } from '../utils/helpers.js';
import axios from 'axios';
import logger from '../utils/logger.js';

// Create a new blog post
export const createBlog = asyncHandler(async (req, res) => {
  const { title, content, category, tags, metaDescription, featuredImage, adPlacements, status } = req.body;
  
  if (!title || !content || !category || !metaDescription) {
    return res.status(400).json({ 
      message: 'Please provide all required fields: title, content, category, metaDescription' 
    });
  }

  // Create the blog post with the current user as author
  const blog = await Blog.create({
    title,
    content,
    metaDescription,
    category,
    tags: tags || [],
    featuredImage: featuredImage || {},
    author: req.user.id,
    status: status || 'draft',
    adPlacements: adPlacements || []
  });

  res.status(201).json({
    success: true,
    data: blog
  });
});

// Get all published blog posts with filtering, pagination, and sorting
export const getAllBlogs = asyncHandler(async (req, res) => {
  // Query parameters
  const { 
    page = 1, 
    limit = 10, 
    category, 
    tag, 
    author, 
    search,
    featured,
    source,
    sort = 'publishDate:desc' 
  } = req.query;
  
  // Build query
  const query = { status: 'published' };
  
  // Add filters
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (author) query.author = author;
  if (featured === 'true') query.featured = true;
  
  // Filter by source type (for imported content)
  if (source) {
    query['source.type'] = source;
  }
  
  // Add search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Parse sort
  const [sortField, sortDirection] = sort.split(':');
  const sortOptions = { [sortField]: sortDirection === 'desc' ? -1 : 1 };
  
  // Pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = parseInt(page) * parseInt(limit);
  const total = await Blog.countDocuments(query);
  
  // Execute query
  const blogs = await Blog.find(query)
    .populate('author', 'firstName lastName profileImage')
    .populate('coAuthors', 'firstName lastName profileImage')
    .sort(sortOptions)
    .skip(startIndex)
    .limit(parseInt(limit))
    .select('-adPlacements.adCode'); // Don't expose ad codes in the response
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: parseInt(page) + 1,
      limit: parseInt(limit)
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: parseInt(page) - 1,
      limit: parseInt(limit)
    };
  }
  
  res.status(200).json({
    success: true,
    count: blogs.length,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalItems: total
    },
    data: blogs
  });
});

// Get single blog post by slug
export const getBlog = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const blog = await Blog.findOne({ slug, status: 'published' })
    .populate('author', 'firstName lastName profileImage bio')
    .populate('coAuthors', 'firstName lastName profileImage')
    .populate('comments.user', 'firstName lastName profileImage')
    .populate('comments.replies.user', 'firstName lastName profileImage')
    .populate('relatedPosts', 'title slug featuredImage publishDate');
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }

  // Increment view count (don't await to improve response time)
  blog.analytics.views += 1;
  blog.save();
  
  res.status(200).json({
    success: true,
    data: blog
  });
});

// Update blog post
export const updateBlog = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const updates = req.body;
  
  // Find blog
  let blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // Check ownership or admin
  if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update this blog post' });
  }
  
  // Update blog
  blog = await Blog.findOneAndUpdate({ slug }, updates, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: blog
  });
});

// Delete blog post
export const deleteBlog = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // Check ownership or admin
  if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this blog post' });
  }
  
  await blog.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get blog categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: categories
  });
});

// Get blog tags
export const getTags = asyncHandler(async (req, res) => {
  const tags = await Blog.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: tags
  });
});

// Add comment to blog
export const addComment = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }
  
  const blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  const comment = {
    user: req.user.id,
    content
  };
  
  blog.comments.push(comment);
  await blog.save();
  
  // Populate user info
  const populatedBlog = await Blog.findOne({ slug })
    .populate('comments.user', 'firstName lastName profileImage');
  
  res.status(201).json({
    success: true,
    data: populatedBlog.comments[populatedBlog.comments.length - 1]
  });
});

// Get author's blogs
export const getAuthorBlogs = asyncHandler(async (req, res) => {
  const { authorId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { author: authorId };
  
  // If not the author or admin, only show published posts
  if (req.user.id !== authorId && req.user.role !== 'admin') {
    query.status = 'published';
  } else if (status) {
    query.status = status;
  }
  
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const total = await Blog.countDocuments(query);
  
  const blogs = await Blog.find(query)
    .populate('author', 'firstName lastName profileImage')
    .sort({ publishDate: -1 })
    .skip(startIndex)
    .limit(parseInt(limit));
  
  res.status(200).json({
    success: true,
    count: blogs.length,
    pagination: {
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalItems: total
    },
    data: blogs
  });
});

// Get related blogs
export const getRelatedBlogs = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // Find blogs in same category, excluding current blog
  const relatedBlogs = await Blog.find({
    status: 'published',
    _id: { $ne: blog._id },
    category: blog.category
  })
    .limit(3)
    .select('title slug featuredImage publishDate');
  
  res.status(200).json({
    success: true,
    data: relatedBlogs
  });
});

// ===== Ad Management Functions =====

// Add ad placement to blog
export const addAdPlacement = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { position, adNetwork, adCode, displayCondition, isActive } = req.body;
  
  const blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // Check permission - only admin can add ads
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to add ad placements' });
  }
  
  const adPlacement = {
    position,
    adNetwork,
    adCode,
    displayCondition: displayCondition || { minReadTime: 0, deviceTypes: ['all'] },
    isActive: isActive !== undefined ? isActive : true
  };
  
  blog.adPlacements.push(adPlacement);
  await blog.save();
  
  res.status(201).json({
    success: true,
    data: blog.adPlacements[blog.adPlacements.length - 1]
  });
});

// Update ad placement
export const updateAdPlacement = asyncHandler(async (req, res) => {
  const { slug, adId } = req.params;
  const updates = req.body;
  
  const blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // Check permission - only admin can update ads
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update ad placements' });
  }
  
  // Find ad placement index
  const adIndex = blog.adPlacements.findIndex(ad => ad._id.toString() === adId);
  
  if (adIndex === -1) {
    return res.status(404).json({ message: 'Ad placement not found' });
  }
  
  // Update fields
  Object.keys(updates).forEach(key => {
    blog.adPlacements[adIndex][key] = updates[key];
  });
  
  await blog.save();
  
  res.status(200).json({
    success: true,
    data: blog.adPlacements[adIndex]
  });
});

// Remove ad placement
export const removeAdPlacement = asyncHandler(async (req, res) => {
  const { slug, adId } = req.params;
  
  const blog = await Blog.findOne({ slug });
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // Check permission - only admin can remove ads
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to remove ad placements' });
  }
  
  // Remove ad placement
  blog.adPlacements = blog.adPlacements.filter(
    ad => ad._id.toString() !== adId
  );
  
  await blog.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get blog analytics
export const getBlogAnalytics = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { startDate, endDate } = req.query;
  
  const blog = await Blog.findOne({ slug }).select('analytics title');
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  // For a real implementation, we would query analytics data by date range
  // Here, we'll just return the current analytics data
  
  res.status(200).json({
    success: true,
    data: {
      title: blog.title,
      analytics: blog.analytics
    }
  });
});

// Get ad performance data 
export const getAdPerformance = asyncHandler(async (req, res) => {
  // This would typically connect to ad network APIs to pull real performance data
  // For now, we'll return mock data
  
  // Check permission - only admin can view ad performance
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view ad performance data' });
  }
  
  res.status(200).json({
    success: true,
    data: {
      adsense: {
        impressions: 12340,
        clicks: 123,
        ctr: 0.99,
        revenue: 45.67,
        rpm: 3.7
      },
      mediavine: {
        impressions: 8760,
        clicks: 88,
        ctr: 1.0,
        revenue: 78.90,
        rpm: 9.0
      }
    }
  });
});

// ===== CONTENT IMPORT FUNCTIONS =====

/**
 * Import content from third-party sources
 * @route POST /api/blog/import
 * @access Admin only
 */
export const importContent = asyncHandler(async (req, res) => {
  // Only admins can import content
  if (req.user.role !== 'admin' && req.user.role !== 'taskforce') {
    return res.status(403).json({ message: 'Not authorized to import content' });
  }

  const { sources, categories, limit, autoPublish } = req.body;
  
  if (!Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one source' });
  }

  try {
    // Array to store imported blogs
    const importedBlogs = [];
    
    // Handle NewsAPI import
    if (sources.includes('newsapi')) {
      const newsArticles = await fetchFromNewsAPI(
        categories || ['fitness', 'nutrition', 'health', 'supplements'],
        limit || 10
      );
      
      for (const article of newsArticles) {
        try {
          const blogData = await convertToBlogFormat(article, req.user.id, autoPublish);
          
          // Check if already exists by title or URL
          const existingBlog = await Blog.findOne({
            $or: [
              { 'source.url': article.url },
              { title: article.title }
            ]
          });
          
          if (!existingBlog) {
            const newBlog = await Blog.create(blogData);
            importedBlogs.push(newBlog);
            logger.info(`Imported article: ${newBlog.title}`);
          }
        } catch (err) {
          logger.error(`Error importing article: ${err.message}`);
        }
      }
    }
    
    // Handle Spoonacular import (for nutrition content)
    if (sources.includes('spoonacular')) {
      const nutritionArticles = await fetchFromSpoonacular(
        limit || 10
      );
      
      for (const article of nutritionArticles) {
        try {
          const blogData = await convertToBlogFormat(article, req.user.id, autoPublish);
          
          // Check if already exists
          const existingBlog = await Blog.findOne({
            $or: [
              { 'source.url': article.url },
              { title: article.title }
            ]
          });
          
          if (!existingBlog) {
            const newBlog = await Blog.create(blogData);
            importedBlogs.push(newBlog);
            logger.info(`Imported nutrition article: ${newBlog.title}`);
          }
        } catch (err) {
          logger.error(`Error importing nutrition article: ${err.message}`);
        }
      }
    }
    
    // Handle RSS import for health feeds
    if (sources.includes('rss')) {
      const rssArticles = await fetchFromRSSFeeds(
        categories || ['fitness', 'nutrition'],
        limit || 10
      );
      
      for (const article of rssArticles) {
        try {
          const blogData = await convertToBlogFormat(article, req.user.id, autoPublish);
          
          // Check if already exists
          const existingBlog = await Blog.findOne({
            $or: [
              { 'source.url': article.url },
              { title: article.title }
            ]
          });
          
          if (!existingBlog) {
            const newBlog = await Blog.create(blogData);
            importedBlogs.push(newBlog);
            logger.info(`Imported RSS article: ${newBlog.title}`);
          }
        } catch (err) {
          logger.error(`Error importing RSS article: ${err.message}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: importedBlogs.length,
      data: importedBlogs.map(blog => ({
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        status: blog.status,
        category: blog.category,
        source: blog.source
      }))
    });
  } catch (error) {
    logger.error(`Content import failed: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Content import failed', 
      error: error.message 
    });
  }
});

/**
 * Get imported content statistics
 * @route GET /api/blog/import/stats
 * @access Admin only
 */
export const getImportStats = asyncHandler(async (req, res) => {
  // Only admins can view import stats
  if (req.user.role !== 'admin' && req.user.role !== 'taskforce') {
    return res.status(403).json({ message: 'Not authorized to view import statistics' });
  }

  // Get counts for each source type
  const sourceStats = await Blog.aggregate([
    { $match: { 'source.type': { $exists: true } } },
    { $group: { _id: '$source.type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get counts by category for imported content
  const categoryStats = await Blog.aggregate([
    { $match: { 'source.type': { $exists: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get counts by status
  const statusStats = await Blog.aggregate([
    { $match: { 'source.type': { $exists: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // Get total and recent imports
  const totalImported = await Blog.countDocuments({ 'source.type': { $exists: true } });
  const recentImports = await Blog.countDocuments({
    'source.type': { $exists: true },
    'source.importedAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  });
  
  res.status(200).json({
    success: true,
    data: {
      total: totalImported,
      recentImports,
      bySource: sourceStats,
      byCategory: categoryStats,
      byStatus: statusStats
    }
  });
});

/**
 * Update imported content status (e.g., approve drafts)
 * @route PUT /api/blog/import/:id
 * @access Admin only
 */
export const updateImportedContent = asyncHandler(async (req, res) => {
  // Only admins can update imported content
  if (req.user.role !== 'admin' && req.user.role !== 'taskforce') {
    return res.status(403).json({ message: 'Not authorized to update imported content' });
  }

  const { id } = req.params;
  const { status, content, tags, category } = req.body;
  
  const blog = await Blog.findById(id);
  
  if (!blog) {
    return res.status(404).json({ message: 'Blog post not found' });
  }
  
  if (!blog.source || !blog.source.type) {
    return res.status(400).json({ message: 'Not an imported blog post' });
  }
  
  // Update fields
  if (status) blog.status = status;
  if (content) blog.content = content;
  if (category) blog.category = category;
  if (tags) blog.tags = tags;
  
  // If publishing for the first time
  if (status === 'published' && blog.status !== 'published') {
    blog.publishDate = new Date();
  }
  
  await blog.save();
  
  res.status(200).json({
    success: true,
    data: blog
  });
});

// Helper functions for content import

/**
 * Fetch articles from News API
 * @private
 */
async function fetchFromNewsAPI(categories, limit) {
  try {
    // Convert our categories to NewsAPI compatible terms
    const categoryMappings = {
      fitness: 'fitness OR exercise OR workout',
      nutrition: 'nutrition OR diet OR healthy eating',
      health: 'health OR wellness',
      supplements: 'supplements OR vitamins OR protein'
    };
    
    // Build queries for each category
    const queries = categories.map(cat => categoryMappings[cat] || cat);
    const queryString = queries.join(' OR ');
    
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: queryString,
        apiKey: process.env.NEWSAPI_KEY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit
      }
    });
    
    if (response.data.status === 'ok') {
      return response.data.articles.map(article => ({
        ...article,
        source: {
          name: article.source.name,
          url: article.url,
          type: 'newsapi'
        }
      }));
    }
    
    return [];
  } catch (error) {
    logger.error(`NewsAPI fetch error: ${error.message}`);
    return [];
  }
}

/**
 * Fetch nutrition articles from Spoonacular API
 * @private
 */
async function fetchFromSpoonacular(limit) {
  try {
    const response = await axios.get('https://api.spoonacular.com/food/articles', {
      params: {
        apiKey: process.env.SPOONACULAR_API_KEY,
        number: limit
      }
    });
    
    if (response.data && response.data.articles) {
      return response.data.articles.map(article => ({
        title: article.title,
        description: article.summary || '',
        content: article.content || '',
        urlToImage: article.image,
        url: article.sourceUrl,
        publishedAt: article.date || new Date().toISOString(),
        source: {
          name: 'Spoonacular',
          url: article.sourceUrl,
          type: 'spoonacular'
        }
      }));
    }
    
    return [];
  } catch (error) {
    logger.error(`Spoonacular fetch error: ${error.message}`);
    return [];
  }
}

/**
 * Fetch articles from RSS feeds
 * @private
 */
async function fetchFromRSSFeeds(categories, limit) {
  try {
    // Define RSS feeds for fitness, health and nutrition
    const rssFeeds = {
      fitness: [
        'https://www.bodybuilding.com/rss/articles',
        'https://www.menshealth.com/rss/all.xml/',
        'https://www.shape.com/feeds/all/rss.xml'
      ],
      nutrition: [
        'https://www.nutritioninsight.com/rss/all.xml',
        'https://www.eatingwell.com/feed/',
        'https://www.healthline.com/nutrition/feed'
      ],
      health: [
        'https://www.health.com/feed/rss.xml',
        'https://www.medicalnewstoday.com/newsfeeds/medical-science.xml',
        'https://rss.medicalnewstoday.com/fitness-nutrition.xml'
      ],
      supplements: [
        'https://www.supplementnews.org/feed/',
        'https://www.nutraingredients.com/rss/feed/news'
      ]
    };
    
    // Select feeds based on requested categories
    const selectedFeeds = categories
      .filter(cat => rssFeeds[cat])
      .flatMap(cat => rssFeeds[cat])
      .slice(0, 3); // Limit to 3 feeds to avoid too many requests
    
    // We would typically use a library like rss-parser here
    // For this example, we'll create a placeholder response
    const mockArticles = selectedFeeds.flatMap((feed, index) => {
      // Create 3 mock articles per feed
      return Array.from({ length: 3 }, (_, i) => ({
        title: `Fitness article ${index * 3 + i + 1} from ${feed.split('/')[2]}`,
        description: 'This is a placeholder for an RSS feed article description.',
        content: '<p>This is a placeholder for RSS feed content. In a real implementation, we would parse the actual content from the feed.</p>',
        urlToImage: `https://via.placeholder.com/800x400?text=Fitness+Article+${index * 3 + i + 1}`,
        url: `https://${feed.split('/')[2]}/article-${index * 3 + i + 1}`,
        publishedAt: new Date().toISOString(),
        source: {
          name: feed.split('/')[2],
          url: feed,
          type: 'rss'
        }
      }));
    });
    
    return mockArticles.slice(0, limit);
  } catch (error) {
    logger.error(`RSS feed fetch error: ${error.message}`);
    return [];
  }
}

/**
 * Convert third-party article to our blog format
 * @private
 */
async function convertToBlogFormat(article, authorId, autoPublish = false) {
  try {
    // Determine category based on content
    const categoryMap = {
      workout: 'Fitness',
      exercise: 'Fitness',
      gym: 'Fitness',
      diet: 'Nutrition',
      nutrition: 'Nutrition',
      recipe: 'Nutrition',
      vitamin: 'Health Tips',
      supplement: 'Supplements',
      protein: 'Nutrition',
      weight: 'Fitness',
      health: 'Health Tips',
      wellness: 'Health Tips'
    };
    
    // Simple algorithm to determine the best category
    let bestCategory = 'Health Tips'; // Default
    let highestScore = 0;
    
    const content = (article.content || '') + ' ' + (article.description || '') + ' ' + (article.title || '');
    const contentLower = content.toLowerCase();
    
    for (const [keyword, category] of Object.entries(categoryMap)) {
      const regex = new RegExp(keyword, 'gi');
      const matches = contentLower.match(regex);
      const score = matches ? matches.length : 0;
      
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }
    
    // Extract tags from content
    const possibleTags = [
      'workout', 'cardio', 'strength', 'protein', 'diet', 'nutrition',
      'vitamins', 'supplements', 'weight loss', 'muscle', 'fitness',
      'health', 'wellness', 'exercise', 'gym', 'training'
    ];
    
    const tags = possibleTags.filter(tag => 
      contentLower.includes(tag.toLowerCase())
    ).slice(0, 5); // Limit to 5 tags
    
    // Generate a unique slug
    const baseSlug = slugify(article.title || 'blog-post', {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;
    
    // Estimate reading time: average 200 words per minute
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    // Set up monetization
    const monetization = {
      isMonetized: true,
      adDensity: 'medium',
      adPositions: ['top', 'middle', 'bottom', 'sidebar'],
      adsenseCategory: bestCategory === 'Fitness' ? 'Health & Fitness' : 
                       bestCategory === 'Nutrition' ? 'Food & Drink' : 'Health',
      customKeywords: [...tags, bestCategory.toLowerCase(), 'health', 'wellness']
    };
    
    // Create default ad placements for imported content
    const adPlacements = [
      {
        position: 'top',
        adNetwork: 'adsense',
        adCode: '<div id="div-gpt-ad-top" style="min-height: 90px; width: 100%;"></div>',
        isActive: true,
        displayCondition: {
          minReadTime: 0,
          deviceTypes: ['all']
        }
      },
      {
        position: 'sidebar',
        adNetwork: 'adsense',
        adCode: '<div id="div-gpt-ad-sidebar" style="min-height: 250px; width: 100%;"></div>',
        isActive: true,
        displayCondition: {
          minReadTime: 0,
          deviceTypes: ['desktop', 'tablet']
        }
      },
      {
        position: 'in-content',
        adNetwork: 'adsense',
        adCode: '<div id="div-gpt-ad-incontent" style="min-height: 250px; width: 100%;"></div>',
        isActive: true,
        displayCondition: {
          minReadTime: 1,
          deviceTypes: ['all']
        }
      },
      {
        position: 'bottom',
        adNetwork: 'adsense',
        adCode: '<div id="div-gpt-ad-bottom" style="min-height: 90px; width: 100%;"></div>',
        isActive: true,
        displayCondition: {
          minReadTime: 0,
          deviceTypes: ['all']
        }
      }
    ];
    
    return {
      title: article.title,
      slug,
      metaDescription: article.description || article.title.substring(0, 150),
      content: article.content || '<p>Visit the original source for full content.</p>',
      featuredImage: {
        url: article.urlToImage || '',
        alt: article.title,
        credit: article.source.name
      },
      author: authorId,
      category: bestCategory,
      subcategory: '',
      tags,
      status: autoPublish ? 'published' : 'draft',
      readingTime,
      publishDate: autoPublish ? new Date() : null,
      adPlacements,
      monetization,
      source: {
        name: article.source.name,
        url: article.source.url,
        type: article.source.type,
        importedAt: new Date()
      }
    };
  } catch (error) {
    logger.error(`Error converting article: ${error.message}`);
    throw error;
  }
}
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

// ===== NEW: BLOG IMPORT FUNCTIONS =====

// Parse RSS feeds function
const parseRSSFeeds = async (categories) => {
  const fitnessFeeds = [
    'https://www.t-nation.com/feed/', 
    'https://feeds.feedburner.com/MuscleForLife',
    'https://fitnessvolt.com/feed/',
    'https://www.nerdfitness.com/blog/feed/'
  ];
  
  const nutritionFeeds = [
    'https://www.marksdailyapple.com/feed/',
    'https://rss.sciencedaily.com/fitness_nutrition.xml',
    'https://www.precisionnutrition.com/feed'
  ];
  
  // Select feeds based on requested categories
  let feedsToFetch = [];
  if (categories.includes('Fitness')) {
    feedsToFetch = [...feedsToFetch, ...fitnessFeeds];
  }
  if (categories.includes('Nutrition')) {
    feedsToFetch = [...feedsToFetch, ...nutritionFeeds];
  }
  
  if (feedsToFetch.length === 0) {
    feedsToFetch = [...fitnessFeeds, ...nutritionFeeds];
  }
  
  const parser = new RSS({
    customFields: {
      item: [
        ['content:encoded', 'fullContent'],  // Add this line to get full content
        ['description', 'description']
      ]
    }
  });
  
  for (const feedUrl of feedsToFetch) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      // Process each item
      const items = feed.items.map(item => ({
        title: item.title,
        // Use full content instead of excerpt if available
        description: item.contentSnippet || item.description?.substring(0, 160) || '',
        // Use the full content field instead of description
        content: item.fullContent || item.content || item.description || '',
        url: item.link,
        publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: {
          name: sourceName,
          url: item.link,
          type: 'rss',
          importedAt: new Date()
        }
      }));
      
      results.push(...items);
    } catch (error) {
      logger.error(`Error parsing RSS feed ${feedUrl}:`, error);
    }
  }
  
  return results;
};

const fetchFullContentFromWordPress = async (url) => {
  try {
    // Extract the post ID from the URL if possible
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const postSlug = pathParts[pathParts.length - 1];
    
    // Try to get the WordPress API endpoint
    const apiUrl = `${urlObj.origin}/wp-json/wp/v2/posts?slug=${postSlug}`;
    
    const response = await axios.get(apiUrl);
    
    if (response.data && response.data.length > 0) {
      // WordPress API response includes rendered content
      return response.data[0].content.rendered;
    }
    
    // If API fails, try to scrape the content
    return await scrapeContentFromURL(url);
  } catch (error) {
    logger.error(`Error fetching WordPress content from ${url}:`, error);
    // Fallback to scraping if API fails
    return await scrapeContentFromURL(url);
  }
};

const scrapeContentFromURL = async (url) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Try various common content selectors
    const selectors = [
      'article .entry-content', 
      '.post-content', 
      '.article-content',
      'article',
      '.content',
      'main .entry-content',
      '.post-body',
      '.post .entry',
      '#content .post'
    ];
    
    for (const selector of selectors) {
      const contentElement = document.querySelector(selector);
      if (contentElement) {
        // Clean up the content
        let content = contentElement.innerHTML;
        
        // Remove navigation, related posts, etc.
        content = content.replace(/<div class="navigation">.*?<\/div>/gs, '');
        content = content.replace(/<div class="related-posts">.*?<\/div>/gs, '');
        content = content.replace(/<div class="sharedaddy">.*?<\/div>/gs, '');
        content = content.replace(/\[&#8230;\]/g, ''); // Remove ellipsis
        
        return content;
      }
    }
    
    return null;
  } catch (error) {
    logger.error(`Error scraping content from ${url}:`, error);
    return null;
  }
};

// Fetch from News API
const fetchFromNewsAPI = async (categories) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.log('Skipping NewsAPI - no API key provided');
    return []; // Return empty array instead of logging error
  }
  const categoryKeywords = {
    'Fitness': ['fitness', 'workout', 'exercise', 'gym'],
    'Nutrition': ['nutrition', 'diet', 'healthy eating', 'food'],
    'Workout Plans': ['workout plan', 'training program', 'exercise routine'],
    'Health Tips': ['health tips', 'wellness', 'healthy lifestyle']
  };
  
  // Build search query based on selected categories
  let keywords = [];
  categories.forEach(category => {
    if (categoryKeywords[category]) {
      keywords = [...keywords, ...categoryKeywords[category]];
    }
  });
  
  // If no categories specified, use a default set
  if (keywords.length === 0) {
    keywords = ['fitness', 'nutrition', 'workout', 'health'];
  }
  
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.log('NEWS_API_KEY not found in environment variables - using default fitness content');
      return await fetchDefaultFitnessContent();
    }
    
    // Combine keywords for the query
    const query = keywords.join(' OR ');
    
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: query,
        pageSize: 20,
        language: 'en',
        sortBy: 'publishedAt',
        apiKey
      }
    });
    
    if (response.data.status !== 'ok' || !response.data.articles) {
      console.error('News API error:', response.data);
      return await fetchDefaultFitnessContent();
    }
    
    // Process articles
    const articles = response.data.articles.map(article => ({
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
    
    return articles;
  } catch (error) {
    console.error('Error fetching from News API:', error);
    return await fetchDefaultFitnessContent();
  }
};

// Fetch nutrition-related content from Spoonacular
const fetchFromSpoonacular = async () => {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      logger.error('SPOONACULAR_API_KEY not found in environment variables');
      return [];
    }
    
    // Get nutrition articles from Spoonacular
    const response = await axios.get(`https://api.spoonacular.com/food/articles`, {
      params: {
        apiKey,
        number: 20
      }
    });
    
    if (!response.data || !response.data.articles) {
      logger.error('Spoonacular API error:', response.data);
      return [];
    }
    
    // Process articles - we need to fetch full content for each
    const articles = [];
    for (const article of response.data.articles) {
      try {
        // Get content from URL
        const contentResponse = await axios.get(article.url);
        
        // Use cheerio to extract content
        const $ = cheerio.load(contentResponse.data);
        let content = '';
        
        // Different sites have different structures, try common content selectors
        const contentSelectors = ['article', '.post-content', '.entry-content', '.content', '#content', 'main'];
        for (const selector of contentSelectors) {
          const el = $(selector);
          if (el.length) {
            content = el.html() || '';
            break;
          }
        }
        
        // Clean content
        content = sanitizeHtml(content);
        
        articles.push({
          title: article.title,
          description: article.description || article.summary || '',
          content,
          url: article.url,
          publishDate: new Date(),
          source: {
            name: 'Spoonacular',
            url: article.url,
            type: 'spoonacular',
            importedAt: new Date()
          }
        });
      } catch (error) {
        logger.error(`Error fetching content for ${article.url}:`, error);
        // Continue with next article
      }
    }
    
    return articles;
  } catch (error) {
    logger.error('Error fetching from Spoonacular:', error);
    return [];
  }
};

// Complete updated processContent function for blog.controller.js

// First add these helper functions above processContent

// Function to fetch full content from a URL
const fetchFullContent = async (url) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Try various common content selectors
    const selectors = [
      'article .entry-content', 
      '.post-content', 
      '.article-content',
      'article',
      '.content',
      '.entry-content',
      'main .entry-content',
      '.post-body',
      '.post .entry',
      '#content .post',
      '.post-container',
      '.blog-post-content'
    ];
    
    for (const selector of selectors) {
      const contentElement = document.querySelector(selector);
      if (contentElement) {
        // Clean up the content
        let content = contentElement.innerHTML;
        
        // Remove navigation, related posts, sharing widgets, etc.
        const elementsToRemove = [
          '.navigation', '.post-navigation', '.nav-links',
          '.related-posts', '.yarpp-related', '.related-content',
          '.sharedaddy', '.share-buttons', '.social-share',
          '.comments', '#comments', '.comment-section',
          '.adsbygoogle', '.advertisement', '.ad-container',
          '.sidebar', '.widget-area',
          '.author-bio', '.about-author',
          '.post-tags', '.tag-links'
        ];
        
        for (const selector of elementsToRemove) {
          const elements = contentElement.querySelectorAll(selector);
          elements.forEach(el => el.parentNode?.removeChild(el));
        }
        
        // Get the cleaned content
        content = contentElement.innerHTML;
        
        // Remove empty paragraphs and divs
        content = content.replace(/<p>\s*<\/p>/g, '');
        content = content.replace(/<div>\s*<\/div>/g, '');
        
        // Remove ellipsis markers
        content = content.replace(/\[&#8230;\]/g, '');
        content = content.replace(/\[…\]/g, '');
        content = content.replace(/\.\.\.\s*$/g, '');
        content = content.replace(/&hellip;/g, '');
        
        // Clean up any "read more" or "continue reading" links
        content = content.replace(/<a[^>]*>Read more.*?<\/a>/gi, '');
        content = content.replace(/<a[^>]*>Continue reading.*?<\/a>/gi, '');
        
        return content;
      }
    }
    
    // If no selectors match, try getting the entire body content
    const bodyContent = document.querySelector('body');
    if (bodyContent) {
      // Use a simpler extraction approach
      // Try to find the largest text block which is likely the main content
      const paragraphs = bodyContent.querySelectorAll('p');
      let largestTextBlock = '';
      let maxLength = 0;
      
      // Group adjacent paragraphs to find the main content
      let currentBlock = '';
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const text = p.textContent.trim();
        
        if (text.length > 20) { // Minimum paragraph length
          currentBlock += p.outerHTML;
          
          // Check if we're at the end or next paragraph is far away
          if (i === paragraphs.length - 1 || 
              !p.nextElementSibling || 
              p.nextElementSibling.tagName !== 'P') {
            
            if (currentBlock.length > maxLength) {
              maxLength = currentBlock.length;
              largestTextBlock = currentBlock;
            }
            currentBlock = '';
          }
        }
      }
      
      if (largestTextBlock.length > 200) { // Minimum content length
        return largestTextBlock;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return null;
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

// The main processContent function
const processContent = async (articles, categories) => {
  if (!Array.isArray(articles)) {
    console.error('Articles parameter is not an array:', typeof articles);
    return [];
  }
  const processedArticles = [];
  
  for (const article of articles) {
    try {
      console.log(`Processing article: "${article.title}"`);
      
      // Check if content is truncated
      let finalContent = article.content || '';
      
      if (isContentTruncated(finalContent) && article.source?.url) {
        console.log(`Content appears to be truncated, attempting to fetch full content from: ${article.source.url}`);
        
        // Try to fetch full content
        const fetchedContent = await fetchFullContent(article.source.url);
        
        if (fetchedContent && fetchedContent.length > finalContent.length) {
          console.log(`Successfully fetched full content (${fetchedContent.length} chars vs. original ${finalContent.length} chars)`);
          finalContent = fetchedContent;
        } else {
          console.log(`Could not fetch fuller content, using original (${finalContent.length} chars)`);
        }
      }
      
      // Convert common HTML entities
      finalContent = finalContent
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&#8230;/g, '...')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      // Determine category
      let category = article.category || '';
      
      if (!category || !categories.includes(category)) {
        category = determineCategory(article);
      }
      
      // Extract tags if not provided
      const tags = article.tags?.length > 0 ? article.tags : extractTags({
        title: article.title,
        content: finalContent
      });
      
      // Create meta description if not provided
      let metaDescription = article.metaDescription || article.description || '';
      
      if (!metaDescription) {
        // Extract first paragraph text for meta description
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
        title: article.title || 'Untitled Article',
        slug: article.slug || generateSlug(article.title),
        metaDescription: metaDescription,
        content: finalContent,
        category: category,
        tags: tags,
        status: 'draft', // Default to draft
        source: article.source || {
          name: 'Unknown',
          url: '',
          type: 'manual',
          importedAt: new Date()
        },
        readingTime: readingTime,
        publishDate: article.publishDate || new Date()
      });
      
      console.log(`Processed "${article.title}" - ${finalContent.length} chars, ${readingTime} min read time`);
      
    } catch (error) {
      console.error(`Error processing article "${article.title}":`, error);
      // Skip this article if processing fails
    }
  }
  
  return processedArticles;
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
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Increment view count
    blog.analytics.views += 1;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: { views: blog.analytics.views }
    });
  } catch (error) {
    logger.error('Error tracking blog view:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// The issue is in the importContent function in server/src/controllers/blog.controller.js
// Specifically around line 1369 where processedArticles.slice is being called
// Let's modify the function:

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
    
    // Fetch articles from selected sources
    let allArticles = [];
    let errors = [];
    
    // Try NewsAPI first
    if (selectedSources.includes('newsapi')) {
      try {
        console.log('Fetching from News API...');
        const newsArticles = await fetchFromNewsAPI(selectedCategories);
        allArticles = [...allArticles, ...newsArticles];
      } catch (error) {
        console.error('Error fetching from News API:', error);
        errors.push('NewsAPI error: ' + error.message);
      }
    }
    
    // If we don't have enough articles, add default content
    if (allArticles.length < count) {
      try {
        console.log('Fetching default fitness content...');
        const defaultArticles = await fetchDefaultFitnessContent();
        allArticles = [...allArticles, ...defaultArticles];
      } catch (error) {
        console.error('Error fetching default content:', error);
        errors.push('Default content error: ' + error.message);
      }
    }
    
    // Process and clean articles
    console.log(`Processing ${allArticles.length} articles...`);
    // Make sure processContent returns an array
    const processedArticles = await processContent(allArticles, selectedCategories) || [];
    
    if (!Array.isArray(processedArticles)) {
      console.error('processContent did not return an array:', processedArticles);
      throw new Error('Invalid processed articles format');
    }
    
    // Limit to requested count
    const limitedArticles = processedArticles.slice(0, count);
    console.log(`Limited to ${limitedArticles.length} articles`);

    const importedBlogs = [];

    for (const article of limitedArticles) {
      try {
        const blog = new Blog();
        blog.title = article.title || 'Untitled Article';
        blog.metaDescription = article.metaDescription || article.description?.substring(0, 160) || 'No description available';
        blog.content = article.content || '<p>Content unavailable</p>';
        blog.category = article.category || selectedCategories[0];
        blog.tags = article.tags || [];
        blog.author = req.user._id;
        blog.status = 'draft';
        blog.source = {
          name: String(article.source?.name || 'Unknown'), 
          url: String(article.source?.url || ''),
          type: String(article.source?.type || 'unknown'),
          importedAt: new Date()
        };
        
        await blog.save();
        importedBlogs.push(blog);
      } catch (error) {
        console.error('Error saving blog:', error);
        // Continue to next article
      }
    }
    
    res.status(200).json({
      success: true,
      data: importedBlogs,
      message: `Imported ${importedBlogs.length} blog posts`,
      warnings: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing content:', error);
    res.status(500).json({
      success: false,
      message: error.message
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
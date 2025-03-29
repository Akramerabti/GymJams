import Blog from '../models/Blog.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sanitizeQuery, asyncHandler } from '../utils/helpers.js';

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
    sort = 'publishDate:desc' 
  } = req.query;
  
  // Build query
  const query = { status: 'published' };
  
  // Add filters
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (author) query.author = author;
  if (featured === 'true') query.featured = true;
  
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
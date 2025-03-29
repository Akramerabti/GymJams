import mongoose from 'mongoose';
import slugify from 'slugify';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const adPlacementSchema = new mongoose.Schema({
  position: {
    type: String,
    enum: ['top', 'middle', 'bottom', 'sidebar', 'in-content'],
    required: true
  },
  adNetwork: {
    type: String,
    enum: ['adsense', 'mediavine', 'adthrive', 'amazon', 'custom'],
    required: true
  },
  adCode: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayCondition: {
    minReadTime: { type: Number, default: 0 }, // min read time to display ad
    deviceTypes: {
      type: [String],
      enum: ['mobile', 'tablet', 'desktop', 'all'],
      default: ['all']
    }
  }
});

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  metaDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  featuredImage: {
    url: String,
    alt: String,
    credit: String
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    required: true,
    enum: ['Fitness', 'Nutrition', 'Workout Plans', 'Equipment Reviews', 'Success Stories', 'Health Tips', 'Motivation']
  },
  subcategory: {
    type: String,
    required: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  readingTime: {
    type: Number, // in minutes
    default: 0
  },
  seoScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  publishDate: {
    type: Date
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  featured: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema],
  analytics: {
    views: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    averageTimeOnPage: { type: Number, default: 0 }, // in seconds
    bounceRate: { type: Number, default: 0 }, // percentage
    clickThroughRate: { type: Number, default: 0 } // percentage
  },
  adPlacements: [adPlacementSchema],
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for comment count
blogSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Pre-save hook to generate slug
blogSchema.pre('save', function(next) {
  // Only generate slug if title has changed or slug doesn't exist
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });

    // Add unique identifier to slug if needed
    if (this.isNew) {
      this.slug += '-' + (Math.random().toString(36).substring(2, 8));
    }
  }

  // Calculate reading time
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }

  // Set publishDate if status changed to published
  if (this.isModified('status') && this.status === 'published' && !this.publishDate) {
    this.publishDate = new Date();
  }

  next();
});

// Methods
blogSchema.methods.incrementViews = async function() {
  this.analytics.views += 1;
  return this.save();
};

blogSchema.methods.addComment = async function(userId, content) {
  this.comments.push({ user: userId, content });
  return this.save();
};

// Static methods
blogSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug });
};

blogSchema.statics.findMostPopular = function(limit = 5) {
  return this.find({ status: 'published' })
    .sort({ 'analytics.views': -1 })
    .limit(limit);
};

blogSchema.statics.findByCategory = function(category, limit) {
  const query = { status: 'published', category };
  return limit 
    ? this.find(query).limit(limit) 
    : this.find(query);
};

blogSchema.statics.findByTag = function(tag, limit) {
  const query = { status: 'published', tags: tag };
  return limit 
    ? this.find(query).limit(limit) 
    : this.find(query);
};

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
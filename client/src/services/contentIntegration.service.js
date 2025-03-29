// server/src/services/contentIntegration.service.js
import axios from 'axios';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { generateSlug } from '../utils/helpers.js';

/**
 * Service to fetch and integrate blog content from third-party APIs
 * focused on fitness, health, nutrition, and supplements.
 */
class ContentIntegrationService {
  constructor() {
    // Default admin user for imported content
    this.defaultAuthorId = process.env.DEFAULT_AUTHOR_ID;
    
    // API keys and configurations
    this.apiKeys = {
      newsapi: process.env.NEWSAPI_KEY,
      medicalNewsToday: process.env.MEDICAL_NEWS_TODAY_KEY,
      nutritionix: process.env.NUTRITIONIX_API_KEY,
      spoonacular: process.env.SPOONACULAR_API_KEY
    };
  }

  /**
   * Fetch and import content from various sources
   * @param {Object} options - Import options
   * @returns {Promise<Array>} - Array of imported blog posts
   */
  async importContent(options = {}) {
    const {
      sources = ['newsapi', 'medicalNewsToday', 'spoonacular'],
      categories = ['fitness', 'nutrition', 'health', 'supplements'],
      limit = 10,
      autoPublish = false
    } = options;

    logger.info(`Starting content import from sources: ${sources.join(', ')}`);
    const importedBlogs = [];

    try {
      // Set up promises for all source fetches
      const fetchPromises = [];

      if (sources.includes('newsapi')) {
        fetchPromises.push(this.fetchFromNewsAPI(categories, limit));
      }

      if (sources.includes('medicalNewsToday')) {
        fetchPromises.push(this.fetchFromMedicalNewsToday(categories, limit));
      }

      if (sources.includes('spoonacular')) {
        fetchPromises.push(this.fetchFromSpoonacular(categories, limit));
      }

      // Wait for all fetches to complete
      const results = await Promise.allSettled(fetchPromises);
      
      // Process successful results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const articles = result.value;
          
          for (const article of articles) {
            try {
              // Convert to blog format
              const blogData = await this.convertToBlogFormat(article, autoPublish);
              
              // Check if we already have this article by URL or title
              const existingBlog = await Blog.findOne({
                $or: [
                  { 'source.url': article.url },
                  { title: article.title }
                ]
              });

              if (!existingBlog) {
                // Save new blog post
                const newBlog = await Blog.create(blogData);
                importedBlogs.push(newBlog);
                logger.info(`Imported article: ${newBlog.title}`);
              } else {
                logger.info(`Skipped duplicate article: ${article.title}`);
              }
            } catch (err) {
              logger.error(`Error importing article: ${err.message}`);
            }
          }
        } else {
          logger.error(`Source fetch failed: ${result.reason}`);
        }
      }

      logger.info(`Content import completed. Imported ${importedBlogs.length} articles.`);
      return importedBlogs;
    } catch (error) {
      logger.error(`Content import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch articles from News API
   * @param {Array} categories - Content categories to fetch
   * @param {Number} limit - Maximum articles to fetch
   * @returns {Promise<Array>} - Fetched articles
   */
  async fetchFromNewsAPI(categories, limit) {
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
          apiKey: this.apiKeys.newsapi,
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
   * Fetch articles from Medical News Today
   * Note: This is a placeholder. Medical News Today doesn't have a public API.
   * You would need to use web scraping or a dedicated service.
   */
  async fetchFromMedicalNewsToday(categories, limit) {
    // This is a placeholder. In a real implementation, you would:
    // 1. Use a service like ScrapingBee, Apify, or similar
    // 2. OR implement web scraping with Puppeteer/Cheerio
    // 3. OR use their RSS feed if available
    
    logger.info('Medical News Today fetching is a placeholder. Implement with a scraping service.');
    return [];
  }

  /**
   * Fetch articles from Spoonacular API (nutrition and recipes)
   */
  async fetchFromSpoonacular(categories, limit) {
    try {
      // We'll focus on recipes and nutrition information
      if (!categories.includes('nutrition') && !categories.includes('health')) {
        return [];
      }
      
      const response = await axios.get('https://api.spoonacular.com/food/articles', {
        params: {
          apiKey: this.apiKeys.spoonacular,
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
   * Convert a third-party article to our blog format
   */
  async convertToBlogFormat(article, autoPublish = false) {
    try {
      // Find or use default author
      let author = this.defaultAuthorId;
      
      // Try to find an admin user if default not set
      if (!author) {
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
          author = adminUser._id;
        } else {
          throw new Error('No default author or admin user found');
        }
      }
      
      // Determine category based on content
      const categoryMap = {
        workout: 'Fitness',
        exercise: 'Fitness',
        gym: 'Fitness',
        diet: 'Nutrition',
        nutrition: 'Nutrition',
        recipe: 'Nutrition',
        vitamin: 'Health Tips',
        supplement: 'Health Tips',
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
      const baseSlug = generateSlug(article.title);
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;
      
      // Estimate reading time: average 200 words per minute
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      
      return {
        title: article.title,
        slug,
        metaDescription: article.description || article.title,
        content: article.content || '<p>Visit the original source for full content.</p>',
        featuredImage: {
          url: article.urlToImage || '',
          alt: article.title,
          credit: article.source.name
        },
        author,
        category: bestCategory,
        subcategory: '',
        tags,
        status: autoPublish ? 'published' : 'draft',
        readingTime,
        publishDate: autoPublish ? new Date() : null,
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

  /**
   * Schedule regular content imports
   * @param {Object} options - Schedule options
   */
  scheduleImports(options = {}) {
    const {
      interval = 24 * 60 * 60 * 1000, // 24 hours by default
      sources,
      categories,
      limit = 5,
      autoPublish = false
    } = options;
    
    // Initial import
    this.importContent({ sources, categories, limit, autoPublish });
    
    // Schedule regular imports
    setInterval(() => {
      this.importContent({ sources, categories, limit, autoPublish });
    }, interval);
    
    logger.info(`Scheduled content imports every ${interval / (60 * 60 * 1000)} hours`);
  }
}

export default new ContentIntegrationService();
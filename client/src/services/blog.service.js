// Extended blog.service.js
import api from './api';

class BlogService {
  // Existing methods...
  
  // Get all blogs with optional filters
  async getBlogs(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add each parameter to the query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/blog?${queryString}` : '/blog';
    
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  }
  
  // Get single blog by slug
  async getBlogBySlug(slug) {
    try {
      const response = await api.get(`/blog/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching blog with slug ${slug}:`, error);
      throw error;
    }
  }
  
  // Create new blog post
  async createBlog(blogData) {
    try {
      const response = await api.post('/blog', blogData);
      return response.data;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }
  
  // Update blog post
  async updateBlog(slug, blogData) {
    try {
      const response = await api.put(`/blog/${slug}`, blogData);
      return response.data;
    } catch (error) {
      console.error(`Error updating blog with slug ${slug}:`, error);
      throw error;
    }
  }
  
  // Delete blog post
  async deleteBlog(slug) {
    try {
      const response = await api.delete(`/blog/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting blog with slug ${slug}:`, error);
      throw error;
    }
  }
  
  // Get categories
  async getCategories() {
    try {
      const response = await api.get('/blog/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      throw error;
    }
  }
  
  // Get tags
  async getTags() {
    try {
      const response = await api.get('/blog/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching blog tags:', error);
      throw error;
    }
  }
  
  // Add comment to blog post
  async addComment(slug, content) {
    try {
      const response = await api.post(`/blog/${slug}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to blog with slug ${slug}:`, error);
      throw error;
    }
  }
  
  // Get related blogs
  async getRelatedBlogs(slug) {
    try {
      const response = await api.get(`/blog/${slug}/related`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching related blogs for ${slug}:`, error);
      throw error;
    }
  }
  
  // ===== Admin functions =====
  
  // Add ad placement to blog
  async addAdPlacement(slug, adData) {
    try {
      const response = await api.post(`/blog/${slug}/ads`, adData);
      return response.data;
    } catch (error) {
      console.error(`Error adding ad placement to blog ${slug}:`, error);
      throw error;
    }
  }
  
  // Update ad placement
  async updateAdPlacement(slug, adId, adData) {
    try {
      const response = await api.put(`/blog/${slug}/ads/${adId}`, adData);
      return response.data;
    } catch (error) {
      console.error(`Error updating ad placement ${adId} in blog ${slug}:`, error);
      throw error;
    }
  }
  
  // Remove ad placement
  async removeAdPlacement(slug, adId) {
    try {
      const response = await api.delete(`/blog/${slug}/ads/${adId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing ad placement ${adId} from blog ${slug}:`, error);
      throw error;
    }
  }
  
  // Get blog analytics
  async getBlogAnalytics(slug, params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/blog/${slug}/analytics?${queryString}` : `/blog/${slug}/analytics`;
    
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching analytics for blog ${slug}:`, error);
      throw error;
    }
  }
  
  // Get ad performance data
  async getAdPerformance() {
    try {
      const response = await api.get('/blog/ads/performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching ad performance data:', error);
      throw error;
    }
  }

  // ===== NEW: Blog Import Functions =====
  
  // Import content from external sources
  async importContent(importOptions) {
    try {
      const response = await api.post('/blog/import', importOptions);
      return response.data;
    } catch (error) {
      console.error('Error importing blog content:', error);
      throw error;
    }
  }
  
  // Get import statistics
  async getImportStats() {
    try {
      const response = await api.get('/blog/import/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching import statistics:', error);
      throw error;
    }
  }
  
  // Update imported content
  async updateImportedContent(id, contentData) {
    try {
      const response = await api.put(`/blog/import/${id}`, contentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating imported content ${id}:`, error);
      throw error;
    }
  }
  
  // Approve imported blogs
  async approveImportedBlogs(blogIds) {
    try {
      const response = await api.post('/blog/import/approve', { ids: blogIds });
      return response.data;
    } catch (error) {
      console.error('Error approving imported blogs:', error);
      throw error;
    }
  }
  
  // Reject imported blogs
  async rejectImportedBlogs(blogIds) {
    try {
      const response = await api.post('/blog/import/reject', { ids: blogIds });
      return response.data;
    } catch (error) {
      console.error('Error rejecting imported blogs:', error);
      throw error;
    }
  }
}

export default new BlogService();
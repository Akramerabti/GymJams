// Updated product.service.js with request caching
import api from './api';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const productCache = {
  all: { data: null, timestamp: 0 },
  featured: { data: null, timestamp: 0 },
  categories: { data: null, timestamp: 0 },
  products: {} // Individual product cache by ID
};

// Helper function to check if cache is still valid
const isCacheValid = (cacheItem) => {
  if (!cacheItem.data) return false;
  const now = Date.now();
  return now - cacheItem.timestamp < CACHE_TTL;
};

// Helper function to store data in cache with timestamp
const updateCache = (cacheKey, data) => {
  if (typeof cacheKey === 'string') {
    productCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  } else if (typeof cacheKey === 'object' && cacheKey.id) {
    productCache.products[cacheKey.id] = {
      data,
      timestamp: Date.now()
    };
  }
  return data;
};

const productService = {
  async updateProduct(productId, productData) {
    try {
      console.log(`Updating product ${productId} with data:`, productData);
      let response;
      // Accept optional isFormData flag for clarity
      const isFormData = arguments.length > 2 ? arguments[2] : (productData instanceof FormData);
      if (isFormData) {
        response = await api.put(`/products/${productId}`, productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Otherwise, send as JSON
        response = await api.put(`/products/${productId}`, productData);
      }

      productCache.all.timestamp = 0;
      productCache.featured.timestamp = 0;
      if (productCache.products[productId]) {
        productCache.products[productId].timestamp = 0;
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to update product ${productId}:`, error);
      throw error;
    }
  },
  // Fetch coaching promos
  async getCoachingPromos() {
    try {
      const response = await api.get('/products/coaching-promos');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch coaching promos:', error);
      throw error;
    }
  },
  // Delete coupon code
  async deleteCouponCode(id) {
    try {
      const response = await api.delete(`/products/coupon-codes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete coupon code:', error);
      throw error;
    }
  },
  // Update coupon code discount
  async updateCouponDiscount(id, discount) {
    try {
      const response = await api.put(`/products/coupon-codes/${id}/discount`, { discount });
      return response.data;
    } catch (error) {
      console.error('Failed to update coupon discount:', error);
      throw error;
    }
  },
  async getProducts() {
    try {
      // Check cache first
      if (isCacheValid(productCache.all)) {
        return productCache.all.data;
      }
      // If cache is invalid or missing, make API call
      const response = await api.get('/products');
      // Ensure ratedBy is present for frontend logic
      if (response.data && Array.isArray(response.data.data)) {
        response.data.data.forEach(product => {
          if (!product.ratedBy && product.ratings) {
            product.ratedBy = [];
            product.ratings.forEach(r => {
              if (!product.ratedBy.some(u => u.toString() === r.user.toString())) {
                product.ratedBy.push(r.user);
              }
            });
          }
        });
      }
      return updateCache('all', response.data);
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  },

  async getFeaturedProducts() {
    try {
      // Check cache first
      if (isCacheValid(productCache.featured)) {
        return productCache.featured.data;
      }
      // If cache is invalid or missing, make API call
      const response = await api.get('/products/featured');
      // Ensure ratedBy is present for frontend logic
      if (response.data && Array.isArray(response.data.data)) {
        response.data.data.forEach(product => {
          if (!product.ratedBy && product.ratings) {
            product.ratedBy = [];
            product.ratings.forEach(r => {
              if (!product.ratedBy.some(u => u.toString() === r.user.toString())) {
                product.ratedBy.push(r.user);
              }
            });
          }
        });
      }
      return updateCache('featured', response.data);
    } catch (error) {
      console.error('Failed to get featured products:', error);
      throw error;
    }
  },

  async getProduct(productId) {
    try {
      // Check product-specific cache
      const cacheKey = { id: productId };
      if (productCache.products[productId] && isCacheValid(productCache.products[productId])) {
        return productCache.products[productId].data;
      }
      // If cache is invalid or missing, make API call
      const response = await api.get(`/products/${productId}`);
      // Ensure ratedBy is present for frontend logic
      if (!response.data.ratedBy && response.data.ratings) {
        response.data.ratedBy = [];
        response.data.ratings.forEach(r => {
          if (!response.data.ratedBy.some(u => u.toString() === r.user.toString())) {
            response.data.ratedBy.push(r.user);
          }
        });
      }
      return updateCache(cacheKey, response.data);
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      throw error;
    }
  },

  async getCategories() {
    try {
      // Check cache first
      if (isCacheValid(productCache.categories)) {
        //('Using cached categories data');
        return productCache.categories.data;
      }

      // If cache is invalid or missing, make API call
      const response = await api.get('/products/categories');
      return updateCache('categories', response.data);
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  },

  async getProductReviews(productId) {
    try {
      const response = await api.get(`/products/${productId}/reviews`);
      // Ensure ratedBy is present for frontend logic
      if (response.data && Array.isArray(response.data.ratings)) {
        response.data.ratedBy = [];
        response.data.ratings.forEach(r => {
          if (!response.data.ratedBy.some(u => u.toString() === r.user.toString())) {
            response.data.ratedBy.push(r.user);
          }
        });
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to get reviews for product ${productId}:`, error);
      throw error;
    }
  },

  async addReview(productId, reviewData) {
    console.log(`Adding review for product ${productId} with data:`, reviewData);
    try {
      if (!productId || typeof productId !== 'string' || productId === 'undefined') {
        throw new Error('Invalid productId provided to addReview');
      }
      if (!reviewData || typeof reviewData !== 'object') {
        throw new Error('Invalid reviewData provided to addReview');
      }
      const response = await api.post(`/products/${productId}/reviews`, reviewData);
      // Invalidate the specific product cache since it's been modified
      if (productCache.products[productId]) {
        productCache.products[productId].timestamp = 0;
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to add review for product ${productId}:`, error);
      throw error;
    }
  },

  async searchProducts(query) {
    try {
      // Search is always fresh (no caching)
      const response = await api.get('/products/search', { params: { query } });
      // Ensure ratedBy is present for frontend logic
      if (response.data && Array.isArray(response.data.data)) {
        response.data.data.forEach(product => {
          if (!product.ratedBy && product.ratings) {
            product.ratedBy = [];
            product.ratings.forEach(r => {
              if (!product.ratedBy.some(u => u.toString() === r.user.toString())) {
                product.ratedBy.push(r.user);
              }
            });
          }
        });
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to search products with query "${query}":`, error);
      throw error;
    }
  },

  async addProduct(productData) {
    try {
      const response = await api.post('/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Invalidate the products cache since we've added a new product
      productCache.all.timestamp = 0;
      productCache.featured.timestamp = 0;
      
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/products/${productId}`);
      
      // Invalidate caches that might contain this product
      productCache.all.timestamp = 0;
      productCache.featured.timestamp = 0;
      if (productCache.products[productId]) {
        delete productCache.products[productId];
      }
      
      return response.data;
    } catch (error) {
      console.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  },

  async applyPromotion(productId, promotion) {
    try {
      const response = await api.put(`/products/${productId}/promotion`, promotion);
      
      // Invalidate the specific product cache and any list caches
      productCache.all.timestamp = 0;
      productCache.featured.timestamp = 0;
      if (productCache.products[productId]) {
        productCache.products[productId].timestamp = 0;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Failed to apply promotion to product ${productId}:`, error);
      throw error;
    }
  },

  // Coupon code APIs
  async createCouponCode(data) {
    try {
      const response = await api.post('/products/coupon-codes', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create coupon code:', error);
      throw error;
    }
  },

  async validateCouponCode({ code, userId, productId, category }) {
    try {
      const response = await api.post('/products/coupon-codes/validate', { code, userId, productId, category });
      return response.data;
    } catch (error) {
      console.error('Failed to validate coupon code:', error);
      throw error;
    }
  },

  async markCouponAsUsed(code, userId) {
    try {
      const response = await api.post('/products/coupon-codes/mark-used', { code, userId });
      return response.data;
    } catch (error) {
      console.error('Failed to mark coupon as used:', error);
      throw error;
    }
  },

  async getCouponCodes() {
    try {
      const response = await api.get('/products/coupon-codes');
      return response.data;
    } catch (error) {
      console.error('Failed to get coupon codes:', error);
      throw error;
    }
  },

  // Cache control methods
  clearCache() {
    productCache.all = { data: null, timestamp: 0 };
    productCache.featured = { data: null, timestamp: 0 };
    productCache.categories = { data: null, timestamp: 0 };
    productCache.products = {};
    //('Product cache cleared');
  },
  
  invalidateProductCache(productId) {
    if (productCache.products[productId]) {
      delete productCache.products[productId];
      //(`Cache for product ${productId} invalidated`);
    }
  }
};

export default productService;
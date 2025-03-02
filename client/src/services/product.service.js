// Fixed product.service.js with consistent error handling
import api from './api';

const productService = {
  async getProducts() {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  },

  async getFeaturedProducts() {
    try {
      const response = await api.get('/products/featured');
      return response.data;
    } catch (error) {
      console.error('Failed to get featured products:', error);
      throw error;
    }
  },

  async getProduct(productId) {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      throw error;
    }
  },

  async getCategories() {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  },

  async getProductReviews(productId) {
    try {
      const response = await api.get(`/products/${productId}/reviews`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get reviews for product ${productId}:`, error);
      throw error;
    }
  },

  async addProductReview(productId, reviewData) {
    try {
      const response = await api.post(`/products/${productId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      console.error(`Failed to add review for product ${productId}:`, error);
      throw error;
    }
  },

  async searchProducts(query) {
    try {
      const response = await api.get('/products/search', { params: { query } });
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
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  },

  async applyPromotion(productId, promotion) {
    try {
      const response = await api.put(`/products/${productId}/promotion`, promotion);
      return response.data;
    } catch (error) {
      console.error(`Failed to apply promotion to product ${productId}:`, error);
      throw error;
    }
  },
};

export default productService;
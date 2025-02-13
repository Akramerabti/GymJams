// services/product.service.js
import api from './api';

const productService = {
  async getProducts() {
    try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    throw error;
  }
  },

  async getFeaturedProducts() {
    const response = await api.get('/products/featured');
    return response.data;
  },

  async getProduct(productId) {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/products/categories');
    return response.data;
  },

  async getProductReviews(productId) {
    const response = await api.get(`/products/${productId}/reviews`);
    return response.data;
  },

  async addProductReview(productId, reviewData) {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
  },

  async searchProducts(query) {
    const response = await api.get('/products/search', { params: { query } });
    return response.data;
  },

  // Add a new product
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

  // Delete a product
  async deleteProduct(productId, token) {
    const response = await api.delete(`/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request headers
      },
    });
    return response.data;
  },

  // Apply a promotion to a product
  async applyPromotion(productId, promotion, token) {
    const response = await api.put(`/products/${productId}/promotion`, promotion, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the request headers
      },
    });
    return response.data;
  },
};

export default productService;
import api from './api';

const productService = {
  async getProducts(filters = {}) {
    const response = await api.get('/products', { params: filters });
    return response.data;
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
  }
};

export default productService;
import api from './api';

const inventoryService = {
  // Get inventory (products with stock information)
  async getInventory() {
    try {
      const response = await api.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      throw error;
    }
  },

  // Update stock quantity for a specific product
  async updateInventory(productId, updateData) {
    try {
      const response = await api.put(`/inventory/${productId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update inventory for product ${productId}:`, error);
      throw error;
    }
  },

  // Check if items are in stock before checkout
  async validateStock(items) {
    try {
      const response = await api.post('/inventory/validate', { items });
      return response.data;
    } catch (error) {
      console.error('Failed to validate stock:', error);
      throw error;
    }
  },

  // Get low stock alerts
  async getLowStockAlerts(threshold = 5) {
    try {
      const response = await api.get('/inventory/low-stock', { params: { threshold } });
      return response.data;
    } catch (error) {
      console.error('Failed to get low stock alerts:', error);
      throw error;
    }
  },

  // Get inventory history for a product
  async getInventoryHistory(productId) {
    try {
      const response = await api.get(`/inventory/${productId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get inventory history for product ${productId}:`, error);
      throw error;
    }
  }
};

export default inventoryService;
// client/src/services/thirdPartyLogistics.service.js
import api from './api';

const thirdPartyLogisticsService = {
  // Warehouse Management
  async getWarehouses() {
    try {
      const response = await api.get('/3pl/warehouses');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      throw error;
    }
  },

  async createWarehouse(warehouseData) {
    try {
      const response = await api.post('/3pl/warehouses', warehouseData);
      return response.data;
    } catch (error) {
      console.error('Failed to create warehouse:', error);
      throw error;
    }
  },

  async updateWarehouse(warehouseId, warehouseData) {
    try {
      const response = await api.put(`/3pl/warehouses/${warehouseId}`, warehouseData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update warehouse ${warehouseId}:`, error);
      throw error;
    }
  },

  // Inventory Sync
  async syncInventory(warehouseId) {
    try {
      const response = await api.post(`/3pl/warehouses/${warehouseId}/sync`);
      return response.data;
    } catch (error) {
      console.error(`Failed to sync inventory for warehouse ${warehouseId}:`, error);
      throw error;
    }
  },

  // Fulfillment Management
  async getFulfillmentOrders() {
    try {
      const response = await api.get('/orders?fulfillment=true');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch fulfillment orders:', error);
      throw error;
    }
  },

  async createFulfillmentOrder(orderId) {
    try {
      const response = await api.post(`/3pl/orders/${orderId}/fulfill`);
      return response.data;
    } catch (error) {
      console.error(`Failed to create fulfillment order for ${orderId}:`, error);
      throw error;
    }
  },

  async updateOrderTracking(orderId) {
    try {
      const response = await api.get(`/3pl/orders/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      console.error(`Failed to update tracking for order ${orderId}:`, error);
      throw error;
    }
  },

  // Shipping Rates
  async getShippingRates(items, destination, warehouseId = null) {
    try {
      const response = await api.post('/3pl/shipping/rates', {
        items,
        destination,
        warehouseId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get shipping rates:', error);
      throw error;
    }
  }
};

export default thirdPartyLogisticsService;
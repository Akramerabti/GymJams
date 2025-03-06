// services/inventory.service.js
import api from './api';
import Product from '../models/Product';
import { toast } from 'sonner';

const inventoryService = {
  /**
   * Validate stock availability for a list of items
   * @param {Array} items - Array of items with id and quantity
   * @returns {Promise<Object>} - Validation result
   */
  async validateStock(items) {
    try {
      // Make the API call to check stock
      const response = await api.post('/inventory/validate', { items });
      return response.data;
    } catch (error) {
      console.error('Stock validation error:', error);
      
      // If the server is unreachable, perform client-side validation as fallback
      if (error.code === 'ERR_NETWORK') {
        return this.fallbackValidateStock(items);
      }
      
      throw error;
    }
  },
  
  /**
   * Fallback client-side stock validation when server is unreachable
   * @param {Array} items - Array of items with id and quantity
   * @returns {Promise<Object>} - Validation result
   */
  async fallbackValidateStock(items) {
    try {
      const outOfStockItems = [];
      let isValid = true;
      
      // Process each item
      for (const item of items) {
        try {
          // Fetch latest product data
          const response = await api.get(`/products/${item.id}`);
          const product = response.data;
          
          if (!product) {
            outOfStockItems.push({
              id: item.id,
              requested: item.quantity,
              available: 0,
              name: 'Unknown Product'
            });
            isValid = false;
            continue;
          }
          
          // Check if sufficient stock is available
          if (product.stockQuantity < item.quantity) {
            outOfStockItems.push({
              id: item.id,
              requested: item.quantity,
              available: product.stockQuantity,
              name: product.name
            });
            isValid = false;
          }
        } catch (error) {
          console.error(`Error checking stock for product ${item.id}:`, error);
          outOfStockItems.push({
            id: item.id,
            requested: item.quantity,
            available: 0,
            name: 'Error fetching product'
          });
          isValid = false;
        }
      }
      
      return {
        valid: isValid,
        outOfStockItems: outOfStockItems
      };
    } catch (error) {
      console.error('Fallback stock validation error:', error);
      throw error;
    }
  },
  
  /**
   * Reserve inventory for a product during checkout
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to reserve
   * @returns {Promise<Boolean>} - Success status
   */
  async reserveInventory(productId, quantity) {
    try {
      const response = await api.post('/inventory/reserve', {
        productId,
        quantity
      });
      return response.data.success;
    } catch (error) {
      console.error('Error reserving inventory:', error);
      return false;
    }
  },
  
  /**
   * Release reserved inventory for a product
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to release
   * @returns {Promise<Boolean>} - Success status
   */
  async releaseInventory(productId, quantity) {
    try {
      const response = await api.post('/inventory/release', {
        productId,
        quantity
      });
      return response.data.success;
    } catch (error) {
      console.error('Error releasing inventory:', error);
      return false;
    }
  }
};

export default inventoryService;
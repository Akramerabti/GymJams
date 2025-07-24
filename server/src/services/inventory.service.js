import mongoose from 'mongoose';
import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import logger from '../utils/logger.js';
import { withTransaction, updateWithVersioning } from '../utils/transactionHelper.js';

/**
 * Service for handling inventory operations with concurrency control
 */
class InventoryService {
  /**
   * Update product stock quantity with transaction and optimistic concurrency control
   * 
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity change (positive for addition, negative for reduction)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated product and transaction status
   */
  async updateStock(productId, quantity, options = {}) {
    const {
      reason = 'Manual adjustment',
      userId = null,
      orderId = null,
      notes = ''
    } = options;
    
    return withTransaction(async (session) => {
      // Find the product with locking
      const product = await Product.findById(productId).session(session);
      
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      
      // Calculate new quantity and validate
      const previousQuantity = product.stockQuantity;
      const newQuantity = previousQuantity + quantity;
      
      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for product ${productId}. Available: ${previousQuantity}, Requested reduction: ${Math.abs(quantity)}`);
      }
      
      // Update the product stock with atomic operation
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, stockQuantity: previousQuantity },
        { $set: { stockQuantity: newQuantity } },
        { new: true, session }
      );
      
      if (!updatedProduct) {
        throw new Error(`Concurrent modification detected for product ${productId}`);
      }
      
      // Create inventory transaction record
      const transaction = new InventoryTransaction({
        product: productId,
        transactionType: quantity >= 0 ? 'addition' : 'reduction',
        quantity: Math.abs(quantity),
        previousQuantity,
        newQuantity,
        reason,
        user: userId || 'system',
        orderId,
        notes
      });
      
      await transaction.save({ session });
      
      logger.info(`Inventory updated for product ${productId}: ${previousQuantity} -> ${newQuantity} (${quantity >= 0 ? '+' : '-'}${Math.abs(quantity)})`);
      
      return {
        product: updatedProduct,
        transaction
      };
    }, {
      logPrefix: 'Inventory',
      maxRetries: 5
    });
  }
  
  /**
   * Reserve inventory for a pending order
   * 
   * @param {Array} items - Array of items with product IDs and quantities
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async reserveInventory(items, options = {}) {
    const {
      orderId = null,
      userId = null,
      timeout = 30 // Time in minutes for the reservation to expire
    } = options;
    
    return withTransaction(async (session) => {
      // Check and update each product's inventory
      for (const item of items) {
        if (!item.productId || !item.quantity) {
          throw new Error('Invalid item: productId and quantity are required');
        }
        
        const product = await Product.findById(item.productId).session(session);
        
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
        }
        
        // Temporarily reduce the available stock
        const previousQuantity = product.stockQuantity;
        const newQuantity = previousQuantity - item.quantity;
        
        // Use findOneAndUpdate with optimistic concurrency control
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stockQuantity: previousQuantity },
          { $set: { stockQuantity: newQuantity } },
          { new: true, session }
        );
        
        if (!updatedProduct) {
          throw new Error(`Concurrent modification detected for product ${item.productId}`);
        }
        
        // Create reservation record
        const transaction = new InventoryTransaction({
          product: item.productId,
          transactionType: 'reduction',
          quantity: item.quantity,
          previousQuantity,
          newQuantity,
          reason: `Reservation for order ${orderId || 'pending'}`,
          user: userId || 'guest',
          orderId,
          notes: `Reservation expires in ${timeout} minutes`,
          expiresAt: new Date(Date.now() + timeout * 60 * 1000)
        });
        
        await transaction.save({ session });
        
        logger.info(`Inventory reserved for product ${item.productId}: ${previousQuantity} -> ${newQuantity} (-${item.quantity})`);
      }
      
      return true;
    }, {
      logPrefix: 'InventoryReservation',
      maxRetries: 3
    });
  }
  
  /**
   * Release reserved inventory if an order is not completed
   * 
   * @param {string} orderId - Order ID
   * @returns {Promise<boolean>} Success status
   */
  async releaseReservation(orderId) {
    return withTransaction(async (session) => {
      // Find all reservation transactions for this order
      const reservations = await InventoryTransaction.find({
        orderId,
        reason: { $regex: /^Reservation for order/ }
      }).session(session);
      
      if (reservations.length === 0) {
        logger.warn(`No reservations found for order ${orderId}`);
        return false;
      }
      
      // Release each reservation
      for (const reservation of reservations) {
        const productId = reservation.product;
        const quantity = reservation.quantity;
        
        // Get current product state
        const product = await Product.findById(productId).session(session);
        
        if (!product) {
          logger.warn(`Product not found for reservation: ${productId}`);
          continue;
        }
        
        // Update the stock
        const previousQuantity = product.stockQuantity;
        const newQuantity = previousQuantity + quantity;
        
        // Use optimistic concurrency control
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: productId, stockQuantity: previousQuantity },
          { $set: { stockQuantity: newQuantity } },
          { new: true, session }
        );
        
        if (!updatedProduct) {
          throw new Error(`Concurrent modification detected for product ${productId}`);
        }
        
        // Create release transaction
        const transaction = new InventoryTransaction({
          product: productId,
          transactionType: 'addition',
          quantity: quantity,
          previousQuantity,
          newQuantity,
          reason: `Released reservation for order ${orderId}`,
          user: 'system',
          orderId,
          notes: 'Inventory released due to incomplete order'
        });
        
        await transaction.save({ session });
        
        // Mark the original reservation as released
        reservation.notes += ' [RELEASED]';
        await reservation.save({ session });
        
        logger.info(`Reservation released for product ${productId}: ${previousQuantity} -> ${newQuantity} (+${quantity})`);
      }
      
      return true;
    }, {
      logPrefix: 'ReleaseReservation',
      maxRetries: 3
    });
  }
  
   /**
   * Validate stock availability for multiple items
   * 
   * @param {Array} items - Array of items with product IDs and quantities
   * @returns {Promise<Object>} Validation result
   */
   async validateStock(items) {
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          if (!item.id) {
            return {
              id: item.id || 'unknown',
              inStock: false,
              message: 'Invalid product ID',
              requested: item.quantity || 0,
              available: 0
            };
          }
          
          const product = await Product.findById(item.id);
          
          if (!product) {
            return {
              id: item.id,
              inStock: false,
              message: 'Product not found',
              requested: item.quantity,
              available: 0
            };
          }
          
          return {
            id: item.id,
            name: product.name,
            inStock: product.stockQuantity >= item.quantity,
            requested: item.quantity,
            available: product.stockQuantity
          };
        })
      );

      const allInStock = results.every(item => item.inStock);
      const outOfStockItems = results.filter(item => !item.inStock);

      return {
        valid: allInStock,
        items: results,
        outOfStockItems: outOfStockItems.length > 0 ? outOfStockItems : []
      };
    } catch (error) {
      logger.error('Error validating stock:', error);
      throw error;
    }
  }
  
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
  }
  
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
  }
  
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
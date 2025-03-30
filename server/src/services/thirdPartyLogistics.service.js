// server/src/services/thirdPartyLogistics.service.js
import axios from 'axios';
import logger from '../utils/logger.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ShippingMethod from '../models/ShippingMethod.js';

class ThirdPartyLogisticsService {
  constructor() {
    this.providers = {
      shipbob: {
        baseUrl: 'https://api.shipbob.com/v1',
        headers: {},
        getInventory: this.getShipBobInventory,
        createOrder: this.createShipBobOrder,
        getTrackingInfo: this.getShipBobTracking,
      },
      shipmonk: {
        baseUrl: 'https://app.shipmonk.com/api/v1',
        headers: {},
        getInventory: this.getShipMonkInventory,
        createOrder: this.createShipMonkOrder,
        getTrackingInfo: this.getShipMonkTracking,
      }
      // Add other providers as needed
    };
  }

  // Get API client for a specific warehouse
  async getClientForWarehouse(warehouseId) {
    try {
      const warehouse = await Warehouse.findById(warehouseId);
      
      if (!warehouse || !warehouse.isActive) {
        throw new Error(`Warehouse ${warehouseId} not found or inactive`);
      }
      
      const provider = this.providers[warehouse.provider];
      
      if (!provider) {
        throw new Error(`Provider ${warehouse.provider} not supported`);
      }
      
      // Create headers based on warehouse credentials
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${warehouse.apiCredentials.accessToken}`
      };
      
      return {
        warehouse,
        baseUrl: provider.baseUrl,
        headers,
        provider: warehouse.provider
      };
    } catch (error) {
      logger.error('Error getting 3PL client:', error);
      throw error;
    }
  }

  // Sync inventory with 3PL warehouse
  async syncInventory(warehouseId) {
    try {
      const client = await this.getClientForWarehouse(warehouseId);
      const provider = this.providers[client.provider];
      
      const inventory = await provider.getInventory(client);
      
      // Update product inventory levels
      for (const item of inventory) {
        await Product.findOneAndUpdate(
          { 'thirdPartyData.sku3PL': item.sku },
          { 
            $set: { 
              'thirdPartyData.warehouses.$[elem].stockQuantity': item.quantity,
              'thirdPartyData.warehouses.$[elem].lastSyncDate': new Date()
            }
          },
          { 
            arrayFilters: [{ 'elem.warehouse': warehouseId }],
            new: true
          }
        );
      }
      
      logger.info(`Inventory synced successfully for warehouse ${warehouseId}`);
      return inventory;
    } catch (error) {
      logger.error(`Error syncing inventory for warehouse ${warehouseId}:`, error);
      throw error;
    }
  }

  // Create fulfillment order in 3PL
  async createFulfillmentOrder(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('items.product')
        .populate('fulfillment.warehouse');
      
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }
      
      // Determine warehouse if not specified
      if (!order.fulfillment.warehouse) {
        // Assign to default warehouse
        const defaultWarehouse = await Warehouse.findOne({ 
          'settings.defaultForNewProducts': true, 
          isActive: true 
        });
        
        if (!defaultWarehouse) {
          throw new Error('No default warehouse found for fulfillment');
        }
        
        order.fulfillment.warehouse = defaultWarehouse._id;
        await order.save();
      }
      
      const client = await this.getClientForWarehouse(order.fulfillment.warehouse);
      const provider = this.providers[client.provider];
      
      // Format order for 3PL provider
      const fulfillmentOrder = this.formatOrderFor3PL(order, client.provider);
      
      // Submit to 3PL
      const response = await provider.createOrder(fulfillmentOrder, client);
      
      // Update order with 3PL reference ID
      order.fulfillment.thirdPartyId = response.id;
      order.fulfillment.status = 'processing';
      await order.save();
      
      return response;
    } catch (error) {
      logger.error(`Error creating fulfillment order for ${orderId}:`, error);
      throw error;
    }
  }

  // Get shipping rates from 3PL
  async getShippingRates(items, destination, warehouseId = null) {
    try {
      // If no warehouse specified, use default
      if (!warehouseId) {
        const defaultWarehouse = await Warehouse.findOne({ 
          'settings.defaultForNewProducts': true, 
          isActive: true 
        });
        
        if (!defaultWarehouse) {
          throw new Error('No default warehouse found');
        }
        
        warehouseId = defaultWarehouse._id;
      }
      
      const client = await this.getClientForWarehouse(warehouseId);
      
      // Format items for rate request
      const packageItems = await this.formatItemsForRateRequest(items);
      
      // Make rate request to provider
      const response = await axios.post(
        `${client.baseUrl}/rates`, 
        {
          origin: {
            warehouse_id: client.warehouse.apiCredentials.warehouseId
          },
          destination: {
            address1: destination.address,
            city: destination.city,
            state: destination.state,
            zip: destination.zipCode,
            country: destination.country
          },
          packages: packageItems
        },
        { headers: client.headers }
      );
      
      // Format and return rates
      return this.formatShippingRates(response.data.rates);
    } catch (error) {
      logger.error('Error getting shipping rates:', error);
      throw error;
    }
  }

  // Update order tracking information
  async updateOrderTracking(orderId) {
    try {
      const order = await Order.findById(orderId);
      
      if (!order || !order.fulfillment.warehouse || !order.fulfillment.thirdPartyId) {
        throw new Error(`Order ${orderId} not found or missing 3PL information`);
      }
      
      const client = await this.getClientForWarehouse(order.fulfillment.warehouse);
      const provider = this.providers[client.provider];
      
      const tracking = await provider.getTrackingInfo(order.fulfillment.thirdPartyId, client);
      
      // Update order tracking
      order.fulfillment.tracking = tracking;
      
      // Update fulfillment status based on tracking
      if (tracking.events && tracking.events.length > 0) {
        const latestEvent = tracking.events[0];
        
        // Determine status from tracking event
        if (latestEvent.status.includes('deliver')) {
          order.fulfillment.status = 'delivered';
        } else if (latestEvent.status.includes('ship')) {
          order.fulfillment.status = 'shipped';
          if (!order.fulfillment.shippedAt) {
            order.fulfillment.shippedAt = latestEvent.timestamp;
          }
        }
      }
      
      await order.save();
      return tracking;
    } catch (error) {
      logger.error(`Error updating tracking for order ${orderId}:`, error);
      throw error;
    }
  }

  // Helper methods for different providers
  async getShipBobInventory(client) {
    try {
      const response = await axios.get(
        `${client.baseUrl}/inventory`,
        { headers: client.headers }
      );
      
      return response.data.records.map(item => ({
        sku: item.reference_id,
        quantity: item.on_hand,
        reserved: item.allocated,
        available: item.available,
        warehouseId: item.fulfillment_center_id
      }));
    } catch (error) {
      logger.error('ShipBob inventory error:', error);
      throw error;
    }
  }

  async createShipBobOrder(order, client) {
    try {
      const response = await axios.post(
        `${client.baseUrl}/orders`,
        order,
        { headers: client.headers }
      );
      
      return {
        id: response.data.id,
        status: response.data.status,
        createdAt: response.data.created_date
      };
    } catch (error) {
      logger.error('ShipBob order creation error:', error);
      throw error;
    }
  }

  async getShipBobTracking(orderId, client) {
    try {
      const response = await axios.get(
        `${client.baseUrl}/orders/${orderId}/tracking`,
        { headers: client.headers }
      );
      
      return {
        number: response.data.tracking_number,
        url: response.data.tracking_url,
        carrier: response.data.carrier,
        events: response.data.tracking_events.map(event => ({
          status: event.status,
          location: event.location,
          timestamp: new Date(event.timestamp),
          description: event.description
        })),
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('ShipBob tracking error:', error);
      throw error;
    }
  }

  // Format order for specific 3PL providers
  formatOrderFor3PL(order, provider) {
    switch (provider) {
      case 'shipbob':
        return {
          reference_id: order._id.toString(),
          shipping_method: order.shippingMethod,
          recipient: {
            name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            address1: order.shippingAddress.address,
            address2: order.shippingAddress.apartment || '',
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.zipCode,
            country: order.shippingAddress.country,
            phone: order.shippingAddress.phone,
            email: order.shippingAddress.email
          },
          items: order.items.map(item => ({
            reference_id: item.product.thirdPartyData?.sku3PL || item.product._id.toString(),
            name: item.product.name,
            quantity: item.quantity
          }))
        };
      case 'shipmonk':
        // ShipMonk format...
        return {};
      default:
        throw new Error(`Provider ${provider} not supported for order formatting`);
    }
  }

  // Format items for shipping rate requests
  async formatItemsForRateRequest(items) {
    // Fetch full product details for items
    const productIds = items.map(item => item.id);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Map to products with quantities
    const itemsWithDetails = items.map(item => {
      const product = products.find(p => p._id.toString() === item.id);
      return {
        product,
        quantity: item.quantity
      };
    });
    
    // Calculate package dimensions and weight
    return [{
      weight: itemsWithDetails.reduce((total, item) => {
        const weight = item.product.thirdPartyData?.dimensions?.weight || 0;
        return total + (weight * item.quantity);
      }, 0),
      dimensions: {
        length: Math.max(...itemsWithDetails.map(item => item.product.thirdPartyData?.dimensions?.length || 0)),
        width: Math.max(...itemsWithDetails.map(item => item.product.thirdPartyData?.dimensions?.width || 0)),
        height: itemsWithDetails.reduce((total, item) => {
          const height = item.product.thirdPartyData?.dimensions?.height || 0;
          return total + (height * item.quantity);
        }, 0)
      }
    }];
  }

  // Format shipping rates into standardized structure
  formatShippingRates(rates) {
    return rates.map(rate => ({
      id: rate.id,
      name: rate.service_level,
      carrier: rate.carrier,
      price: rate.total_charge,
      currency: rate.currency || 'USD',
      estimatedDeliveryDays: {
        min: rate.estimated_delivery_days,
        max: rate.estimated_delivery_days + 2 // Add buffer
      }
    }));
  }
}

export default new ThirdPartyLogisticsService();
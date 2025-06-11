// server/src/controllers/thirdPartyLogistics.controller.js
import ThirdPartyLogisticsService from '../services/thirdPartyLogistics.service.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

// Get all warehouses
export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({});
    res.status(200).json({ warehouses });
  } catch (error) {
    logger.error('Error fetching warehouses:', error);
    res.status(500).json({ message: 'Error fetching warehouses' });
  }
};

// Create warehouse
export const createWarehouse = async (req, res) => {
  try {
    const newWarehouse = new Warehouse(req.body);
    await newWarehouse.save();
    res.status(201).json({ warehouse: newWarehouse });
  } catch (error) {
    logger.error('Error creating warehouse:', error);
    res.status(500).json({ message: 'Error creating warehouse' });
  }
};

// Update warehouse
export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedWarehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.status(200).json({ warehouse: updatedWarehouse });
  } catch (error) {
    logger.error(`Error updating warehouse ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating warehouse' });
  }
};

// Sync inventory with warehouse
export const syncInventory = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const inventory = await ThirdPartyLogisticsService.syncInventory(warehouseId);
    res.status(200).json({ inventory });
  } catch (error) {
    logger.error(`Error syncing inventory for warehouse ${req.params.warehouseId}:`, error);
    res.status(500).json({ message: 'Error syncing inventory' });
  }
};

// Create fulfillment order
export const createFulfillmentOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const fulfillmentOrder = await ThirdPartyLogisticsService.createFulfillmentOrder(orderId);
    res.status(200).json({ fulfillmentOrder });
  } catch (error) {
    logger.error(`Error creating fulfillment order for ${req.params.orderId}:`, error);
    res.status(500).json({ message: 'Error creating fulfillment order' });
  }
};

// Get shipping rates
export const getShippingRates = async (req, res) => {
  try {
    const { items, destination, warehouseId } = req.body;
    const rates = await ThirdPartyLogisticsService.getShippingRates(items, destination, warehouseId);
    res.status(200).json({ rates });
  } catch (error) {
    logger.error('Error getting shipping rates:', error);
    res.status(500).json({ message: 'Error getting shipping rates' });
  }
};

// Update order tracking
export const updateOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const tracking = await ThirdPartyLogisticsService.updateOrderTracking(orderId);
    res.status(200).json({ tracking });
  } catch (error) {
    logger.error(`Error updating tracking for order ${req.params.orderId}:`, error);
    res.status(500).json({ message: 'Error updating order tracking' });
  }
};

// Handle 3PL webhook
export const handle3PLWebhook = async (req, res) => {
  try {
    const { provider } = req.params;
    const eventData = req.body;
    
    logger.info(`Received ${provider} webhook: ${JSON.stringify(eventData)}`);
    
    // Process webhook based on event type
    switch (eventData.event_type) {
      case 'inventory_update':
        // Handle inventory update
        break;
      case 'order_shipped':
        // Update order status
        if (eventData.order_id) {
          const order = await Order.findOne({ 'fulfillment.thirdPartyId': eventData.order_id });
          if (order) {
            order.fulfillment.status = 'shipped';
            order.fulfillment.shippedAt = new Date();
            order.fulfillment.tracking = {
              number: eventData.tracking_number,
              url: eventData.tracking_url,
              carrier: eventData.carrier,
              lastUpdated: new Date()
            };
            await order.save();
          }
        }
        break;
      case 'order_delivered':
        // Update order status
        if (eventData.order_id) {
          const order = await Order.findOne({ 'fulfillment.thirdPartyId': eventData.order_id });
          if (order) {
            order.fulfillment.status = 'delivered';
            await order.save();
          }
        }
        break;
      default:
        logger.info(`Unhandled webhook event type: ${eventData.event_type}`);
    }
    
    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
};
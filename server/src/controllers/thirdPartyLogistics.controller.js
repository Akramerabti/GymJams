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

// server/src/controllers/thirdPartyLogistics.controller.js
export const getShippingRates = async (req, res) => {
  try {
    const { items, destination } = req.body;
    
    // Calculate subtotal for free shipping threshold
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate total weight (approximate)
    const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 1), 0); // 1 lb average per item
    
    // Define shipping rates based on location and weight
    const baseStandardRate = getBaseShippingRate(destination, totalWeight);
    const baseExpressRate = baseStandardRate * 2.5; // Express is 2.5x standard
    
    // Apply free shipping for orders over $100
    const standardRate = subtotal >= 100 ? 0 : baseStandardRate;
    
    const rates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: standardRate,
        estimatedDeliveryDays: { min: 3, max: 7 },
        carrier: 'USPS/UPS'
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: baseExpressRate,
        estimatedDeliveryDays: { min: 1, max: 3 },
        carrier: 'UPS/FedEx'
      }
    ];
    
    // If subtotal qualifies for free shipping, add overnight option
    if (subtotal >= 200) {
      rates.push({
        id: 'overnight',
        name: 'Overnight Shipping',
        price: baseExpressRate * 1.5,
        estimatedDeliveryDays: { min: 1, max: 1 },
        carrier: 'FedEx'
      });
    }
    
    res.status(200).json({ rates });
  } catch (error) {
    logger.error('Error calculating shipping rates:', error);
    
    // NEVER return error to user - always provide fallback rates
    const fallbackRates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: 12.99,
        estimatedDeliveryDays: { min: 3, max: 7 },
        carrier: 'USPS'
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: 24.99,
        estimatedDeliveryDays: { min: 1, max: 3 },
        carrier: 'UPS'
      }
    ];
    
    res.status(200).json({ rates: fallbackRates });
  }
};

// Helper function to calculate base shipping rate
function getBaseShippingRate(destination, weight) {
  const { state, country, zipCode } = destination;
  
  // Base rate calculation
  let baseRate = 8.99; // Starting rate
  
  // Weight adjustments
  if (weight > 5) baseRate += Math.ceil((weight - 5) / 5) * 3; // $3 per additional 5 lbs
  
  // Location adjustments
  if (country !== 'United States') {
    baseRate += 15; // International surcharge
  } else {
    // US state-based rates
    const coastalStates = ['CA', 'WA', 'OR', 'NY', 'NJ', 'CT', 'MA', 'ME', 'NH', 'VT', 'RI'];
    const centralStates = ['TX', 'OK', 'KS', 'NE', 'CO', 'WY', 'MT', 'ND', 'SD'];
    
    if (coastalStates.includes(state)) {
      baseRate += 2; // Coastal surcharge
    } else if (centralStates.includes(state)) {
      baseRate += 0; // No adjustment for central states
    } else {
      baseRate += 1; // Small surcharge for other states
    }
    
    // Remote zip code surcharge
    if (zipCode && (zipCode.startsWith('99') || zipCode.startsWith('96'))) {
      baseRate += 5; // Alaska/Hawaii surcharge
    }
  }
  
  return Math.round(baseRate * 100) / 100; // Round to 2 decimal places
}

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
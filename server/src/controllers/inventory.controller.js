import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Get all inventory (products with stock information)
export const getInventory = async (req, res) => {
  try {
    const products = await Product.find({}).select('name description category price stockQuantity imageUrls');
    
    res.status(200).json({ 
      success: true, 
      data: products,
      count: products.length 
    });
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inventory',
      error: error.message 
    });
  }
};

// Update stock quantity for a specific product
export const updateInventory = async (req, res) => {
  const { productId } = req.params;
  const { stockQuantity, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  if (stockQuantity === undefined || stockQuantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Stock quantity must be provided and cannot be negative'
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find product
    const product = await Product.findById(productId).session(session);
    
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate the change in quantity
    const previousQuantity = product.stockQuantity;
    const quantityChange = stockQuantity - previousQuantity;

    // Update the product's stock quantity
    product.stockQuantity = stockQuantity;
    await product.save({ session });

    // Create inventory transaction record
    await InventoryTransaction.create([{
      product: productId,
      transactionType: quantityChange >= 0 ? 'addition' : 'reduction',
      quantity: Math.abs(quantityChange),
      previousQuantity,
      newQuantity: stockQuantity,
      reason: reason || 'Manual adjustment',
      user: req.user.id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        productId,
        stockQuantity,
        previousQuantity,
        change: quantityChange
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error updating inventory for product ${productId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
};

// Validate if items are in stock before checkout
export const validateStock = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Items must be provided as a non-empty array'
    });
  }

  try {
    const results = await Promise.all(
      items.map(async (item) => {
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

    res.status(200).json({
      success: true,
      valid: allInStock,
      items: results,
      outOfStockItems: outOfStockItems.length > 0 ? outOfStockItems : []
    });
  } catch (error) {
    logger.error('Error validating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate stock',
      error: error.message
    });
  }
};

// Process inventory changes after successful order
export const processOrderInventory = async (order, session) => {
  try {
    const orderItems = order.items;
    
    for (const item of orderItems) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        logger.error(`Product not found for order item: ${item.product}`);
        continue;
      }
      
      // Calculate new quantity
      const previousQuantity = product.stockQuantity;
      const newQuantity = Math.max(0, previousQuantity - item.quantity);
      
      // Update product stock
      product.stockQuantity = newQuantity;
      await product.save({ session });
      
      // Create inventory transaction
      await InventoryTransaction.create([{
        product: item.product,
        transactionType: 'reduction',
        quantity: item.quantity,
        previousQuantity,
        newQuantity,
        reason: `Order #${order._id}`,
        user: order.user
      }], { session });
      
      logger.info(`Updated inventory for product ${item.product}: ${previousQuantity} -> ${newQuantity}`);
    }
    
    return true;
  } catch (error) {
    logger.error('Error processing order inventory:', error);
    throw error;
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    
    const lowStockProducts = await Product.find({
      stockQuantity: { $lte: threshold, $gt: 0 }
    }).select('name category stockQuantity price');
    
    const outOfStockProducts = await Product.find({
      stockQuantity: 0
    }).select('name category stockQuantity price');
    
    res.status(200).json({
      success: true,
      lowStock: {
        count: lowStockProducts.length,
        products: lowStockProducts
      },
      outOfStock: {
        count: outOfStockProducts.length,
        products: outOfStockProducts
      }
    });
  } catch (error) {
    logger.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock alerts',
      error: error.message
    });
  }
};

// Get inventory history for a product
export const getInventoryHistory = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  try {
    const history = await InventoryTransaction.find({ product: productId })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error(`Error fetching inventory history for product ${productId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory history',
      error: error.message
    });
  }
};

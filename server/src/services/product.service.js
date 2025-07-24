import Product from '../models/Product';
import logger from '../utils/logger';

class ProductService {
  async getProducts(filters = {}, pagination = {}) {
    try {
      const { 
        category, 
        priceRange, 
        search, 
        sortBy = 'createdAt',
        order = 'desc' 
      } = filters;
      
      const { page = 1, limit = 12 } = pagination;

      // Build query
      const query = {};
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        query.price = { $gte: min, $lte: max };
      }

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        products,
        pagination: {
          page: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  async getFeaturedProducts() {
    try {
      return await Product.find({ featured: true }).limit(8);
    } catch (error) {
      logger.error('Error fetching featured products:', error);
      throw error;
    }
  }

  async createProduct(productData, imageUrl) {
    try {
      const product = await Product.create({
        ...productData,
        imageUrl
      });
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async updateStock(productId, quantity) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stockQuantity: -quantity } },
        { new: true }
      );
      
      if (product.stockQuantity < 0) {
        throw new Error('Insufficient stock');
      }
      
      return product;
    } catch (error) {
      logger.error('Error updating stock:', error);
      throw error;
    }
  }
}

export default new ProductService();
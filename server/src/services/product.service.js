import Product from '../models/Product.js';
import logger from '../utils/logger.js';

class ProductService {
  async getProducts(filters = {}, pagination = {}) {
    try {
      const { 
        category, 
        priceRange, 
        search, 
        colors,
        gender,
        sortBy = 'createdAt',
        order = 'desc' 
      } = filters;
      
      const { page = 1, limit = 12 } = pagination;

      // Build query
      const query = {};
      if (category) query.category = category;
      
      // Add color filter
      if (colors && colors.length > 0) {
        query.colors = { $in: colors };
      }
      
      // Add gender filter (only for Clothes category)
      if (gender && category === 'Clothes') {
        query.gender = gender;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        query.price = { $gte: Number(min), $lte: Number(max) };
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

  async getProductById(id) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      logger.error('Error fetching product by ID:', error);
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

  async getProductsByGender(gender, category = 'Clothes') {
    try {
      return await Product.find({ 
        category, 
        gender 
      }).limit(12);
    } catch (error) {
      logger.error('Error fetching products by gender:', error);
      throw error;
    }
  }

  async getProductsByColor(color) {
    try {
      return await Product.find({ 
        colors: color 
      }).limit(12);
    } catch (error) {
      logger.error('Error fetching products by color:', error);
      throw error;
    }
  }

  async createProduct(productData, images) {
    try {
      // Process image uploads with color associations
      const { imageColorAssociations = [], colors = [], gender, ...otherData } = productData;
      
      // Parse JSON fields if they're strings
      if (typeof productData.specs === 'string') {
        productData.specs = JSON.parse(productData.specs);
      }
      if (typeof productData.discount === 'string') {
        productData.discount = JSON.parse(productData.discount);
      }
      if (typeof colors === 'string') {
        productData.colors = JSON.parse(colors);
      }
      
      // Create image URLs with color associations
      const imageUrls = images.map((imageUrl, index) => {
        const association = imageColorAssociations.find(a => a.index === index);
        return {
          url: imageUrl,
          color: association?.color || null
        };
      });

      const product = await Product.create({
        ...otherData,
        ...productData,
        imageUrls,
        colors: productData.colors || [],
        gender: productData.category === 'Clothes' ? gender : null
      });
      
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

async updateProduct(id, updateData, newImages = []) {
  try {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    console.log('[updateProduct] Raw updateData.ratedBy:', updateData.ratedBy);

    // Parse JSON strings first
    if (typeof updateData.specs === 'string') {
      updateData.specs = JSON.parse(updateData.specs);
    }
    if (typeof updateData.discount === 'string') {
      updateData.discount = JSON.parse(updateData.discount);
    }
    if (typeof updateData.colors === 'string') {
      updateData.colors = JSON.parse(updateData.colors);
    }
    if (typeof updateData.ratings === 'string') {
      updateData.ratings = JSON.parse(updateData.ratings);
    }

    // Parse boolean fields that come as strings from form data
    if (typeof updateData.featured === 'string') {
      updateData.featured = updateData.featured === 'true';
    }
    if (typeof updateData.preOrder === 'string') {
      updateData.preOrder = updateData.preOrder === 'true';
    }

    // Handle ratedBy field - this is the critical fix
    if (updateData.ratedBy !== undefined) {
      let cleanRatedBy = [];
      
      if (typeof updateData.ratedBy === 'string') {
        // Clean the string and split by comma
        const cleanString = updateData.ratedBy.trim();
        
        if (cleanString) {
          cleanRatedBy = cleanString
            .split(',')
            .map(id => id.trim())
            .filter(id => id && id.length === 24); // Only keep valid ObjectId length
        }
      } else if (Array.isArray(updateData.ratedBy)) {
        // Handle array case - flatten if needed
        cleanRatedBy = updateData.ratedBy
          .flat() // Flatten in case of nested arrays
          .map(id => {
            if (typeof id === 'string') {
              return id.trim();
            }
            return id;
          })
          .filter(id => id && typeof id === 'string' && id.length === 24);
      }
      
      updateData.ratedBy = cleanRatedBy;
      console.log('[updateProduct] Cleaned ratedBy:', updateData.ratedBy);
    }

    // Handle color and gender updates
    if (updateData.category !== 'Clothes') {
      updateData.gender = null;
    }

    // Merge existing and new images if applicable
    if (newImages.length > 0) {
      const { imageColorAssociations = [] } = updateData;
      const newImageUrls = newImages.map((imageUrl, index) => {
        const association = imageColorAssociations.find(a => a.index === index);
        return {
          url: imageUrl,
          color: association?.color || null
        };
      });
      
      updateData.imageUrls = [...(updateData.existingImages || []), ...newImageUrls];
    }

    // Remove fields that shouldn't be updated directly
    const fieldsToRemove = ['_id', 'id', '__v', 'createdAt', 'updatedAt', 'imageColorAssociations', 'existingImages', 'thirdPartyData'];
    fieldsToRemove.forEach(field => {
      if (updateData[field]) {
        delete updateData[field];
      }
    });

    console.log('[updateProduct] Final update payload ratedBy:', updateData.ratedBy);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return updatedProduct;
  } catch (error) {
    logger.error('Error updating product:', error);
    throw error;
  }
}

  async deleteProduct(id) {
    try {
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return { message: 'Product deleted successfully' };
    } catch (error) {
      logger.error('Error deleting product:', error);
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
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      if (product.stockQuantity < 0) {
        // Rollback the stock change
        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stockQuantity: quantity } }
        );
        throw new Error('Insufficient stock');
      }
      
      return product;
    } catch (error) {
      logger.error('Error updating stock:', error);
      throw error;
    }
  }

  async bulkUpdateStock(updates) {
    try {
      const bulkOps = updates.map(({ productId, quantity }) => ({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { stockQuantity: -quantity } }
        }
      }));
      
      const result = await Product.bulkWrite(bulkOps);
      return result;
    } catch (error) {
      logger.error('Error bulk updating stock:', error);
      throw error;
    }
  }

  async addReview(productId, userId, rating, review = '') {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if user already reviewed
      const existingReviewIndex = product.ratings.findIndex(
        r => r.user && r.user.toString() === userId.toString()
      );

      if (existingReviewIndex !== -1) {
        // Update existing review
        product.ratings[existingReviewIndex] = {
          user: userId,
          rating,
          review,
          date: new Date()
        };
      } else {
        // Add new review
        product.ratings.push({
          user: userId,
          rating,
          review,
          date: new Date()
        });
      }

      // Recalculate average rating
      const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = Math.round((totalRating / product.ratings.length) * 10) / 10;

      // Update ratedBy array
      if (!product.ratedBy.some(u => u.toString() === userId.toString())) {
        product.ratedBy.push(userId);
      }

      await product.save();
      return product;
    } catch (error) {
      logger.error('Error adding review:', error);
      throw error;
    }
  }

  async getRelatedProducts(productId, limit = 4) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Find related products by category, colors, or similar price range
      const relatedProducts = await Product.find({
        _id: { $ne: productId },
        $or: [
          { category: product.category },
          { colors: { $in: product.colors } },
          { 
            price: { 
              $gte: product.price * 0.7, 
              $lte: product.price * 1.3 
            } 
          }
        ]
      })
      .limit(limit)
      .sort('-averageRating');

      return relatedProducts;
    } catch (error) {
      logger.error('Error fetching related products:', error);
      throw error;
    }
  }

  async searchProducts(searchTerm, filters = {}) {
    try {
      const searchQuery = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { 'specs.material': { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Apply additional filters
      if (filters.category) {
        searchQuery.category = filters.category;
      }
      if (filters.minPrice || filters.maxPrice) {
        searchQuery.price = {};
        if (filters.minPrice) searchQuery.price.$gte = filters.minPrice;
        if (filters.maxPrice) searchQuery.price.$lte = filters.maxPrice;
      }
      if (filters.colors && filters.colors.length > 0) {
        searchQuery.colors = { $in: filters.colors };
      }
      if (filters.gender) {
        searchQuery.gender = filters.gender;
      }

      const products = await Product.find(searchQuery)
        .sort({ averageRating: -1, createdAt: -1 })
        .limit(20);

      return products;
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  async getProductStats() {
    try {
      const stats = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stockQuantity' },
            averagePrice: { $avg: '$price' },
            categories: { $addToSet: '$category' }
          }
        }
      ]);

      const categoryBreakdown = await Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            totalStock: { $sum: '$stockQuantity' }
          }
        }
      ]);

      const colorBreakdown = await Product.aggregate([
        { $unwind: '$colors' },
        {
          $group: {
            _id: '$colors',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        overview: stats[0] || {},
        categoryBreakdown,
        colorBreakdown
      };
    } catch (error) {
      logger.error('Error getting product stats:', error);
      throw error;
    }
  }
}

export default new ProductService();
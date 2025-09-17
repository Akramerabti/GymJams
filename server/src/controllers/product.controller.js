import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import supabaseStorageService from '../services/supabaseStorage.service.js';
import ProductService from '../services/product.service.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    // Ensure ratedBy is present for frontend
    products.forEach(product => {
      if (!product.ratedBy && product.ratings) {
        product.ratedBy = [];
        product.ratings.forEach(r => {
          if (r.user && !product.ratedBy.some(u => u && u.toString() === r.user.toString())) {
            product.ratedBy.push(r.user);
          }
        });
      }
    });
    res.status(200).json({ data: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Ensure ratedBy is present for frontend
    if (!product.ratedBy && product.ratings) {
      product.ratedBy = [];
      product.ratings.forEach(r => {
        if (r.user && !product.ratedBy.some(u => u && u.toString() === r.user.toString())) {
          product.ratedBy.push(r.user);
        }
      });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductReviews = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Ensure ratedBy is present for frontend
    if (!product.ratedBy && product.ratings) {
      product.ratedBy = [];
      product.ratings.forEach(r => {
        if (r.user && !product.ratedBy.some(u => u && u.toString() === r.user.toString())) {
          product.ratedBy.push(r.user);
        }
      });
    }
    res.status(200).json({ ratings: product.ratings, ratedBy: product.ratedBy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new product with color and gender support
export const addProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category, 
      stockQuantity, 
      specs, 
      discount, 
      featured, 
      preOrder,
      colors,
      gender,
      imageColorAssociations 
    } = req.body;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded.' });
    }

    // Ensure the number of images is between 2 and 8
    if (req.files.length < 2 || req.files.length > 8) {
      return res.status(400).json({ message: 'A product must have between 2 and 8 images.' });
    }

    try {
      // Upload files to Supabase
      const uploadResults = await supabaseStorageService.uploadMultipleFiles(
        req.files.map(file => ({
          buffer: file.buffer,
          originalname: file.originalname
        })),
        'products'
      );
      
      // Parse color associations and colors
      const parsedColors = JSON.parse(colors || '[]');
      const parsedImageAssociations = JSON.parse(imageColorAssociations || '[]');
      
      // Create image URLs with color associations
      const imageUrls = uploadResults.map((result, index) => {
        const association = parsedImageAssociations.find(a => a.index === index);
        return {
          url: result.url,
          color: association?.color || null
        };
      });
      
      console.log('Product images with color associations:', imageUrls);
      
      // Create a new product with colors and gender
      const newProduct = new Product({
        name,
        description,
        price,
        category,
        stockQuantity,
        imageUrls,
        colors: parsedColors,
        gender: category === 'Clothes' ? gender : null,
        specs: JSON.parse(specs),
        discount: JSON.parse(discount),
        featured: featured === 'true' || featured === true,
        preOrder: preOrder === 'true' || preOrder === true,
        ratings: undefined
      });

      // Save the product to the database
      await newProduct.save();

      // Respond with the created product
      res.status(201).json(newProduct);
      
    } catch (uploadError) {
      console.error('Error uploading product images to Supabase:', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload product images',
        error: uploadError.message 
      });
    }
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  let updates = req.body;
  console.log('[updateProduct] Called for product ID:', id);
  console.log('[updateProduct] Raw req.body:', req.body);
  
  if (req.files) {
    console.log(`[updateProduct] Received ${req.files.length} files`);
  }

  try {
    // Parse JSON fields
    if (typeof updates.specs === 'string') {
      try { updates.specs = JSON.parse(updates.specs); } catch (err) { console.log('[updateProduct] Error parsing specs:', err); }
    }
    if (typeof updates.discount === 'string') {
      try { updates.discount = JSON.parse(updates.discount); } catch (err) { console.log('[updateProduct] Error parsing discount:', err); }
    }
    if (typeof updates.colors === 'string') {
      try { updates.colors = JSON.parse(updates.colors); } catch (err) { console.log('[updateProduct] Error parsing colors:', err); }
    }
    if (typeof updates.imageColorAssociations === 'string') {
      try { updates.imageColorAssociations = JSON.parse(updates.imageColorAssociations); } catch (err) { console.log('[updateProduct] Error parsing imageColorAssociations:', err); }
    }
    if (typeof updates.existingImages === 'string') {
      try { updates.existingImages = JSON.parse(updates.existingImages); } catch (err) { console.log('[updateProduct] Error parsing existingImages:', err); }
    }
    if (typeof updates.ratings === 'string') {
      try {
        updates.ratings = JSON.parse(updates.ratings);
      } catch (err) {
        console.log('[updateProduct] Error parsing ratings:', err);
        updates.ratings = undefined;
      }
    }

    // Convert boolean strings
    if (typeof updates.featured === 'string') {
      updates.featured = updates.featured === 'true';
    }
    if (typeof updates.preOrder === 'string') {
      updates.preOrder = updates.preOrder === 'true';
    }

    // Handle gender - null for non-clothing items
    if (updates.category !== 'Clothes') {
      updates.gender = null;
    }

    // Get the existing product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let finalImageUrls = [];

    // Handle existing images that weren't removed
    if (updates.existingImages && updates.existingImages.length > 0) {
      finalImageUrls = updates.existingImages;
    }

    // Handle new image uploads - UPLOAD TO SUPABASE FIRST
    let uploadedImageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log('[updateProduct] Uploading new images to Supabase...');
      try {
        const uploadResults = await supabaseStorageService.uploadMultipleFiles(
          req.files.map(file => ({
            buffer: file.buffer,
            originalname: file.originalname
          })),
          'products'
        );
        
        // Create image URL objects with color associations
        uploadedImageUrls = uploadResults.map((result, index) => {
          const association = updates.imageColorAssociations?.find(a => a.index === index);
          return {
            url: result.url,
            color: association?.color || null
          };
        });
        
        finalImageUrls = [...finalImageUrls, ...uploadedImageUrls];
      } catch (uploadError) {
        console.error('[updateProduct] Upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload images', 
          error: uploadError.message 
        });
      }
    }

    // Update imageUrls with the final processed URLs
    updates.imageUrls = finalImageUrls;

    // Remove fields that shouldn't be in the update
    const fieldsToRemove = ['_id', 'id', '__v', 'createdAt', 'updatedAt', 'discountedPrice', 'imageColorAssociations', 'existingImages'];
    fieldsToRemove.forEach(field => {
      delete updates[field];
    });

    console.log('[updateProduct] Final update payload:', updates);
    
    // NOW call the ProductService with properly formatted data
    const updatedProduct = await ProductService.updateProduct(id, updates, []);
    
    console.log('[updateProduct] Updated product:', updatedProduct);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('[updateProduct] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create product (alias for addProduct to match service)
export const createProduct = addProduct;

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated images from Supabase
    if (product.imageUrls && product.imageUrls.length > 0) {
      const deletePromises = product.imageUrls.map(async (imageData) => {
        const imageUrl = typeof imageData === 'object' ? imageData.url : imageData;
        if (imageUrl && imageUrl.includes('supabase')) {
          try {
            await supabaseStorageService.deleteFile(imageUrl);
          } catch (err) {
            console.error(`Failed to delete image from Supabase: ${imageUrl}`, err);
          }
        }
      });
      await Promise.all(deletePromises);
    }

    // Delete the product from the database
    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: 'Product and images deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply promotion to a product
export const applyPromotion = async (req, res) => {
  const { id } = req.params;
  const { percentage, startDate, endDate } = req.body;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    product.discount = { percentage, startDate, endDate };
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req, res) => {
  const { id } = req.params;
  const { userId, rating } = req.body;
  console.log('[addReview] Called for product ID:', id);
  console.log('[addReview] User ID:', userId, 'Rating:', rating);
  
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already rated
    let existingRating = product.ratings.find(r => 
      r.user && r.user.toString() === userId.toString()
    );
    
    if (existingRating) {
      // Update rating
      existingRating.rating = rating;
      existingRating.date = new Date();
    } else {
      // Add new rating
      product.ratings.push({ user: userId, rating, date: new Date() });
      if (!product.ratedBy) product.ratedBy = [];
      if (!product.ratedBy.some(u => u && u.toString() === userId.toString())) {
        product.ratedBy.push(userId);
      }
    }
    
    // Update average rating
    const totalRating = product.ratings.reduce((sum, item) => sum + item.rating, 0);
    product.averageRating = Math.round((totalRating / product.ratings.length) * 10) / 10;
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('[addReview] Error:', error);
    res.status(500).json({ message: error.message });
  }
};
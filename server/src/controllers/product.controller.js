import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import supabaseStorageService from '../services/supabaseStorage.service.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // Fetch all products
    res.status(200).json({ data: products }); // Return products in a `data` field
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
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new product
export const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stockQuantity, specs, discount, featured, preOrder } = req.body;

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
        'products' // folder name
      );
      
      // Extract URLs from upload results
      const images = uploadResults.map(result => result.url);
      
      //('Product images uploaded to Supabase:', images);      // Create a new product
      const newProduct = new Product({
        name,
        description,
        price,
        category,
        stockQuantity,
        imageUrls: images,
        specs: JSON.parse(specs),
        discount: JSON.parse(discount),
        featured: featured === 'true' || featured === true,
        preOrder: preOrder === 'true' || preOrder === true,
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

// Update a product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated images
    if (product.imageUrls && product.imageUrls.length > 0) {
      product.imageUrls.forEach((imagePath) => {
        const fullPath = path.join(process.cwd(), imagePath);
        fs.unlink(fullPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Failed to delete image: ${fullPath}`, err);
          }
        });
      });
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
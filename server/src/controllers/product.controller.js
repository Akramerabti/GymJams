import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import supabaseStorageService from '../services/supabaseStorage.service.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}); 
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
        preOrder: preOrder === 'true' || featured === true,
        ratings: undefined // omit ratings if no reviews
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
  let updates = req.body;
  console.log('[updateProduct] Called for product ID:', id);
  console.log('[updateProduct] Raw req.body:', req.body);
  if (req.files) {
    console.log(`[updateProduct] Received ${req.files.length} files`);
    req.files.forEach((file, idx) => {
      console.log(`[updateProduct] File #${idx}:`, file.originalname, file.size, 'bytes');
    });
  } else {
    console.log('[updateProduct] No files received');
  }
  try {
 
    if (typeof updates.specs === 'string') {
      try { updates.specs = JSON.parse(updates.specs); } catch (err) { console.log('[updateProduct] Error parsing specs:', err, 'Value:', updates.specs); }
    }
    if (typeof updates.discount === 'string') {
      try { updates.discount = JSON.parse(updates.discount); } catch (err) { console.log('[updateProduct] Error parsing discount:', err, 'Value:', updates.discount); }
    }
    if (typeof updates.thirdPartyData === 'string') {
      if (updates.thirdPartyData === '[object Object]') {
        console.log('[updateProduct] thirdPartyData is [object Object] string, removing from update.');
        updates.thirdPartyData = undefined;
      } else {
        try {
          updates.thirdPartyData = JSON.parse(updates.thirdPartyData);
        } catch (err) {
          console.log('[updateProduct] Error parsing thirdPartyData:', err, 'Value:', updates.thirdPartyData);
          updates.thirdPartyData = undefined;
        }
      }
    }
    // If thirdPartyData is still a string, forcibly remove it
    if (typeof updates.thirdPartyData === 'string') {
      console.log('[updateProduct] Removing invalid thirdPartyData string:', updates.thirdPartyData);
      updates.thirdPartyData = undefined;
    }
    if (typeof updates.imageUrls === 'string') {
      // If imageUrls is a comma-separated string, convert to array
      if (updates.imageUrls.includes(',')) {
        updates.imageUrls = updates.imageUrls.split(',');
        console.log('[updateProduct] Converted imageUrls string to array:', updates.imageUrls);
      } else if (updates.imageUrls.startsWith('[') && updates.imageUrls.endsWith(']')) {
        try {
          updates.imageUrls = JSON.parse(updates.imageUrls);
        } catch (err) {
          console.log('[updateProduct] Error parsing imageUrls:', err, 'Value:', updates.imageUrls);
        }
      }
    }
    if (typeof updates.featured === 'string') {
      updates.featured = updates.featured === 'true';
    }
    if (typeof updates.preOrder === 'string') {
      updates.preOrder = updates.preOrder === 'true';
    }

    // Get the existing product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log('[updateProduct] Uploading new images to Supabase...');
      const uploadResults = await supabaseStorageService.uploadMultipleFiles(
        req.files.map(file => ({
          buffer: file.buffer,
          originalname: file.originalname
        })),
        'products'
      );
      newImageUrls = uploadResults.map(result => result.url);
      updates.imageUrls = newImageUrls;
      console.log('[updateProduct] Replaced imageUrls:', updates.imageUrls);
    }

   
    if (updates._id) {
      delete updates._id;
    }
    console.log('[updateProduct] Final update payload:', updates);
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
    console.log('[updateProduct] Updated product:', updatedProduct);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('[updateProduct] Error:', error);
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
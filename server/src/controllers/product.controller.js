// productController.js
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // Fetch all products
    res.status(200).json({ data: products }); // Return products in a `data` field
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new product
export const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stockQuantity, specs, discount } = req.body;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded.' });
    }

    // Ensure the number of images is between 2 and 8
    if (req.files.length < 2 || req.files.length > 8) {
      return res.status(400).json({ message: 'A product must have between 2 and 8 images.' });
    }

    // Extract file paths from uploaded files
    const images = req.files.map((file) => file.path);

    // Create a new product
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      stockQuantity,
      images,
      specs: JSON.parse(specs), // Ensure specs is parsed if sent as a string
      discount: JSON.parse(discount), // Ensure discount is parsed if sent as a string
    });

    // Save the product to the database
    await newProduct.save();

    // Respond with the created product
    res.status(201).json(newProduct);
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

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Product deleted successfully' });
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
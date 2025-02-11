import React, { useState, useEffect } from 'react';
import ProductForm from '../../components/product/ProductForm';
import ProductList from '../../components/product/ProductList';
import PromotionForm from '../../components/product/PromotionForm';
import productService from '../../services/product.service'; // Import productService
import { toast } from 'sonner'; // For displaying notifications
import { useAuth } from '../../stores/authStore'; // Import useAuth to check user role

const Products = () => {
  const [products, setProducts] = useState([]); // Initialize products as an empty array
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const { user, token } = useAuth(); // Get the current user and token from the auth store

  const categories = ['Weights', 'Machines', 'Accessories', 'CardioEquipment'];

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  
  // Fetch all products
  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      console.log('Fetched Products:', response); // Debugging: Log fetched products
      setProducts(response.data || []); // Extract the `data` field and ensure it's an array
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products. Please try again.');
      setProducts([]); // Reset products to an empty array on error
    }
  };

  // Add a new product
  const handleAddProduct = async (product) => {
    if (getUserrole(user) !== 'taskforce' && getUserrole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can add products.');
      return;
    }

    try {
      const newProduct = await productService.addProduct(product);
      console.log('New Product:', newProduct); // Debugging: Log new product
      setProducts((prevProducts) => [...prevProducts, newProduct]);
      setShowAddProduct(false);
      toast.success('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    }
  };

  // Delete a product
  const handleDeleteProduct = async (id) => {
    if (getUserrole(user) !== 'taskforce' && getUserrole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can delete products.');
      return;
    }

    try {
      await productService.deleteProduct(id, token);
      setProducts((prevProducts) => prevProducts.filter((product) => product._id !== id));
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    }
  };

  // Apply a promotion to a product
  const handleApplyPromotion = async (productId, promotion) => {
    if (user?.role !== 'taskforce') {
      toast.error('Access denied. Only taskforce members can apply promotions.');
      return;
    }

    try {
      const updatedProduct = await productService.applyPromotion(productId, promotion, token);
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      setShowPromotionForm(false);
      toast.success('Promotion applied successfully!');
    } catch (error) {
      console.error('Error applying promotion:', error);
      toast.error('Failed to apply promotion. Please try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Product Management</h2>
      <div className="space-y-4">
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          {showAddProduct ? 'Hide Add Product Form' : 'Add New Product'}
        </button>
        {showAddProduct && (
          <ProductForm categories={categories} onAddProduct={handleAddProduct} />
        )}
        <button
          onClick={() => setShowPromotionForm(!showPromotionForm)}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          {showPromotionForm ? 'Hide Promotion Form' : 'Apply Promotion'}
        </button>
        {showPromotionForm && (
          <PromotionForm products={products} onApplyPromotion={handleApplyPromotion} />
        )}
        <ProductList products={products} onDeleteProduct={handleDeleteProduct} />
      </div>
    </div>
  );
};

export default Products;
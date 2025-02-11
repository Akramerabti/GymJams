// components/taskforce/Products.jsx
import React, { useState, useEffect } from 'react';
import ProductForm from '../../components/product/ProductForm';
import ProductList from '../../components/product/ProductList';
import PromotionForm from '../../components/product/PromotionForm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPromotionForm, setShowPromotionForm] = useState(false);

  const categories = ['Weights', 'Machines', 'Accessories', 'CardioEquipment'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddProduct = async (product) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      setProducts(products.filter(product => product._id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleApplyPromotion = async (productId, promotion) => {
    try {
      const response = await fetch(`/api/products/${productId}/promotion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotion),
      });
      const updatedProduct = await response.json();
      setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      setShowPromotionForm(false);
    } catch (error) {
      console.error('Error applying promotion:', error);
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
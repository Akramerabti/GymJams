import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, SortAsc, SortDesc, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from '@/utils/formatters';

const ProductGrid = ({ products = [], onProductClick }) => {
  const [sortBy, setSortBy] = useState('featured');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImages, setSelectedImages] = useState(null);

  const categories = ['all', 'weights', 'machines', 'accessories', 'supplements'];

  const sortProducts = (products) => {
    switch (sortBy) {
      case 'price-asc':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return products;
    }
  };

  const filterProducts = (products) => {
    if (filterCategory === 'all') return products;
    return products.filter((product) => product.category.toLowerCase() === filterCategory.toLowerCase());
  };

  const constructImageUrl = (path) => {
    if (!path) return '/placeholder-image.jpg';
    return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}/${path}`;
  };

  const getPrice = (product) => {
    if (product.discount && product.discount.percentage && new Date(product.discount.startDate) <= new Date() && new Date(product.discount.endDate) >= new Date()) {
      const discountAmount = (product.price * product.discount.percentage) / 100;
      return { original: product.price, discounted: product.price - discountAmount, hasDiscount: true, percentage: product.discount.percentage };
    }
    return { original: product.price, hasDiscount: false };
  };

  const filteredAndSortedProducts = sortProducts(filterProducts(products));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <button className="sm:hidden flex items-center space-x-2 text-gray-600" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </button>
        <div className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:w-auto`}>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category} onClick={() => setFilterCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm ${filterCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="block w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedProducts.map((product) => {
          const price = getPrice(product);
          return (
            <Card key={product._id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onProductClick(product._id)}>
              <div className="relative aspect-square overflow-hidden">
                <img src={constructImageUrl(product.images?.[0])} alt={product.name} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = '/placeholder-image.jpg'; }} />
                {product.stockQuantity === 0 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-semibold">Out of Stock</span></div>)}
                {price.hasDiscount && (<Badge className="absolute top-2 right-2 bg-red-500">{price.percentage}% OFF</Badge>)}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                  {price.hasDiscount ? (
                    <><span className="text-lg font-bold text-red-500">{formatCurrency(price.discounted)}</span>
                    <span className="text-sm text-gray-500 line-through">{formatCurrency(price.original)}</span></>) :
                    <span className="text-lg font-bold">{formatCurrency(price.original)}</span>}
                </div>
                {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                  <p className="text-sm text-amber-600 mt-2">Only {product.stockQuantity} left in stock</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {filteredAndSortedProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;

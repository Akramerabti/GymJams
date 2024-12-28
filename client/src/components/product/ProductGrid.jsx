import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { Filter, SortAsc, SortDesc } from 'lucide-react';

const ProductGrid = ({ products }) => {
  const [sortBy, setSortBy] = useState('featured');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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
    return products.filter(product => product.category === filterCategory);
  };

  const filteredAndSortedProducts = sortProducts(filterProducts(products));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Filter and Sort Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        {/* Mobile Filter Toggle */}
        <button
          className="sm:hidden flex items-center space-x-2 text-gray-600"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </button>

        {/* Desktop Filters */}
        <div className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:w-auto`}>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  filterCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="block w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No products found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
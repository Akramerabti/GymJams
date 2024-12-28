import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import  ProductGrid  from '../components/product/ProductGrid';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Filter } from 'lucide-react';

const Shop = () => {
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    search: '',
    sort: 'featured'
  });

  const { products, loading, error } = useProducts(filters);
  const categories = ['Weights', 'Machines', 'Accessories', 'CardioEquipment'];
  const priceRanges = [
    { label: 'Under $100', value: '0-100' },
    { label: '$100 - $500', value: '100-500' },
    { label: '$500 - $1000', value: '500-1000' },
    { label: 'Over $1000', value: '1000+' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-4 space-y-6">
            {/* Search */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Search</h3>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    search: e.target.value
                  }))}
                />
                <Search className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={filters.category === category ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      category: prev.category === category ? '' : category
                    }))}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Price Range</h3>
              <div className="space-y-2">
                {priceRanges.map((range) => (
                  <Button
                    key={range.value}
                    variant={filters.priceRange === range.value ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      priceRange: prev.priceRange === range.value ? '' : range.value
                    }))}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              Error loading products. Please try again later.
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
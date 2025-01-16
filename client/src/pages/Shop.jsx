import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/product/ProductGrid';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal 
} from 'lucide-react';

const Shop = () => {
  // Filters state
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    search: '',
    sort: 'featured'
  });

  // UI State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterSections, setFilterSections] = useState({
    categories: true,
    priceRange: true,
    sortBy: true
  });

  // Responsive state
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Product hooks
  const { products, loading, error } = useProducts(filters);

  // Constants
  const categories = ['Weights', 'Machines', 'Accessories', 'CardioEquipment'];
  const priceRanges = [
    { label: 'Under $100', value: '0-100' },
    { label: '$100 - $500', value: '100-500' },
    { label: '$500 - $1000', value: '500-1000' },
    { label: 'Over $1000', value: '1000+' }
  ];

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update filter state
  const updateFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      search: '',
      sort: 'featured'
    });
  };

  // Toggle filter section visibility
  const toggleFilterSection = (section) => {
    setFilterSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Responsive filter rendering
  const renderFilterSection = (title, key, items, renderItem) => {
    const isMobile = screenWidth <= 768;
    
    return (
      <div className="mb-4 border-b pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => isMobile && toggleFilterSection(key)}
        >
          <h3 className="text-lg font-semibold">{title}</h3>
          {isMobile && (
            <Button variant="ghost" size="icon">
              {filterSections[key] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          )}
        </div>
        {(!isMobile || filterSections[key]) && (
          <div className="space-y-2 mt-2">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    );
  };

  // Main filter component
  const FilterComponent = () => (
    <div className={`
      ${screenWidth <= 768 
        ? 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto' 
        : 'w-full max-w-xs'}
    `}>
      {/* Mobile close button */}
      {screenWidth <= 768 && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Filters</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileFiltersOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 sticky top-0 bg-white z-10">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Categories Filter */}
      {renderFilterSection(
        'Categories', 
        'categories', 
        categories, 
        (category) => (
          <Button
            key={category}
            variant={filters.category === category ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => updateFilter('category', category)}
          >
            {category}
          </Button>
        )
      )}

      {/* Price Range Filter */}
      {renderFilterSection(
        'Price Range', 
        'priceRange', 
        priceRanges, 
        (range) => (
          <Button
            key={range.value}
            variant={filters.priceRange === range.value ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => updateFilter('priceRange', range.value)}
          >
            {range.label}
          </Button>
        )
      )}

      {/* Sort By Filter */}
      {renderFilterSection(
        'Sort By', 
        'sortBy', 
        ['Featured', 'Price Low to High', 'Price High to Low', 'Newest Arrivals'], 
        (sortOption) => {
          const sortValue = sortOption.toLowerCase().replace(/\s+/g, '');
          return (
            <Button
              key={sortOption}
              variant={filters.sort === sortValue ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => updateFilter('sort', sortValue)}
            >
              {sortOption}
            </Button>
          );
        }
      )}

      {/* Reset Filters */}
      <Button 
        variant="destructive" 
        className="w-full mt-4"
        onClick={resetFilters}
      >
        Reset All Filters
      </Button>
    </div>
  );

  // Render
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Filter Toggle for Mobile */}
        {screenWidth <= 768 && (
          <Button 
            variant="outline"
            className="w-full mb-4 flex items-center justify-center"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-5 w-5" /> 
            Filters
          </Button>
        )}

        {/* Filters Sidebar for Desktop */}
        {screenWidth > 768 && (
          <div className="w-full max-w-xs mr-4 space-y-4">
            <FilterComponent />
          </div>
        )}

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

        {/* Mobile Filters Overlay */}
        {screenWidth <= 768 && mobileFiltersOpen && (
          <div className="fixed inset-0 z-50">
            <FilterComponent />
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
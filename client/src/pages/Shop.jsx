import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/product/ProductGrid';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Search, X, ChevronDown, ChevronUp, SlidersHorizontal,
  ShoppingBag, ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Shop = () => {
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    search: '',
    sort: 'featured',
  });

  const [activeFilters, setActiveFilters] = useState(0);
  const { products, loading, error, fetchProducts } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const categories = ['Weights', 'Machines', 'Accessories', 'Cardio Equipment'];
  const priceRanges = [
    { label: 'Under $100', value: '0-100' },
    { label: '$100 - $500', value: '100-500' },
    { label: '$500 - $1000', value: '500-1000' },
    { label: 'Over $1000', value: '1000+' },
  ];

  // Check dark mode on component mount and subscribe to changes
  useEffect(() => {
    // Initialize dark mode state
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark-mode');
      setIsDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Create a mutation observer to watch for dark mode class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          checkDarkMode();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Clean up observer
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.priceRange) count++;
    if (filters.search) count++;
    if (filters.sort !== 'featured') count++;
    setActiveFilters(count);
  }, [filters]);

  useEffect(() => {
    let result = [...products];

    if (filters.category) {
      result = result.filter((product) => product.category === filters.category);
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-');
      result = result.filter((product) => {
        if (max === '+') return product.price >= Number(min);
        return product.price >= Number(min) && product.price <= Number(max);
      });
    }

    if (filters.search) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(result);
  }, [filters, products]);

  const updateFilter = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      search: '',
      sort: 'featured',
    });
  };

  const FilterPanel = ({ inSheet = false }) => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-200'}`}>
          Categories
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={filters.category === category ? "default" : "outline"}
              className={`w-full justify-start ${
                isDarkMode && filters.category !== category 
                  ? 'hover:bg-gray-700 text-gray-200 border-gray-600' 
                  : 'text-gray-100 hover:bg-gray-700'
              }`}
              onClick={() => updateFilter('category', category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-200'}`}>
          Price Range
        </div>
        <div className="grid grid-cols-2 gap-2">
          {priceRanges.map((range) => (
            <Button
              key={range.value}
              variant={filters.priceRange === range.value ? "default" : "outline"}
              className={`w-full justify-start ${
                isDarkMode && filters.priceRange !== range.value 
                  ? 'hover:bg-gray-700 text-gray-200 border-gray-600' 
                  : 'text-gray-100 hover:bg-gray-700'
              }`}
              onClick={() => updateFilter('priceRange', range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-200'}`}>
          Sort By
        </div>
        <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
          <SelectTrigger className={`w-full ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 ' : 'bg-white'}`}>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white'}>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {inSheet && (
        <Button 
          variant="destructive" 
          className="w-full mt-4"
          onClick={resetFilters}
        >
          Reset All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-100' : ''}`}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filters */}
        <div className="hidden lg:block w-64 flex-none">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : ''}`}>Filters</h2>
              {activeFilters > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={resetFilters}
                  className={isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : ''}
                >
                  Clear all
                </Button>
              )}
            </div>
            <FilterPanel />
          </div>
        </div>

        <div className="flex-1">
          {/* Search and Mobile Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className={`pl-10 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400' 
                    : 'bg-white'
                }`}
              />
              <Search className={`absolute left-3 top-3 h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`lg:hidden relative ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' 
                        : 'bg-white'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2 " />
                    Filters
                    {activeFilters > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                        {activeFilters}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className={isDarkMode ? 'bg-gray-900 border-gray-800' : ''}>
                  <SheetHeader>
                    <SheetTitle className={isDarkMode ? 'text-white' : 'text-white'}>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel inSheet={true} />
                  </div>
                </SheetContent>
              </Sheet>

              <Select 
                value={filters.sort}
                onValueChange={(value) => updateFilter('sort', value)}
                className="hidden sm:inline-flex"
              >
                <SelectTrigger className={`w-40 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white'
                }`}>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white'}>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                isDarkMode ? 'border-blue-400' : 'border-primary'
              }`} />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              Error loading products. Please try again later.
            </div>
          ) : (
            <ProductGrid 
              products={filteredProducts} 
              onProductClick={(productId) => navigate(`/product/${productId}`)}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
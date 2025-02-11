import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, SortAsc, SortDesc, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ProductGrid = ({ products = [] }) => {
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
    return products.filter((product) => 
      product.category.toLowerCase() === filterCategory.toLowerCase()
    );
  };

  const constructImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL}/${path}`;
  };

  const filteredAndSortedProducts = sortProducts(filterProducts(products || []));

  const ImageGallery = ({ images }) => (
    <div className="grid grid-cols-2 gap-2 p-4">
      {images.map((image, index) => (
        <img
          key={index}
          src={constructImageUrl(image)}
          alt={`Product image ${index + 1}`}
          className="w-full h-48 object-cover rounded-lg"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Filter and Sort Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <button
          className="sm:hidden flex items-center space-x-2 text-gray-600"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
        </button>

        <div className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:w-auto`}>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
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
        {filteredAndSortedProducts.map((product) => (
          <Card key={product._id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="relative">
                <img
                  src={constructImageUrl(product.images?.[0])}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <button 
                      className="absolute bottom-2 right-2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white"
                      onClick={() => setSelectedImages(product.images)}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="ml-1">{product.images?.length || 0}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{product.name} - Images</DialogTitle>
                    </DialogHeader>
                    <ImageGallery images={product.images || []} />
                  </DialogContent>
                </Dialog>
              </div>
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">${product.price}</span>
                <span className="text-sm text-gray-500">Stock: {product.stockQuantity}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {(!filteredAndSortedProducts || filteredAndSortedProducts.length === 0) && (
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
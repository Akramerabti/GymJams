import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const ProductDetail = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-center object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-w-1 aspect-h-1 rounded-md overflow-hidden ${
                  selectedImage === index ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-center object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>
          
          {/* Price and Rating */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </div>
            <div className="flex items-center">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`w-5 h-5 ${
                      index < product.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-gray-600">
                ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-sm text-gray-500 mb-6">
            {product.description}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="p-2 hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                className="w-16 text-center border-x border-gray-300"
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="p-2 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
            <button
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              aria-label="Add to wishlist"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Product Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-500">{key}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
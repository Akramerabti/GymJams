import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Palette } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const PREDEFINED_COLORS = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Gray': '#808080',
  'Navy': '#000080',
  'Red': '#FF0000',
  'Blue': '#0000FF',
  'Green': '#008000',
  'Yellow': '#FFFF00',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Orange': '#FFA500',
  'Brown': '#A52A2A',
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { id, name, price, description, category, gender, colors = [], imageUrls = [], discountedPrice, discount } = product;

  // Format image URL to handle both Supabase URLs and legacy local paths
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    
    // Handle new structure with color-specific images
    if (typeof imagePath === 'object' && imagePath.url) {
      const url = imagePath.url;
      if (url.startsWith('http')) return url;
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
    
    // Handle legacy structure
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  // Get image for selected color or default
  const getDisplayImage = () => {
    if (!imageUrls || imageUrls.length === 0) return '/placeholder-image.jpg';
    
    // If we have color-specific images
    if (selectedColor && imageUrls.some(img => img.color)) {
      const colorImage = imageUrls.find(img => img.color === selectedColor);
      if (colorImage) return formatImageUrl(colorImage);
    }
    
    // Return first image as default
    return formatImageUrl(imageUrls[0]);
  };

  const toggleWishlist = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    // You can add actual wishlist logic here
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({
      ...product,
      selectedColor: selectedColor
    });
  };

  const handleColorSelect = (color, e) => {
    e.stopPropagation();
    setSelectedColor(color);
  };

  const displayPrice = discount?.percentage && discountedPrice 
    ? discountedPrice 
    : price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer group">
      {/* Product Image */}
      <div 
        className="relative h-64 overflow-hidden"
        onClick={() => navigate(`/product/${id}`)}
      >
        <img
          src={getDisplayImage()}
          alt={name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Discount Badge */}
        {discount?.percentage && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
            {discount.percentage}% OFF
          </div>
        )}
        
        {/* Wishlist Button */}
        <button 
          className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 hover:bg-white text-gray-600 hover:text-red-500'
          }`}
          aria-label="Add to wishlist"
          onClick={toggleWishlist}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Category and Gender Badges */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          {category === 'Clothes' && gender && (
            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
              {gender}
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 
          className="text-lg font-semibold mb-1 hover:text-blue-600 line-clamp-1"
          onClick={() => navigate(`/product/${id}`)}
        >
          {name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {description}
        </p>

        {/* Color Options */}
        {colors.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">
                {colors.length} Color{colors.length > 1 ? 's' : ''} Available
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {colors.slice(0, 6).map(color => (
                <button
                  key={color}
                  onClick={(e) => handleColorSelect(color, e)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110 shadow-md' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ 
                    backgroundColor: PREDEFINED_COLORS[color] || '#ccc'
                  }}
                  title={color}
                  aria-label={`Select ${color} color`}
                />
              ))}
              {colors.length > 6 && (
                <span className="text-xs text-gray-500 flex items-center">
                  +{colors.length - 6}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <div>
            {discount?.percentage ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  ${displayPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
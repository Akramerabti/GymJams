import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { id, name, price, images, description } = product;

  // Format image URL to handle both Supabase URLs and legacy local paths
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    
    // If it's already a full URL (including Supabase URLs), return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // For legacy local files, construct the full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  // Get the first available image
  const imageUrl = images && images.length > 0 ? formatImageUrl(images[0]) : '/placeholder-image.jpg';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Product Image */}
      <div 
        className="relative h-48 cursor-pointer"
        onClick={() => navigate(`/product/${id}`)}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        )}
        <button 
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white"
          aria-label="Add to wishlist"
        >
          <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 
          className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600"
          onClick={() => navigate(`/product/${id}`)}
        >
          {name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            ${price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
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
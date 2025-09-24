import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useCartStore from '@/stores/cartStore';

const constructImageUrl = (path) => {
  // Handle null, undefined, or non-string values
  if (!path) return '/placeholder-image.jpg';
  
  // If path is an object, extract the url property
  if (typeof path === 'object' && path.url) {
    path = path.url;
  }
  
  // Ensure we have a string before calling startsWith
  if (typeof path !== 'string') {
    return '/placeholder-image.jpg';
  }
  
  return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
};

const CartItem = ({ item }) => {
  const cartStore = useCartStore();
  const navigate = useNavigate();

  const handleRemoveClick = () => {
    cartStore.removeItem(item.id);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    cartStore.updateQuantity(item.id, newQuantity);
  };

  if (!item || !item.imageUrls || item.imageUrls.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md p-4 mb-4 min-h-[6rem]">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">Product data is incomplete or missing.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4 md:p-4 relative">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Image */}
          <div className="flex-shrink-0">
            <img
              src={constructImageUrl(item.imageUrls[0])}
              alt={item.name}
              className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/product/${item.id}`)}
              onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
            />
          </div>

          {/* Product Info - takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              {/* Product Name and Description */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base line-clamp-2 text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => navigate(`/product/${item.id}`)}>
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-1">
                  {item.description}
                </p>
              </div>

              {/* Remove Button - Top Right */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveClick}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>

            {/* Bottom row: Quantity Controls and Price */}
            <div className="flex justify-between items-center mt-3 gap-2">
              {/* Quantity Controls */}
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-6 w-6 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Minus className="h-3 w-3 text-gray-800 dark:text-gray-200" />
                </button>

                <span className="text-sm font-medium min-w-[1.5rem] text-center text-gray-900 dark:text-gray-100">
                  {item.quantity}
                </span>

                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="h-6 w-6 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3 w-3 text-gray-800 dark:text-gray-200" />
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(item.price)} each
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItem;
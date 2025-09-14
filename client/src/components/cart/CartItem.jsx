import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useCartStore from '@/stores/cartStore';

const constructImageUrl = (path) => {
  if (!path) return '/placeholder-image.jpg';
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
      <Card className="bg-white rounded-lg shadow-md p-4 mb-4 h-24">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">Product data is incomplete or missing.</p>
        </div>
      </Card>
    );
  }

  return (
   <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 relative h-24">
        {/* Remove Button - Top Right */}
        <Button
          variant="ghost"
          size="md"
          onClick={handleRemoveClick}
          className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-gray-200 "
        >
          <Trash2 className="h-4 w-4 text-gray-600 mb-3" />
        </Button>

        {/* Quantity Controls - Middle Right */}
        {/* Quantity Controls - Middle Right */}
<div className="absolute right-2 top-1/2 -translate-y-1/2 mb-3">
  <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
    <button
      onClick={() => handleQuantityChange(item.quantity - 1)}
      disabled={item.quantity <= 1}
      className="h-6 w-6 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
    >
      <Minus className="h-3 w-3 text-gray-800 dark:text-gray-200" />
    </button>
    
    <span className="text-sm font-medium w-6 text-center text-gray-900 dark:text-gray-100">
      {item.quantity}
    </span>
    
    <button
      onClick={() => handleQuantityChange(item.quantity + 1)}
      className="h-6 w-6 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
    >
      <Plus className="h-3 w-3 text-gray-800 dark:text-gray-200" />
    </button>
  </div>
</div>

        {/* Price - Bottom Right */}
        <div className="absolute bottom-2 right-2 mt-3">
          <span className="text-md font-semibold text-gray-900 dark:text-gray-100 mt-3">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>

        <div className="flex items-center h-full gap-4">
  {/* Image */}
  <div className="flex-shrink-0">
    <img
      src={constructImageUrl(item.imageUrls[0])}
      alt={item.name}
      className="h-16 w-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => navigate(`/product/${item.id}`)}
      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
    />
  </div>

  {/* Product Name and Description */}
  <div className="flex-1 min-w-0 pr-24">
    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
      {item.name}
    </h3>
    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
      {item.description}
    </p>
  </div>
</div>
      </CardContent>
    </Card>
  );
};

export default CartItem;
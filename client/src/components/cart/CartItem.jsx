import React from 'react';
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
    <Card className="bg-white rounded-lg shadow-md mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 relative h-24">
        {/* Remove Button - Top Right */}
        <Button
          variant="ghost"
          size="md"
          onClick={handleRemoveClick}
          className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-gray-200 "
        >
          <Trash2 className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Quantity Controls - Middle Right */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="h-6 w-6 rounded-md hover:bg-gray-200"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-6 text-center">
              {item.quantity}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="h-6 w-6 rounded-md hover:bg-gray-200"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Price - Bottom Right */}
        <div className="absolute bottom-2 right-2">
          <span className="text-md font-semibold text-gray-900">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-4 h-full">
          {/* Image */}
          <div className="col-span-1">
            <img
              src={constructImageUrl(item.imageUrls[0])}
              alt={item.name}
              className="h-16 w-16 object-cover rounded-md"
              onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
            />
          </div>

          {/* Product Name and Description */}
          <div className="col-span-3">
            <h3 className="font-medium text-sm truncate pr-8">
              {item.name}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {item.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItem;
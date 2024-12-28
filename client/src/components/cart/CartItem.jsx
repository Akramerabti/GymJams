import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { id, name, price, image, quantity } = item;

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200">
      {/* Product Image and Details */}
      <div className="flex flex-1 items-center space-x-4">
        <img
          src={image}
          alt={name}
          className="w-20 h-20 object-cover rounded-md"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <p className="text-gray-600">${price.toFixed(2)}</p>
        </div>
      </div>

      {/* Quantity Controls and Remove */}
      <div className="flex items-center space-x-4 mt-4 sm:mt-0">
        {/* Quantity Adjuster */}
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="p-2 hover:bg-gray-100 rounded-l-md"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
            className="w-12 text-center border-x border-gray-300 py-1"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="p-2 hover:bg-gray-100 rounded-r-md"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Subtotal (visible on mobile) */}
        <div className="sm:hidden text-lg font-semibold">
          ${(price * quantity).toFixed(2)}
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removeFromCart(id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-md"
          aria-label="Remove item"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Subtotal (hidden on mobile) */}
      <div className="hidden sm:block text-lg font-semibold w-24 text-right">
        ${(price * quantity).toFixed(2)}
      </div>
    </div>
  );
};

export default CartItem;
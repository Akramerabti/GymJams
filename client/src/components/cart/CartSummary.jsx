import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CreditCard } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const CartSummary = () => {
  const { items, total, itemCount } = useCart();
  const navigate = useNavigate();

  // Calculate subtotal and shipping
  const subtotal = total;
  const shipping = subtotal > 100 ? 0 : 10;
  const finalTotal = subtotal + shipping;

  // Check if eligible for free shipping
  const remainingForFreeShipping = 100 - subtotal;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <ShoppingBag className="w-5 h-5 mr-2" />
        Order Summary
      </h2>

      {/* Free Shipping Progress */}
      {remainingForFreeShipping > 0 && (
        <div className="mb-6">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              Add ${remainingForFreeShipping.toFixed(2)} more for free shipping!
            </p>
            <div className="mt-2 h-2 bg-blue-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${(subtotal / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="space-y-4">
        <div className="text-gray-600">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
          disabled={items.length === 0}
        >
          <CreditCard className="w-5 h-5" />
          <span>Proceed to Checkout</span>
        </button>

        {/* Continue Shopping */}
        <button
          onClick={() => navigate('/shop')}
          className="w-full mt-2 bg-gray-100 text-gray-700 py-3 rounded-md hover:bg-gray-200 transition-colors"
        >
          Continue Shopping
        </button>

        {/* Payment Methods */}
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">We Accept:</p>
          <div className="flex space-x-2">
            {/* Replace with actual payment method icons */}
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
            <div className="w-10 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Secure Checkout Notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Secure Checkout - Your data is protected
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
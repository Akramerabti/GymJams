import React from 'react';
import useCartStore from '../stores/cartStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { Button } from '../components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cartStore = useCartStore();
  const { items, getCartTotals, initiateCheckout } = cartStore;

  const handleCheckout = async () => {
    try {
      console.log('Initiating checkout:', user?.user._id );
      const checkoutData = {
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          // Add shipping address details here
          email: user?.email || '', // Required for guest orders
        },
        billingAddress: {
          // Add billing address details here
        },
        shippingMethod: 'standard',
        userId: user?.user._id, // Pass the user ID if authenticated
      };

      await initiateCheckout(checkoutData);
      navigate('/shop-checkout');
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('An error occurred during checkout.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">
          Looks like you haven't added any items to your cart yet.
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate('/shop')}
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Cart Summary - Pass the checkout handler to CartSummary */}
        <div className="lg:w-96">
          <CartSummary 
            totals={getCartTotals()} 
            onCheckout={handleCheckout}
            isLoading={cartStore.loading}
          />
          {/* Removed duplicate checkout button */}
        </div>
      </div>
    </div>
  );
};

export default Cart;
import React, { useState, useEffect } from 'react';
import useCartStore from '../stores/cartStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { Button } from '../components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cartStore = useCartStore();
  const { items, getCartTotals, initiateCheckout, validateCartStock, removePointsDiscount } = cartStore;

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState('');


  useEffect(() => {
    // Reset points discount when returning to the cart page
    removePointsDiscount();
  }, [removePointsDiscount]);


  const getUserId = (user) => {
    return user?.user?.id || user?.id || '';
  };

  const handleCheckout = async () => {
  try {
    const isStockValid = await validateCartStock();

    if (!isStockValid) {
      toast.error('Some items in your cart are out of stock or have insufficient quantity.');
      return;
    }

    // If the user is logged in, proceed directly to checkout
    if (user) {
      const checkoutData = {
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          email: user.email, // Use the logged-in user's email
        },
        billingAddress: {},
        shippingMethod: 'standard',
        userId: getUserId(user),
        pointsUsed: cartStore.pointsUsed, // Include pointsUsed
        pointsDiscount: cartStore.pointsDiscount, // Include pointsDiscount
      };

      const order = await initiateCheckout(checkoutData);
      //('Checkout successful, redirecting to /shop-checkout', order);
      navigate('/shop-checkout');
      return;
    }

    // If the user is a guest, open the email modal
    setIsEmailModalOpen(true);
  } catch (error) {
    console.error('Checkout failed:', error);
    toast.error('An error occurred during checkout.');
  }
};

const handleGuestCheckout = async () => {
  try {
    // Validate the email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const isStockValid = await validateCartStock();

    if (!isStockValid) {
      toast.error('Some items in your cart are out of stock or have insufficient quantity.');
      return;
    }

    const checkoutData = {
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      shippingAddress: {
        email: email, // Use the email provided by the guest user
      },
      billingAddress: {},
      shippingMethod: 'standard',
      userId: null, // No user ID for guest checkout
      pointsUsed: cartStore.pointsUsed, // Include pointsUsed
      pointsDiscount: cartStore.pointsDiscount, // Include pointsDiscount
    };

    const order = await initiateCheckout(checkoutData);
    //('Checkout successful, redirecting to /shop-checkout', order);
    navigate('/shop-checkout');
  } catch (error) {
    console.error('Checkout failed:', error);
    toast.error('An error occurred during checkout.');
  } finally {
    setIsEmailModalOpen(false); // Close the email modal
  }
};

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 mt-10 text-center">
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
    <div className="container mt-35 mx-auto px-4 py-8">
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
        </div>
      </div>

      {/* Email Modal for Guest Users */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black !important">Enter Your Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mb-3 ">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleGuestCheckout}>Proceed to Checkout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag } from 'lucide-react';
import PointsRedemption from './PointsRedemption';
import PointsPromotion from './PointsPromotion';
import { useAuth } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import useCartStore from '@/stores/cartStore';

const CartSummary = ({ totals, onCheckout, isLoading }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePointsDiscount, removePointsDiscount } = useCartStore();
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);

  // Calculate the final total without double-counting the discount
  const finalTotal = Math.max(0, totals.subtotal + totals.shipping + totals.tax - pointsDiscount).toFixed(2);

  const handleApplyDiscount = (points, discountAmount) => {
    setPointsUsed(points);
    setPointsDiscount(discountAmount);
    updatePointsDiscount(points, discountAmount);
  };

  const handleRemoveDiscount = () => {
    setPointsUsed(0);
    setPointsDiscount(0);
    removePointsDiscount();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${totals.tax.toFixed(2)}</span>
        </div>

        {/* Points Discount */}
        {pointsDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Points Discount</span>
            <span>-${pointsDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${finalTotal}</span>
          </div>
        </div>
      </CardContent>

      {/* Points Redemption or Promotion Section */}
      <div className="px-6 pb-2">
        {user ? (
          <PointsRedemption
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            disabled={isLoading}
            cartTotal={totals.subtotal + totals.shipping + totals.tax} // Pass the cart total before discount
          />
        ) : (
          <PointsPromotion />
        )}
      </div>

      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={onCheckout}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Checkout
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/shop')}
          className="w-full"
        >
          Continue Shopping
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CartSummary;
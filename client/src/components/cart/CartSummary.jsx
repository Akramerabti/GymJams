import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag } from 'lucide-react';
import PointsRedemption from './PointsRedemption';
import PointsPromotion from './PointsPromotion';
import { useAuth } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import useCartStore from '@/stores/cartStore';
import productService from '@/services/product.service';
import { toast } from 'sonner';

const CartSummary = ({ totals, onCheckout, isLoading }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePointsDiscount, removePointsDiscount, items } = useCartStore();
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  
  // New discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [codeDiscount, setCodeDiscount] = useState(0);
  const [codeStatus, setCodeStatus] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');

  useEffect(() => {
    // Load points discount from local storage
    const savedPointsDiscount = localStorage.getItem('pointsDiscount');
    const savedPointsUsed = localStorage.getItem('pointsUsed');
  
    if (savedPointsDiscount && savedPointsUsed) {
      setPointsDiscount(parseFloat(savedPointsDiscount));
      setPointsUsed(parseInt(savedPointsUsed));
      updatePointsDiscount(parseInt(savedPointsUsed), parseFloat(savedPointsDiscount));
    }

    // Load discount code from local storage
    const savedDiscountCode = localStorage.getItem('cartDiscountCode');
    const savedCodeDiscount = localStorage.getItem('cartCodeDiscount');
    
    if (savedDiscountCode && savedCodeDiscount) {
      setAppliedDiscountCode(savedDiscountCode);
      setCodeDiscount(parseFloat(savedCodeDiscount));
      setCodeStatus({ valid: true });
    }
  }, []);
  
  useEffect(() => {
    // Save points discount to local storage
    localStorage.setItem('pointsDiscount', pointsDiscount.toString());
    localStorage.setItem('pointsUsed', pointsUsed.toString());
  }, [pointsDiscount, pointsUsed]);

  useEffect(() => {
    // Save discount code to local storage
    if (appliedDiscountCode && codeDiscount > 0) {
      localStorage.setItem('cartDiscountCode', appliedDiscountCode);
      localStorage.setItem('cartCodeDiscount', codeDiscount.toString());
    } else {
      localStorage.removeItem('cartDiscountCode');
      localStorage.removeItem('cartCodeDiscount');
    }
  }, [appliedDiscountCode, codeDiscount]);

  const handleValidateDiscountCode = async () => {
  if (!discountCode.trim()) return;
  
  setCodeLoading(true);
  setCodeStatus(null);
  setCodeDiscount(0);
  
  try {
    const userId = user?.user?._id || user?._id;
    
    // Check if code applies to any items in cart
    let bestDiscount = 0;
    let isValidForAnyItem = false;
    
    for (const item of items) {
      try {
        // Try specific product validation - FIXED PARAMETERS
        const productResult = await productService.validateCouponCode({
          code: discountCode,
          userId,
          productId: item.id,
          couponType: 'product'  // Use couponType consistently
        });
        
        if (productResult.valid) {
          isValidForAnyItem = true;
          if (productResult.discount > bestDiscount) {
            bestDiscount = productResult.discount;
          }
        }
      } catch (productError) {
        // Try category validation - FIXED PARAMETERS
        try {
          const categoryResult = await productService.validateCouponCode({
            code: discountCode,
            userId,
            category: item.category,
            couponType: 'product'  // Use couponType, not type
          });
          
          if (categoryResult.valid) {
            isValidForAnyItem = true;
            if (categoryResult.discount > bestDiscount) {
              bestDiscount = categoryResult.discount;
            }
          }
        } catch (categoryError) {
          continue;
        }
      }
    }
    
    // Try general validation - FIXED PARAMETERS
    if (!isValidForAnyItem) {
      try {
        const generalResult = await productService.validateCouponCode({
          code: discountCode,
          userId,
          couponType: 'product'  // Use couponType consistently
        });
        
        if (generalResult.valid) {
          isValidForAnyItem = true;
          bestDiscount = generalResult.discount;
        }
      } catch (generalError) {
        // Code doesn't apply to anything
      }
    }
      
      if (isValidForAnyItem && bestDiscount > 0) {
        const discountAmount = (totals.subtotal * bestDiscount / 100);
        setCodeStatus({ valid: true, discount: bestDiscount });
        setCodeDiscount(discountAmount);
        setAppliedDiscountCode(discountCode);
      } else {
        setCodeStatus({ valid: false });
      }
      
    } catch (err) {
      setCodeStatus({ valid: false });
    } finally {
      setCodeLoading(false);
    }
  };

  const handleRemoveDiscountCode = () => {
  setDiscountCode('');
  setCodeDiscount(0);
  setCodeStatus(null);
  setAppliedDiscountCode('');
  localStorage.removeItem('cartDiscountCode');
  localStorage.removeItem('cartCodeDiscount');
  };

  // Calculate the final total with both discounts
  const finalTotal = Math.max(0, totals.subtotal + totals.shipping + totals.tax - pointsDiscount - codeDiscount).toFixed(2);

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
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-gray-900 dark:text-gray-100">
          <span>Subtotal</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-900 dark:text-gray-100">
          <span>Shipping</span>
          <span>
            {totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-gray-900 dark:text-gray-100">
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

        {/* Code Discount */}
        {codeDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount Code ({appliedDiscountCode})</span>
            <span>-${codeDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
          <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
            <span>Total</span>
            <span>${finalTotal}</span>
          </div>
        </div>
      </CardContent>

      {/* Discount Code Section */}
      <div className="px-6 pb-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Discount Code
          </label>
          {appliedDiscountCode ? (
            <div className="flex items-center justify-between">
              <div className="text-green-600 text-sm">
                <span className="font-medium">{appliedDiscountCode}</span> applied 
                {codeStatus?.discount && ` (${codeStatus.discount}% off)`}
              </div>
              <Button
                type="button"
                onClick={handleRemoveDiscountCode}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setCodeStatus(null);
                }}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                placeholder="Enter discount code"
                maxLength={24}
              />
              <Button
                type="button"
                onClick={handleValidateDiscountCode}
                disabled={!discountCode || codeLoading}
                className="min-w-[90px]"
                variant="outline"
              >
                {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          )}
          {codeStatus && codeStatus.valid === false && (
            <div className="text-red-600 text-sm mt-1">
              Invalid or inapplicable discount code.
            </div>
          )}
        </div>
      </div>

      {/* Points Redemption or Promotion Section */}
      <div className="px-6 pb-2">
        {user ? (
          <PointsRedemption
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            disabled={isLoading}
            cartTotal={totals.subtotal + totals.shipping + totals.tax - codeDiscount} // Subtract code discount first
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
import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

const CartSummary = ({ totals, onCheckout, isLoading }) => {
  const { subtotal, shipping, tax, total } = totals;
  
  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full mt-6"
          onClick={onCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed to Checkout'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CartSummary;
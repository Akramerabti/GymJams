// components/cart/PointsRedemption.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import  Slider from '@/components/ui/Slider';
import { Info, Lock, Coins } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/stores/authStore';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';

const POINTS_CONVERSION_RATE = 200; // 200 points = $1 discount

const PointsRedemption = ({ onApplyDiscount, onRemoveDiscount, disabled, cartTotal = 0 }) => {
  const { user } = useAuth();
  const { balance } = usePoints();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isApplied, setIsApplied] = useState(false);
  const [maxPoints, setMaxPoints] = useState(0);

  useEffect(() => {
    if (balance) {
      // Calculate max discount possible based on cart total
      const maxDiscountPossible = cartTotal * 100; // Convert to cents for comparison
      
      // Calculate max points that can be used (can't discount more than the cart total)
      const maxPointsBasedOnCart = Math.floor(maxDiscountPossible / 100) * 200; // 200 points = $1
      
      // User's balance is another limit
      const maxPointsBasedOnBalance = Math.floor(balance / POINTS_CONVERSION_RATE) * POINTS_CONVERSION_RATE;
      
      // Use the smaller of the two limits
      setMaxPoints(Math.min(maxPointsBasedOnCart, maxPointsBasedOnBalance));
    }
  }, [balance, cartTotal]);

  const handleApplyPoints = () => {
    if (pointsToRedeem < 1000) {
      toast.error('Minimum redemption is 1,000 points');
      return;
    }

    if (pointsToRedeem > balance) {
      toast.error('Not enough points available');
      return;
    }
    
    // Calculate discount amount ($5 for every 1000 points)
    const discountAmount = (pointsToRedeem / POINTS_CONVERSION_RATE).toFixed(2);
    
    // Make sure the discount doesn't exceed the cart total
    if (parseFloat(discountAmount) > cartTotal) {
      toast.error('Discount cannot exceed the cart total');
      return;
    }
    
    onApplyDiscount(pointsToRedeem, parseFloat(discountAmount));
    setIsApplied(true);
    toast.success(`Discount of ${discountAmount} applied using ${pointsToRedeem} points`);
  };

  const handleRemovePoints = () => {
    onRemoveDiscount();
    setIsApplied(false);
    setPointsToRedeem(0);
    toast.info('Points discount removed');
  };

  const handlePointsChange = (value) => {
    // Ensure pointsToRedeem is always a multiple of 200
    const roundedValue = Math.round(value / POINTS_CONVERSION_RATE) * POINTS_CONVERSION_RATE;
    
    // Ensure we don't exceed the maximum points allowed (based on cart total and user balance)
    const cappedValue = Math.min(roundedValue, maxPoints);
    
    setPointsToRedeem(cappedValue);
  };

  const calculateDiscount = (points) => {
    return (points / POINTS_CONVERSION_RATE).toFixed(2);
  };

  // If user is not logged in, show locked state
  if (!user) {
    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900">Redeem Points</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <Info className="h-4 w-4 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create an account to earn and redeem points for discounts!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
          <Lock className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Sign in to redeem points for discounts</p>
            <p className="text-xs text-gray-400 mt-1">1,000 points = $5 discount</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.href = '/login'}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  // If user has insufficient points (less than 1000), show disabled state
  if (balance < 1000) {
    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900">Redeem Points</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>1,000 points = $5 discount</p>
                  <p>2,000 points = $10 discount</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center">
            <Coins className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">{balance} points</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
          <p className="text-sm text-gray-500">You need at least 1,000 points to redeem</p>
          <p className="text-xs text-gray-400">Keep shopping to earn more points!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="font-medium text-gray-900">Redeem Points</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                <Info className="h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-700">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300">Points Redemption</h4>
                <p className="text-sm text-gray-300">Use your points to get discounts on your purchase:</p>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                  <li>1,000 points = $5 discount</li>
                  <li>2,000 points = $10 discount</li>
                  <li>5,000 points = $25 discount</li>
                  <li>10,000 points = $50 discount</li>
                </ul>
                <p className="text-sm text-gray-300 mt-2">Points are earned through purchases, completing your profile, and participating in various activities.</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center">
          <Coins className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-sm font-medium">{balance} points</span>
        </div>
      </div>

      {isApplied ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-md border border-green-100">
            <div>
              <p className="text-green-800 font-medium">Discount Applied</p>
              <p className="text-sm text-green-700">{pointsToRedeem} points for ${calculateDiscount(pointsToRedeem)} off</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRemovePoints}
              disabled={disabled}
              className="text-green-800 bg-white hover:bg-green-50 border-green-200 shrink-0"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Points to redeem: {pointsToRedeem}</span>
              <span>Discount: ${calculateDiscount(pointsToRedeem)}</span>
            </div>
            <Slider
              value={[pointsToRedeem]}
              min={0}
              max={maxPoints > 0 ? maxPoints : 1000} // Use calculated maxPoints or default to 1000
              step={POINTS_CONVERSION_RATE}
              onValueChange={(value) => handlePointsChange(value[0])}
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{maxPoints > 0 ? maxPoints : Math.min(balance, 1000)}</span>
            </div>
          </div>

          {/* Fixed mobile-responsive input and button layout */}
          <div className="flex gap-2 w-full">
            <div className="w-20 sm:w-24 shrink-0">
              <Input
                type="number"
                value={pointsToRedeem}
                onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                min={0}
                max={maxPoints}
                step={POINTS_CONVERSION_RATE}
                className="w-full text-sm"
                disabled={disabled}
              />
            </div>
            <Button 
              onClick={handleApplyPoints}
              disabled={pointsToRedeem < 1000 || pointsToRedeem > balance || disabled}
              className="flex-1 min-w-0" // min-w-0 prevents flex item from overflowing
              size="default"
            >
              Apply
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Minimum redemption: 1,000 points ($5 discount)
          </p>
        </div>
      )}
    </div>
  );
};

export default PointsRedemption;
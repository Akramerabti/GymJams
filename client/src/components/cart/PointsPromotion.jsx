// components/shared/PointsPromotion.jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Lock, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const PointsPromotion = () => {
  return (
    <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Rewards Program</h3>
          </div>
          <div className="flex items-center space-x-1 text-blue-600">
            <Lock className="h-4 w-4" />
            <span className="text-xs">Exclusive for members</span>
          </div>
        </div>
        
        <p className="text-sm text-blue-700 mt-2">
          Create an account to earn points and get discounts on future purchases!
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-blue-600">
            Get <span className="font-bold">100 points</span> when you sign up!
          </div>
          <Link to="/register">
            <Button size="sm" className="text-xs flex items-center">
              <UserPlus className="h-3 w-3 mr-1" />
              Sign Up
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsPromotion;
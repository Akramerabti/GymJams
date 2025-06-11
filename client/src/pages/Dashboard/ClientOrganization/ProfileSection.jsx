// ProfileSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Edit3, Download, Badge
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const ProfileSection = ({ 
  subscription, 
  questionnaire, 
  currentTier, 
  onEditQuestionnaire, 
  onManageSubscription, 
  onUpgradeClick 
}) => {
  return (
    <div className="space-y-6">
      {/* Subscription Details */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-medium">Plan</span>
              <span className="flex items-center">
                {currentTier.icon && <span className="w-5 h-5 mr-2">{currentTier.icon}</span>}
                {currentTier.name}
              </span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-medium">Status</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {subscription?.status === 'active' ? 'Active' : subscription?.status}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-medium">Start Date</span>
              <span>{formatDate(subscription?.startDate)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-medium">Next Billing</span>
              <span>{formatDate(subscription?.currentPeriodEnd)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Auto-Renewal</span>
              <Badge 
                variant="outline" 
                className={subscription?.cancelAtPeriodEnd 
                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                  : "bg-green-50 text-green-700 border-green-200"}
              >
                {subscription?.cancelAtPeriodEnd ? 'Off' : 'On'}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onManageSubscription}
          >
            Manage Subscription
          </Button>
          {currentTier.upgrade && (
            <Button 
              onClick={onUpgradeClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upgrade Plan
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Fitness Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fitness Profile</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditQuestionnaire}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent>
          {questionnaire && questionnaire.data && Object.keys(questionnaire.data).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(questionnaire.data)
                .filter(([key, value]) => {
                  // Filter out null, undefined, empty strings, and empty arrays
                  if (value === null || value === undefined || value === '') return false;
                  if (Array.isArray(value) && value.length === 0) return false;
                  return true;
                })
                .map(([key, value]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </h3>
                    <p className="text-gray-900">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600">No fitness profile data available.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download your fitness data including workouts, progress metrics, and goals.
          </p>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;
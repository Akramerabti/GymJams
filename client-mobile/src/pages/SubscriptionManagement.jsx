import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, AlertCircle, Calendar, Crown, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import subscriptionService from '../services/subscription.service'; // Import the service

const SubscriptionManagement = () => {
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishMonthModal, setShowFinishMonthModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false); // Double-check confirmation
  const navigate = useNavigate();

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        const response = await subscriptionService.getCurrentSubscription(); // Use service function
        if (response) {
          setSubscriptionDetails(response);
        } else {
          //('No active subscription found');
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
        toast.error('Failed to load subscription details');
      }
    };

    fetchSubscriptionDetails();
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirmAction) {
      setConfirmAction(true); // Show double-check confirmation
      return;
    }
  
    setLoading(true);
    try {
      await subscriptionService.cancelSubscription(subscriptionDetails._id); // Ensure subscriptionDetails._id is correct
      toast.success('Subscription cancelled successfully. You will lose access to premium services and any points gained from this subscription.');
  
      // Redirect to /profile without forcing a page reload
      navigate('/profile');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
      setShowCancelModal(false);
      setConfirmAction(false); // Reset double-check
    }
  };

  const handleFinishMonth = async () => {
    if (!confirmAction) {
      setConfirmAction(true);
      return;
    }
  
    setLoading(true);
    try {
      // Ensure subscriptionDetails._id is being passed
      //('Subscription ID:', subscriptionDetails._id); // Debugging
      await subscriptionService.finishCurrentMonth(subscriptionDetails._id);
      toast.success('Recurring payments cancelled. You will retain access until the end of the current billing period.');
      setSubscriptionDetails({ ...subscriptionDetails, cancelAtPeriodEnd: true });
      setShowFinishMonthModal(false);
      setConfirmAction(false);
    } catch (error) {
      console.error('Failed to finish month:', error);
      toast.error(error.response?.data?.message || 'Failed to finish month');
    } finally {
      setLoading(false);
    }
  };

  // Check if within the 10-day refund period
  const isWithinRefundPeriod = () => {
    const startDate = new Date(subscriptionDetails.startDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 10;
  };

  // If subscriptionDetails is not yet fetched, show a loading state
  if (!subscriptionDetails) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-gray-600">Loading subscription details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-6 h-6 mr-2 text-yellow-500" />
              Manage Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Subscription Details */}
              <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-800">
                <h3 className="text-xl font-semibold mb-4">
                  {subscriptionDetails.subscription.charAt(0).toUpperCase() + subscriptionDetails.subscription.slice(1)} Plan
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold capitalize">{subscriptionDetails.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Start Date: <span className="font-semibold">{new Date(subscriptionDetails.startDate).toLocaleDateString()}</span>
                  </p>
                  {subscriptionDetails.endDate && (
                    <p className="text-sm text-gray-600">
                      End Date: <span className="font-semibold">{new Date(subscriptionDetails.endDate).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setShowFinishMonthModal(true)}
                  disabled={loading}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Finish Current Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Cancel Subscription</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setConfirmAction(false); // Reset double-check
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-gray-600 mb-6">
              <p>Are you sure you want to cancel your subscription?</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You will lose access to premium services.</li>
                <li>Any points gained from this subscription will be removed.</li>
                {isWithinRefundPeriod() && (
                  <li>You will be refunded for the current billing period (10-day money-back guarantee).</li>
                )}
                {!isWithinRefundPeriod() && (
                  <li>Refunds are only available within 10 days of the subscription start date.</li>
                )}
              </ul>
              {confirmAction && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-red-700">
                    <strong>Final Confirmation:</strong> Are you sure you want to cancel your subscription?
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setConfirmAction(false); // Reset double-check
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : confirmAction ? 'Confirm Cancellation' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Current Month Modal */}
      {showFinishMonthModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Finish Current Month</h3>
              <button
                onClick={() => {
                  setShowFinishMonthModal(false);
                  setConfirmAction(false); // Reset double-check
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-gray-600 mb-6">
              <p>Are you sure you want to finish the current month?</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Recurring payments will be removed.</li>
                <li>You will retain access until the end of the current billing period.</li>
              </ul>
              {confirmAction && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-red-700">
                    <strong>Final Confirmation:</strong> Are you sure you want to finish the current month?
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFinishMonthModal(false);
                  setConfirmAction(false); // Reset double-check
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinishMonth}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : confirmAction ? 'Confirm' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
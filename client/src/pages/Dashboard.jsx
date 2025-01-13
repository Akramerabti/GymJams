import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useAuth } from '../stores/authStore';
import subscriptionService from '../services/subscription.service';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to access the state
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);

  useEffect(() => {
    const checkSubscriptionAndQuestionnaire = async () => {
      try {
        setLoading(true);
        console.log('Checking subscription and questionnaire status...');

        let currentSubscription;
        const accessToken = location.state?.accessToken; // Get the access token from the location state

        if (user) {
          console.log('Checking subscription for logged-in user');
          currentSubscription = await subscriptionService.getCurrentSubscription();
        } else if (accessToken) {
          console.log('Verifying access token subscription');
          const response = await subscriptionService.verifyAccessToken(accessToken);
          currentSubscription = response.subscription;
        } else {
          toast.error('Authentication required');
          navigate('/coaching');
          return;
        }

        if (currentSubscription && currentSubscription.status === 'active') {
          setSubscription(currentSubscription);
          
          // Check questionnaire status
          try {
            const questionnaireStatus = await subscriptionService.checkQuestionnaireStatus(
              accessToken
            );
            
            console.log('Questionnaire status:', questionnaireStatus);
            
            if (questionnaireStatus.completed) {
              setHasCompletedQuestionnaire(true);
            } else {
              navigate('/questionnaire');
            }
          } catch (error) {
            console.error('Questionnaire check failed:', error);
            navigate('/questionnaire');
          }
        } else {
          toast.error('No active subscription found');
          navigate('/coaching');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        if (error.response?.status === 400 || error.response?.status === 404) {
          localStorage.removeItem('accessToken');
        }
        toast.error('Failed to verify subscription status');
        navigate('/coaching');
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionAndQuestionnaire();
  }, [user, navigate, location.state]); // Add location.state to the dependency array

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscription || !hasCompletedQuestionnaire) {
    return null;
  }

  // Now we know subscription exists and has the required properties
  const planName = subscription.type || subscription.subscription;
  const planDisplayName = planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : 'Current';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to Your Dashboard
              {user ? `, ${user.firstName}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  {planDisplayName} Plan
                </h3>
                <p className="text-gray-600 mb-4">
                  Your subscription is active until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                <Button
                  onClick={() => navigate('/subscription-management')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Manage Subscription
                </Button>
              </div>
              
              {/* Additional dashboard content here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
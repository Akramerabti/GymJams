import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore'; // Import useAuth
import subscriptionService from '../services/subscription.service';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

const Dashboard = () => {
  const { user, token } = useAuth(); // Use the useAuth hook to get the user and token
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);

  useEffect(() => {
    const checkSubscriptionAndQuestionnaire = async () => {
      try {
        setLoading(true);
        console.log('Checking subscription and questionnaire status...');
        console.log('User:', user);

        // Retrieve the token from the authStore
        if (!token) {
          toast.error('Authentication required');
          navigate('/login');
          return;
        }

        // Check if the user has an active subscription
        const subscription = await subscriptionService.getCurrentSubscription(token);
        if (subscription && subscription.status === 'active') {
          setHasSubscription(true);
        } else {
          toast.error('You need an active subscription to access the dashboard.');
          navigate('/plans');
          return;
        }

        // Check if the user has completed the questionnaire
        const questionnaireStatus = await subscriptionService.checkQuestionnaireStatus(user?._id || user?.guestEmail, token);
        if (questionnaireStatus.completed) {
          setHasCompletedQuestionnaire(true);
        } else {
          navigate('/questionnaire');
        }
      } catch (error) {
        console.error('Error checking subscription or questionnaire:', error);
        toast.error('Failed to verify subscription or questionnaire status.');
        navigate('/plans');
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionAndQuestionnaire();
  }, [user, token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasSubscription || !hasCompletedQuestionnaire) {
    return null; // Redirects will handle this
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white sm:text-xl">
              Welcome to Your Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-200">
                Here you can manage your subscription, track your progress, and access exclusive content.
              </p>
              <Button
                onClick={() => navigate('/subscription')}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
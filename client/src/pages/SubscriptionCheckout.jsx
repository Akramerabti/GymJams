import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../stores/authStore';
import PaymentForm from './PaymentForm.jsx';
import subscriptionService from '../services/subscription.service.js';
import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29.99,
    pointsPerMonth: 100,
    features: [
      'Basic training plan',
      'Monthly plan updates',
      'Email support',
      '100 points monthly',
    ],
    color: 'bg-white',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49.99,
    pointsPerMonth: 200,
    features: [
      'Advanced training plan',
      'Nutrition guidance',
      'Weekly plan updates',
      'Priority support',
      '200 points monthly',
    ],
    color: 'bg-blue-50',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99.99,
    pointsPerMonth: 500,
    features: [
      'Custom training plan',
      'Personalized nutrition plan',
      'Weekly video consultations',
      '24/7 support',
      '500 points monthly',
    ],
    color: 'bg-white',
  },
];

const SubscriptionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(
    location.state?.plan || PLANS[0]
  );

  useEffect(() => {
    const initializePayment = async () => {
      if (!currentPlan) {
        navigate('/plans');
        return;
      }

      try {
        setLoading(true);
        const { clientSecret } = await subscriptionService.createPaymentIntent(currentPlan);
        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Payment initialization failed:', err);
        setError('Failed to initialize payment');
        toast.error('Could not initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [currentPlan, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => navigate('/plans')} className="w-full">
                Return to Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentPlan) {
    return null;
  }

  const getNextPlan = () => {
    const currentPlanIndex = PLANS.findIndex((plan) => plan.id === currentPlan.id);
    const nextPlanIndex = (currentPlanIndex + 1) % PLANS.length;
    return PLANS[nextPlanIndex];
  };

  const nextPlan = getNextPlan();

  const handleUpgradePlan = () => {
    setCurrentPlan(nextPlan);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/coaching')}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
          variant="ghost"
        >
          <FaArrowLeft className="mr-2" />
          Back to Coaching
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white sm:text-xl">
              Complete Your Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:grid md:grid-cols-3 gap-6 sm:gap-4">
              <div className="col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700 sm:p-4">
                <h2 className="text-2xl font-bold text-white mb-6 sm:text-xl sm:mb-4">
                  Order Summary
                </h2>
                <div className="space-y-6 sm:space-y-4">
                  <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 sm:p-4">
                    <h3 className="font-semibold text-xl mb-4 text-white sm:text-lg sm:mb-3">
                      {currentPlan.name} Plan
                    </h3>
                    <p className="text-gray-200 mb-6 sm:text-sm sm:mb-4">
                      ${currentPlan.price.toFixed(2)}/month
                    </p>
                    <ul className="space-y-3 sm:space-y-2">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          <span className="text-gray-200 sm:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 sm:p-4">
                    <div className="flex justify-between mb-3 sm:mb-2">
                      <span className="text-gray-200 sm:text-sm">Subtotal</span>
                      <span className="text-white sm:text-sm">${currentPlan.price.toFixed(2)}</span>
                    </div>
                    {user?.promoCode && (
                      <div className="flex justify-between mb-3 text-green-400 sm:text-sm sm:mb-2">
                        <span>Promo discount</span>
                        <span>-${(currentPlan.price * 0.1).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-600 sm:text-base sm:pt-2">
                      <span className="text-white">Total per month</span>
                      <span className="text-white">
                        ${(user?.promoCode ? currentPlan.price * 0.9 : currentPlan.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {currentPlan.id !== 'elite' && (
                    <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 sm:p-4">
                      <Button
                        onClick={handleUpgradePlan}
                        className="w-full bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Upgrade to {nextPlan.name} Plan (${nextPlan.price.toFixed(2)}/month)
                      </Button>
                    </div>
                  )}

                  <div className="bg-blue-900 p-6 rounded-lg border border-blue-800 sm:p-4">
                    <p className="text-blue-200 text-sm sm:text-xs">
                      🛡️ 10-day money-back guarantee. Cancel anytime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                {clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0077FF',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      plan={currentPlan}
                      clientSecret={clientSecret}
                      onSuccess={async (setupIntentId, paymentMethodId, email) => {
                        try {
                          // Get email correctly from user object
                          const userEmail = email || undefined;
                          console.log('Handling subscription with:', {
                            planType: currentPlan.id,
                            setupIntentId,
                            paymentMethodId,
                            email: userEmail
                          });
                          
                          await subscriptionService.handleSubscriptionSuccess(
                            currentPlan.id,
                            setupIntentId,
                            paymentMethodId,
                            userEmail
                          );
                          window.location.reload();
                        } catch (error) {
                          console.error('Subscription error:', error);
                          toast.error(error.message || 'Failed to activate subscription');
                        }
                      }}
                      onError={(error) => {
                        console.error('Payment error:', error);
                        toast.error(error || 'Payment failed');
                      }}
                    />
                  </Elements>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
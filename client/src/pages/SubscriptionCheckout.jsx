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
import { useTheme } from '../contexts/ThemeContext.jsx';
import PaymentForm from './PaymentForm.jsx';
import subscriptionService from '../services/subscription.service.js';
import { FaArrowLeft, FaCheck, FaShieldAlt } from 'react-icons/fa';
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
    color: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
    borderColor: 'border-gray-200 dark:border-gray-700',
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
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800',
    borderColor: 'border-blue-200 dark:border-blue-700',
    recommended: true,
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
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800',
    borderColor: 'border-purple-200 dark:border-purple-700',
  },
];

const SubscriptionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(
    location.state?.plan || PLANS[1] // Default to Premium
  );
  const [promoStatus, setPromoStatus] = useState(null);
  const [promoCodeInputKey, setPromoCodeInputKey] = useState(0);

  useEffect(() => {
    const initializePayment = async () => {
      if (!currentPlan) {
        navigate('/');
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

  const getDiscountedPrice = () => {
    if (promoStatus && promoStatus.valid && promoStatus.discount) {
      return (currentPlan.price * (1 - promoStatus.discount / 100)).toFixed(2);
    }
    return currentPlan.price.toFixed(2);
  };

  const getNextPlan = () => {
    const currentPlanIndex = PLANS.findIndex((plan) => plan.id === currentPlan.id);
    const nextPlanIndex = (currentPlanIndex + 1) % PLANS.length;
    return PLANS[nextPlanIndex];
  };

  const nextPlan = getNextPlan();

  const handleUpgradePlan = () => {
    setCurrentPlan(nextPlan);
    setPromoStatus(null);
    setPromoCodeInputKey(prev => prev + 1);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900' 
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/coaching')}
            className={`mb-4 flex items-center text-sm transition-all duration-200 ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            variant="ghost"
          >
            <FaArrowLeft className="mr-2" />
            Back to Coaching
          </Button>
          
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Complete Your Subscription
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Secure checkout · Cancel anytime · Instant access
          </p>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Order Summary - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2">
            <Card className={`shadow-xl border-0 overflow-hidden ${
              darkMode 
                ? 'bg-gray-800' 
                : 'bg-white'
            }`}>
              <CardHeader className={`${
                darkMode 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-white'
              } border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <CardTitle className={`text-xl sm:text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                {/* Selected Plan */}
                <div className={`rounded-xl p-6 mb-6 ${currentPlan.color} ${currentPlan.borderColor} border-2 relative overflow-hidden`}>
                  {currentPlan.recommended && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                      RECOMMENDED
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {currentPlan.name} Plan
                      </h3>
                      <div className="flex items-baseline mt-2">
                        <span className={`text-3xl font-bold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          ${currentPlan.price}
                        </span>
                        <span className={`text-base ml-1 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          /month
                        </span>
                      </div>
                    </div>
                    {currentPlan.pointsPerMonth && (
                      <div className={`text-center px-4 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700/50' 
                          : 'bg-white/70'
                      }`}>
                        <div className={`text-2xl font-bold ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {currentPlan.pointsPerMonth}
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          points/mo
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-3">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <FaCheck className={`mr-3 flex-shrink-0 ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`} />
                        <span className={`${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing Breakdown */}
                <div className={`rounded-lg p-6 mb-6 ${
                  darkMode 
                    ? 'bg-gray-700/50 border border-gray-600' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Subtotal
                      </span>
                      <span className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        ${currentPlan.price.toFixed(2)}
                      </span>
                    </div>
                    
                    {promoStatus && promoStatus.valid && (
                      <div className="flex justify-between text-green-500">
                        <span>Promo discount ({promoStatus.discount}% off)</span>
                        <span>
                          -${(currentPlan.price * (promoStatus.discount / 100)).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex justify-between text-lg font-bold pt-3 border-t ${
                      darkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        Total per month
                      </span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        ${getDiscountedPrice()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Option */}
                {currentPlan.id !== 'elite' && (
                  <div className={`rounded-lg p-4 mb-6 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700' 
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                  }`}>
                    <p className={`text-sm mb-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Want more features? Upgrade to get additional benefits!
                    </p>
                    <Button
                      onClick={handleUpgradePlan}
                      className={`w-full ${
                        darkMode 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                      } text-white transition-all duration-200`}
                    >
                      Upgrade to {nextPlan.name} Plan (${nextPlan.price}/month)
                    </Button>
                  </div>
                )}

                {/* Security Badge */}
                <div className={`rounded-lg p-4 text-center ${
                  darkMode 
                    ? 'bg-gray-700/30 border border-gray-600' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <FaShieldAlt className={`text-lg ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      10-day, 40% money-back guarantee · Cancel anytime
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form - Full width on mobile, 1 col on desktop */}
          <div className="lg:col-span-1">
            <div className={`sticky top-8 rounded-xl shadow-xl border-0 overflow-hidden ${
              darkMode 
                ? 'bg-gray-800' 
                : 'bg-white'
            }`}>
              <div className={`px-6 py-4 ${
                darkMode 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-white border-b border-gray-100'
              }`}>
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Payment Details
                </h3>
              </div>
              
              <div className="p-6">
                {clientSecret && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: darkMode ? 'night' : 'stripe',
                        variables: {
                          colorPrimary: '#3B82F6',
                          colorBackground: darkMode ? '#1F2937' : '#FFFFFF',
                          colorText: darkMode ? '#FFFFFF' : '#1F2937',
                          colorDanger: '#EF4444',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          spacingUnit: '4px',
                          borderRadius: '8px',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      key={promoCodeInputKey}
                      plan={currentPlan}
                      clientSecret={clientSecret}
                      darkMode={darkMode}
                      onSuccess={async (setupIntentId, paymentMethodId, email, promoCode) => {
                        try {
                          await subscriptionService.handleSubscriptionSuccess(
                            currentPlan.id,
                            setupIntentId,
                            paymentMethodId,
                            email || user?.email,
                            promoCode
                          );
                          navigate('/dashboard');
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
                      promoStatus={promoStatus}
                      onPromoStatusChange={setPromoStatus}
                    />
                  </Elements>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
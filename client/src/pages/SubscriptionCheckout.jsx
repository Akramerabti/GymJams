import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Check, Shield, Loader } from 'lucide-react';
import subscriptionService from '../services/subscription.service';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Define the hierarchy of plans
const planHierarchy = {
  basic: 'premium',
  premium: 'elite',
  elite: null, // No upgrade available for Elite
};

// Helper function to get the plan details by ID
const getPlanById = (planId) => {
  const plans = {
    basic: {
      id: '65f4c5f8e4b0a1a2b3c4d5e6',
      name: 'Basic',
      price: 29.99,
      pointsPerMonth: 100,
      features: [
        'Basic training plan',
        'Monthly plan updates',
        'Email support',
        '100 points monthly',
      ],
    },
    premium: {
      id: '65f4c5f8e4b0a1a2b3c4d5e7',
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
    },
    elite: {
      id: '65f4c5f8e4b0a1a2b3c4d5e8',
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
    },
  };
  return plans[planId];
};

const PaymentForm = ({ plan, onSuccess, onError, userDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not available');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment method
      const { error: elementError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (elementError) {
        throw new Error(elementError.message);
      }

      // Create subscription
      const subscriptionData = {
        planId: plan.id,
        paymentMethodId: paymentMethod.id,
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        phone: userDetails.phone,
      };

      console.log('Subscription Data Sent:', subscriptionData); // Debug: Log the subscription data

      const result = await subscriptionService.createSubscription(subscriptionData);
      onSuccess(result);
    } catch (error) {
      console.error('Subscription error:', error);
      onError(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-1 text-green-500" />
            Secure Payment
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <Loader className="animate-spin mr-2" />
            Processing...
          </span>
        ) : (
          `Subscribe for $${plan.price}/month`
        )}
      </Button>
    </form>
  );
};

const SubscriptionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { plan } = location.state || {};
  const { user } = useAuth(); // Get the user's authentication status
  const [userDetails, setUserDetails] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  // If plan is not available, show an error message
  if (!plan || !plan.features) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Plan Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              No subscription plan selected. Please choose a plan to continue.
            </p>
            <Button
              onClick={() => navigate('/')} // Redirect to the home page or another appropriate route
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePaymentSuccess = (result) => {
    setPaymentStatus('success');
    toast.success('Subscription activated successfully!');
    setTimeout(() => {
      navigate('/questionnaire', { state: { plan } });
    }, 2000);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('error');
    toast.error(error);
  };

  // Function to handle upgrade to the next plan
  const handleUpgrade = () => {
    const nextPlanId = planHierarchy[plan.id]; // Get the next plan ID
    if (nextPlanId) {
      const nextPlan = getPlanById(nextPlanId); // Get the next plan details
      navigate('/subscription-checkout', { state: { plan: nextPlan } }); // Redirect to the next plan
    } else {
      toast.info('You are already on the highest plan.');
    }
  };

  // Handle input change for user details
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to:`, value); // Debug: Log the input change
    setUserDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Elements stripe={stripePromise}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Payment Form */}
            <div className="w-full lg:w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Purchase</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Show user details form if user is not logged in */}
                  {!user && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold">Enter Your Details</h3>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={userDetails.email}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={userDetails.firstName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={userDetails.lastName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="text"
                        name="phone"
                        placeholder="Phone"
                        value={userDetails.phone}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  )}
                  <PaymentForm
                    plan={plan}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    userDetails={user ? { email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone } : userDetails}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Plan Summary */}
            <div className="w-full lg:w-3/4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-blue-600 mb-2">
                        {plan.name} Plan
                      </h2>
                      <p className="text-xl">${plan.price}/month</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Features:</h3>
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Monthly Points Highlight (only show if user is logged in) */}
                    {user && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600 mb-2">Monthly Points:</span>
                          <span className="text-blue-600 font-bold">
                            {plan.pointsPerMonth} points
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Upgrade Button (only show if not Elite plan) */}
                    {plan.id !== 'elite' && (
                      <Button
                        onClick={handleUpgrade}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Upgrade to {planHierarchy[plan.id] === 'elite' ? 'Elite' : 'Premium'} Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Elements>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
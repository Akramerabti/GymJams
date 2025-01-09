import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Check, Shield, Loader } from 'lucide-react';
import subscriptionService from '../services/subscription.service';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import paymentService from '../services/payment.service';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Define the hierarchy of plans
const planHierarchy = {
  Basic: 'premium',
  Premium: 'elite',
  Elite: null,
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

const PaymentForm = ({ plan, onSuccess, onError, paymentMethods }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system not available');
      return;
    }

    setIsProcessing(true);

    try {
      // If the user selects Apple Pay or Google Pay, use the Payment Request API
      if (selectedPaymentMethod === 'wallet') {
        const paymentRequest = stripe.paymentRequest({
          country: 'US',
          currency: 'usd',
          total: {
            label: plan.name,
            amount: Math.round(plan.price * 100), // Amount in cents
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        const paymentResponse = await paymentRequest.show();
        const { paymentIntent } = await stripe.confirmPaymentIntent(paymentResponse.paymentIntent.id, {
          payment_method: paymentResponse.paymentMethod.id,
        });

        if (paymentIntent.status === 'succeeded') {
          onSuccess(paymentIntent);
        } else {
          throw new Error('Payment failed');
        }
      } else {
        // Use the selected saved payment method
        const result = await subscriptionService.createSubscription({
          planId: plan.id,
          paymentMethodId: selectedPaymentMethod,
        });
        onSuccess(result);
      }
    } catch (error) {
      console.error('Payment error:', error);
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

        {/* Dropdown for saved payment methods */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select Payment Method</label>
          <select
            value={selectedPaymentMethod || ''}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="" disabled>
              Choose a payment method
            </option>
            {paymentMethods.map((method) => (
              <option key={method._id} value={method._id}>
                {method.type === 'credit_card'
                  ? `Credit Card (**** **** **** ${method.cardNumber.slice(-4)})`
                  : method.type === 'paypal'
                  ? `PayPal (${method.paypalEmail})`
                  : `Bank Transfer (${method.bankAccount.accountNumber})`}
              </option>
            ))}
            <option value="wallet">Pay with Apple Pay or Google Pay</option>
          </select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !selectedPaymentMethod}
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
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [userDetails, setUserDetails] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Fetch the user's saved payment methods
  useEffect(() => {
    if (user) {
      paymentService
        .getPaymentMethods(user.user._id)
        .then((methods) => setPaymentMethods(methods))
        .catch((error) => {
          console.error('Failed to fetch payment methods:', error);
          toast.error('Failed to fetch payment methods. Please try again.');
        });
    }
  }, [user]);

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
              onClick={() => navigate('/')}
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
    const nextPlanName = planHierarchy[plan.name]; // Get the next plan name (e.g., 'premium')
  
    if (nextPlanName) {
      const nextPlan = getPlanById(nextPlanName); // Get the next plan details
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
                    paymentMethods={paymentMethods}
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
                    {plan.id !== '65f4c5f8e4b0a1a2b3c4d5e8' && (
                        <Button
                          onClick={handleUpgrade}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {plan.name === 'Basic' && 'Upgrade to Premium Plan'}
                          {plan.name === 'Premium' && 'Upgrade to Elite Plan'}
                          {plan.name === 'Elite' && 'You are on the highest plan'}
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
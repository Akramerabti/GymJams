import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import subscriptionService from '../services/subscription.service';

const PaymentForm = ({ plan, clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !isChecked) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/success',
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        await subscriptionService.handleSubscriptionSuccess(
          plan.id,
          paymentIntent.id,
          user ? user.user.email : guestEmail
        );

        onSuccess();
      }
    } catch (err) {
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-100">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Payment Methods
        </label>
        <div className="p-2 sm:p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      {!user && (
        <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-100">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Guest Email
          </label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg text-gray-800"
            placeholder="Enter your email"
            required
          />
        </div>
      )}

      <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Secure Payment</span>
      </div>

      <div className="flex items-center">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="form-checkbox h-4 w-4 text-primary rounded border-gray-300"
          />
          <span className="text-xs sm:text-sm text-gray-400">
            I agree to the{' '}
            <span
              className="text-primary hover:underline cursor-pointer text-blue-800"
              onClick={() => setShowTerms(true)}
            >
              Terms of Service
            </span>
          </span>
        </label>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Terms of Service</h3>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              <p className="mb-4">By subscribing to our service, you agree to the following terms:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>You will be billed monthly for the subscription.</li>
                <li>You can cancel your subscription at any time.</li>
                <li>No refunds are provided for partial subscription periods.</li>
                <li>We reserve the right to change the terms at any time.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isLoading || !isChecked || (!user && !guestEmail)}
        className="w-full bg-primary text-white py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-xs sm:text-sm font-semibold 
                 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : `Pay $${plan.price.toFixed(2)}`}
      </button>

      <p className="text-center text-xs sm:text-sm text-gray-400">
        Need help?{' '}
        <a href="/contact" className="text-primary hover:underline text-blue-800">
          Contact us
        </a>
      </p>
    </form>
  );
};

export default PaymentForm;
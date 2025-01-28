import React, { useState, useRef } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { useAuth } from '../stores/authStore';
import subscriptionService from '../services/subscription.service';
import { useNavigate } from 'react-router-dom';


const PaymentForm = ({ plan, clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const navigate = useNavigate();
  const submittedRef = useRef(false);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (isLoading || !stripe || !elements || !isChecked || submittedRef.current) {
      return;
    }
  
    setIsLoading(true);
    submittedRef.current = true;
  
    try {
      const emailer = user?.user?.email || user?.email;
      const email = emailer || guestEmail;
      console.log('Using email:', email);

      if (!email) {
        throw new Error('Email is required');
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message);
        return;
      }
  
      // Confirm the SetupIntent
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
          payment_method_data: {
            billing_details: {
              email: email,
            },
          },
        },
        redirect: 'if_required',
      });
  
      if (setupError) {
        onError(setupError.message);
        submittedRef.current = false;
        return;
      }
  
      // Handle both 'succeeded' and non-action-required cases
      if (setupIntent.status === 'succeeded' || 
          (setupIntent.status === 'requires_payment_method' && !setupIntent.next_action)) {
        console.log('Setup completed successfully:', setupIntent.id);
        await onSuccess(setupIntent.id, setupIntent.payment_method, email);
        return;
      }
  
      // Handle cases requiring additional action
      if (setupIntent.status === 'requires_action') {
        const { error: actionError } = await stripe.confirmPayment({
          clientSecret: setupIntent.client_secret,
          elements,
          confirmParams: {
            return_url: window.location.origin + '/dashboard',
          },
        });
  
        if (actionError) {
          onError(actionError.message);
          submittedRef.current = false;
          return;
        }
      }

    } catch (err) {
      console.error('Setup error:', err);
      onError(err.message || 'An unexpected error occurred. Please try again.');
      submittedRef.current = false;
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
              className="text-blue-700 hover:underline cursor-pointer"
              onClick={() => setShowTerms(true)}
            >
              Terms of Service
            </span>
          </span>
        </label>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] p-4 sm:p-6 relative flex flex-col">
          <div className="flex justify-between items-center sticky top-0 bg-white z-10 pb-2">
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
          
          <div 
            className="text-xs sm:text-sm text-gray-600 space-y-6 overflow-y-auto pr-4 scrollbar-thin" 
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #EDF2F7',
            }}
          >
            <style jsx global>{`
              .scrollbar-thin::-webkit-scrollbar {
                width: 8px;
              }
              
              .scrollbar-thin::-webkit-scrollbar-track {
                background: #EDF2F7;
                border-radius: 4px;
              }
              
              .scrollbar-thin::-webkit-scrollbar-thumb {
                background-color: #CBD5E0;
                border-radius: 4px;
                border: 2px solid #EDF2F7;
              }
              
              .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                background-color: #A0AEC0;
              }
            `}</style>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">1. Subscription Agreement</h4>
              <p>By subscribing to our service ("Service"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). Please read these Terms carefully before subscribing.</p>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">2. Billing and Payment</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>You will be billed monthly according to your selected subscription plan. All fees are payable in advance.</li>
                <li>Your subscription will automatically renew each month unless canceled.</li>
                <li>We reserve the right to modify pricing with 30 days advance notice.</li>
              </ul>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">3. Cancellation and Refunds</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>You may cancel your subscription any time through profile settings. </li>
                <li>You may decide to end recurring payments by finishing the current month.</li>
                <li>40% refunds are provided within 10 days of initial subscription.</li>
                <li>No refunds are issued for partial subscription periods after the 10-day cooling-off period.</li>
                <li>Points or benefits from refunded periods will be forfeited.</li>
              </ul>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">4. Service Modifications</h4>
              <p>We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time. We will provide reasonable notice of material changes that may adversely affect your use.</p>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">5. Account Management</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>You are responsible for maintaining account credential confidentiality.</li>
                <li>All activities under your account are your responsibility.</li>
                <li>We may suspend accounts that violate these Terms.</li>
              </ul>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">6. Points System</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Points are forfeited upon refund-eligible cancellations.</li>
                <li>Points are utilities for benefits within the website.</li>
              </ul>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">7. Liability</h4>
              <p>To the maximum extent permitted by law, we shall not be liable for indirect, incidental, or consequential damages, including loss of data, profits, or service interruptions.</p>
            </section>
  
            <section>
              <h4 className="font-semibold text-gray-800 mb-2">8. Terms Updates</h4>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>We reserve the right to modify these Terms at any time.</li>
                <li>Material changes will be notified via email.</li>
                <li>Continued use after changes constitutes acceptance.</li>
              </ul>
            </section>
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
        <a href="/contact" className="hover:underline text-blue-700">
          Contact us
        </a>
      </p>
    </form>
  );
};

export default PaymentForm;
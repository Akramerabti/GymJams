import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../services/api';

const EmailVerificationNotification = () => {
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Use useLocation to get the query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(current => current - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    try {
      setError('');
      setSuccess(false);
      
      // Call the resend verification endpoint
      await api.post('/auth/resend-verification', { email });
      
      // Start cooldown and show success message
      setCooldown(30);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    }
  };

  if (!email) {
    window.location.href = '/register';
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Check your email
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            We sent a verification link to
            <span className="font-medium text-gray-900 block mt-1">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-500 p-3 rounded-md text-sm mb-4">
            Verification email sent successfully!
          </div>
        )}

        <button
          onClick={handleResendEmail}
          disabled={cooldown > 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {cooldown > 0 
            ? `Resend email (${cooldown}s)` 
            : 'Resend verification email'
          }
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          Having trouble? Contact our support team.
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationNotification;

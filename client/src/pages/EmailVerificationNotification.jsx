import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth.service'; // Correct import

const EmailVerificationNotification = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleResendEmail = async () => {
    try {
      await authService.resendVerificationEmail(email); // Use the function
      setMessage('Verification email resent successfully!');
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email Address
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            A verification email has been sent to your email address. Please check your inbox and click the link to verify your account.
          </p>
        </div>
        <div className="flex justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleResendEmail}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Resend Verification Email
          </button>
        </div>
        {message && (
          <p className="mt-2 text-center text-sm text-green-600">{message}</p>
        )}
        <div className="text-center">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationNotification;
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore'; // Import the Zustand store

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const token = searchParams.get('token');
  const { verifyEmail, setUser, setToken } = useAuthStore(); // Use verifyEmail from the store
  const isExecuted = useRef(false); // Use a ref to track execution

  useEffect(() => {
    if (isExecuted.current) return; // Prevent duplicate calls
    isExecuted.current = true;

    const handleVerifyEmail = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Call the verifyEmail function from the Zustand store
        const response = await verifyEmail(token);

        // Ensure the response contains user and token
        const { user, token: authToken } = response;
        if (!user || !authToken) {
          throw new Error('User or token missing in response');
        }

        setUser(user);
        setToken(authToken);

        // Update status to success
        setStatus('success');

        // Redirect to the home page after a short delay
        setTimeout(() => {
          window.location.replace('/');
        }, 4000); // 2-second delay before redirecting
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    handleVerifyEmail();
  }, [token, navigate, verifyEmail, setUser, setToken]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg">Verifying your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-semibold">Email Verified!</h2>
            <p className="text-center text-gray-600">
              Your email has been successfully verified. You are now logged in.
            </p>
            <Button 
              className="w-full" 
              onClick={() => window.location.replace('/')}
            >
              Go to Home
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-2xl font-semibold">Verification Failed</h2>
            <p className="text-center text-gray-600">
              The verification link is invalid or has expired. Please request a new verification email.
            </p>
            <Button 
              className="w-full" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;

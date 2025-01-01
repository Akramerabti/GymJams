import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../stores/authStore';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const token = searchParams.get('token');
  const { setUser, setToken } = useAuthStore();
  const isExecuted = useRef(false); // Use a ref to track execution

  useEffect(() => {
    if (isExecuted.current) return; // Prevent duplicate calls
    isExecuted.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Verify the email and fetch user data
        const response = await api.get(`/auth/verify-email/${token}`);
        console.log('Verification response:', response.data); // Log the response

        // Ensure the response contains user and token
        const { user, token: authToken } = response.data;
        if (!user || !authToken) {
          throw new Error('User or token missing in response');
        }

        // Set the user's authentication state
        console.log('Setting user:', user); // Log the user
        console.log('Setting token:', authToken); // Log the token
        setUser(user);
        setToken(authToken);

        // Redirect to the home page
        console.log('Redirecting to home page...'); // Log the redirection
        navigate('/');
        window.location.reload(); // Force a page refresh
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token, navigate, setUser, setToken]);

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
              onClick={() => navigate('/')}
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
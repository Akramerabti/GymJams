import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [showFullScreenSuccess, setShowFullScreenSuccess] = useState(false);
  const token = searchParams.get('token');
  const { verifyEmail, setUser, setToken } = useAuthStore();
  const isExecuted = useRef(false);

  useEffect(() => {
    if (isExecuted.current) return;
    isExecuted.current = true;

    const handleVerifyEmail = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        const response = await verifyEmail(token);

        const { user, token: authToken } = response;
        if (!user || !authToken) {
          throw new Error('User or token missing in response');
        }

        setUser(user);
        setToken(authToken);
        
        // Set enhanced persistence flags (same as MobileGatekeeper)
        localStorage.setItem('hasCompletedOnboarding', 'true');
        localStorage.setItem('userLoginMethod', 'email_verification');
        localStorage.setItem('persistentLogin', 'true');

        setStatus('success');

        // Show the full screen success animation
        setTimeout(() => {
          setShowFullScreenSuccess(true);
        }, 1000);

        // Redirect after showing success screen
        setTimeout(() => {
          window.location.replace('/');
        }, 4000);

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
      }
    };

    handleVerifyEmail();
  }, [token, navigate, verifyEmail, setUser, setToken]);

  // Full Screen Success Component (same style as MobileGatekeeper)
  const FullScreenSuccess = () => (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 overflow-hidden">
      <div className="h-full flex items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            className="text-3xl font-black text-white mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Welcome to GymTonic!
          </motion.h1>

          <motion.p
            className="text-lg text-green-200 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Email verified successfully!
          </motion.p>

          <motion.p
            className="text-emerald-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Get ready to transform your fitness journey
          </motion.p>
        </motion.div>
      </div>
    </div>
  );

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
          <motion.div 
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-semibold">Email Verified!</h2>
            <p className="text-center text-gray-600">
              Your email has been successfully verified. Redirecting you to the app...
            </p>
            <motion.div 
              className="w-full bg-green-100 rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3 }}
            >
              <div className="bg-green-500 h-2 rounded-full w-full"></div>
            </motion.div>
          </motion.div>
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

  // Show full screen success if status is success and showFullScreenSuccess is true
  if (showFullScreenSuccess) {
    return <FullScreenSuccess />;
  }

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
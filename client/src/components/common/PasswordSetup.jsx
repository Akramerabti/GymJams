import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Key, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const PasswordSetup = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  
  const email = searchParams.get('email');

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(current => current - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSendPasswordSetupEmail = async () => {
    if (!email) {
      toast.error('No email provided');
      return;
    }

    setLoading(true);
    try {
      // Use the existing forgot password endpoint
      await api.post('/auth/forgot-password', { email });
      
      setEmailSent(true);
      setCooldown(60); // 60 second cooldown
      toast.success('Password setup email sent!');
    } catch (error) {
      console.error('Error sending password setup email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-6">
            <p className="text-red-500">Invalid setup link. Please try logging in again.</p>
            <Button
              onClick={() => navigate('/login')}
              className="mt-4"
              variant="secondary"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              We sent a password setup link to:
            </p>
            <p className="font-medium text-gray-900">{email}</p>
            <p className="text-sm text-gray-500">
              Click the link in the email to create your password. If you don't see it, check your spam folder.
            </p>
            
            <div className="pt-4">
              <Button
                onClick={handleSendPasswordSetupEmail}
                disabled={cooldown > 0 || loading}
                variant="outline"
                className="w-full"
              >
                {cooldown > 0 
                  ? `Resend email (${cooldown}s)` 
                  : loading 
                    ? 'Sending...' 
                    : 'Resend setup email'
                }
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Your account <strong>{email}</strong> was created using Google sign-in.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              To also be able to login with email and password, we'll send you a secure link to set up your password.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• We'll send you a secure setup link via email</li>
              <li>• Click the link to create your password</li>
              <li>• You can then login with either Google or email/password</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="space-y-2">
          <Button
            onClick={handleSendPasswordSetupEmail}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending Setup Email...' : 'Send Password Setup Email'}
          </Button>
          
          <Button
            onClick={() => navigate('/login')}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PasswordSetup;
// client/src/pages/OAuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Phone } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../services/api';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken, user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  
  // Extract token from URL
  const urlParams = new URLSearchParams(location.search);
  const authToken = urlParams.get('token');
  
  // Extract error if any
  const errorParam = urlParams.get('error');
  
  useEffect(() => {
    // Handle authentication with the token from OAuth provider
    const authenticateWithToken = async () => {
      if (!authToken) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }
      
      try {
        // Attempt to login with the token
        const data = await loginWithToken(authToken);
        
        // Check if phone number needs to be added
        if (data?.user && (!data.user.phone || data.user.phone === '')) {
          setNeedsPhone(true);
          setLoading(false);
          return;
        }
        
        // Successful login
        toast.success('Successfully logged in!');
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error.message || 'Authentication failed');
        setLoading(false);
      }
    };
    
    // Handle error parameter
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setLoading(false);
      return;
    }
    
    authenticateWithToken();
  }, [authToken, loginWithToken, navigate, errorParam]);
  
  // Basic phone number validation
  const validatePhone = (phoneNumber) => {
    // Allow various phone formats but ensure it has at least 10 digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return 'Please enter a valid phone number (at least 10 digits)';
    }
    return '';
  };
  
  // Handle phone number submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone
    const validationError = validatePhone(phone);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.post('/auth/complete-oauth-profile', {
        phone: phone
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.user) {
        toast.success('Profile completed successfully!');
        navigate('/');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Phone submission error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      setPhoneError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // If still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 shadow-lg">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
            <p className="text-gray-500 text-center">Please wait while we log you in</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If there was an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 shadow-lg">
          <CardContent className="flex flex-col items-center py-8">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-gray-500 text-center mb-6">{error}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If needs phone number
  if (needsPhone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              One Last Step
            </CardTitle>
          </CardHeader>
          
          <CardContent className="py-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <p className="text-gray-600 text-center mb-6">
              To complete your profile, please provide your phone number. This helps us ensure account security and provide you with better service.
            </p>
            
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="(555) 123-4567"
                  className={`w-full ${phoneError ? 'border-red-500' : ''}`}
                  required
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-500">{phoneError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="justify-center">
            <p className="text-xs text-gray-500">
              Your information is securely stored and will not be shared with third parties.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Fallback (shouldn't reach here normally)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p>Redirecting to home page...</p>
    </div>
  );
};

export default OAuthCallback;
// Fixed OAuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import CompleteOAuthProfile from '../components/auth/CompleteOAuthProfile';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [missingFields, setMissingFields] = useState({
    phone: false,
    lastName: false
  });

  // Extract token and params from URL
  const urlParams = new URLSearchParams(location.search);
  const authToken = urlParams.get('token');
  const tempToken = urlParams.get('tempToken');
  const isIncomplete = urlParams.get('incomplete') === 'true';
  
  // Extract error if any
  const errorParam = urlParams.get('error');

  // Handle profile completion success
  const handleProfileComplete = (completedUser) => {
    console.log('✅ Profile completion successful:', completedUser);
    setNeedsCompletion(false); // This is the key fix - set to false
    
    // Navigate to home page
    navigate('/');
  };

  // Handle user update from profile completion
  const handleUserUpdate = (updatedUser) => {
    console.log('🔄 User updated:', updatedUser);
    setCurrentUser(updatedUser);
  };

  useEffect(() => {
    // Handle authentication with the token from OAuth provider
    const authenticateWithToken = async () => {
      // Handle temporary token case (new user needs to complete profile)
      if (tempToken && isIncomplete) {
        try {
          console.log('🔧 Temporary token found, needs completion');
          // For temporary tokens, we need to determine what fields are missing
          // The CompleteOAuthProfile component will handle the tempToken
          setCurrentUser({ tempToken }); // Pass the temp token through
          setMissingFields({
            phone: true,  // Always need phone for new OAuth users
            lastName: true // Always need lastName for new OAuth users
          });
          setNeedsCompletion(true);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Temporary token handling error:', error);
          setError('Failed to process authentication data');
          setLoading(false);
          return;
        }
      }

      // Handle regular token case (existing user or complete profile)
      if (authToken) {
        try {
          console.log('🔑 Regular auth token found');
          await loginWithToken(authToken);
          toast.success('Login successful!');
          navigate('/');
        } catch (error) {
          console.error('Authentication error:', error);
          setError('Authentication failed');
        }
      }

      // Handle error case
      if (errorParam) {
        console.error('OAuth error:', errorParam);
        setError(`OAuth error: ${errorParam}`);
        toast.error('OAuth authentication failed');
        navigate('/login');
        return;
      }

      // If no token at all, redirect to login
      if (!tempToken && !authToken) {
        console.log('❌ No authentication tokens found');
        navigate('/login');
        return;
      }

      setLoading(false);
    };

    authenticateWithToken();
  }, [location.search, loginWithToken, navigate, authToken, tempToken, isIncomplete, errorParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-gray-600">Completing authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/login')}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render profile completion if needed
  if (needsCompletion) {
    return (
      <CompleteOAuthProfile
        user={currentUser}
        token={token}
        missingFields={missingFields}
        onComplete={handleProfileComplete} // Pass the fixed callback
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mb-4 mx-auto" />
          <p className="text-gray-600">Redirecting...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
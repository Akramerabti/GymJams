// client/src/pages/OAuthCallback.jsx
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

  useEffect(() => {
    // Handle authentication with the token from OAuth provider
    const authenticateWithToken = async () => {
      // Handle temporary token case (new user needs to complete profile)
      if (tempToken && isIncomplete) {
        try {
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

      // Handle regular authentication token
      if (!authToken) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }
      
      try {
        // Attempt to login with the token
        const data = await loginWithToken(authToken);
        
        // Check if profile completion is needed for existing users
        if (isIncomplete || (data?.user && data.user.oauth?.isIncomplete)) {
          const user = data.user;
          const needsPhone = !user.phone || user.phone === '' || user.oauth?.needsPhoneNumber;
          const needsLastName = !user.lastName || user.lastName === '' || user.oauth?.needsLastName;
          
          if (needsPhone || needsLastName) {
            setCurrentUser(user);
            setMissingFields({
              phone: needsPhone,
              lastName: needsLastName
            });
            setNeedsCompletion(true);
            setLoading(false);
            return;
          }
        }
        
        // Successful login with complete profile
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
      let errorMessage = 'Authentication failed';
      if (errorParam === 'google-auth-failed') {
        errorMessage = 'Google authentication failed. Please try again.';
      } else if (errorParam === 'oauth-processing-failed') {
        errorMessage = 'There was an error processing your authentication. Please try again.';
      } else {
        errorMessage = decodeURIComponent(errorParam);
      }
      setError(errorMessage);
      setLoading(false);
      return;
    }
    
    authenticateWithToken();
  }, [authToken, tempToken, loginWithToken, navigate, errorParam, isIncomplete]);

  // Handle profile completion
  const handleProfileComplete = (updatedUser) => {
    setCurrentUser(updatedUser);
    toast.success('Profile completed successfully!');
    navigate('/');
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
    // Handle user object updates (for temporary token renewal)
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };
  
  // If profile completion is needed
  if (needsCompletion) {
    return (
      <CompleteOAuthProfile 
        user={currentUser}
        token={token}
        missingFields={missingFields}
        onComplete={handleProfileComplete}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  // Fallback (shouldn't reach here normally)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
        <p>Redirecting to home page...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
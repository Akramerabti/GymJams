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
  const existingUser = urlParams.get('existingUser') === 'true';
  const userId = urlParams.get('userId');
  
  // Extract error if any
  const errorParam = urlParams.get('error');

  useEffect(() => {
    // Handle authentication with the token from OAuth provider
    const authenticateWithToken = async () => {
      // Handle temporary token case (new user needs to complete profile)
      if (tempToken) {
        try {
          // Create a proper user object for temp token scenarios
          const tempUserObject = {
            tempToken,
            isNewUser: !existingUser,
            userId: userId || null,
            // Initialize with empty values to prevent undefined errors
            phone: null,
            lastName: null
          };
          
          setCurrentUser(tempUserObject);
          setMissingFields({
            phone: true,  // Always need phone for OAuth users
            lastName: true // Always need lastName for OAuth users
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
          
          // Safely check for missing fields
          const needsPhone = !user?.phone || user.phone === '' || user.oauth?.needsPhoneNumber;
          const needsLastName = !user?.lastName || user.lastName === '' || user.oauth?.needsLastName;
          
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
  }, [authToken, tempToken, loginWithToken, navigate, errorParam, isIncomplete, existingUser, userId]);

  // Handle profile completion
  const handleProfileComplete = async (updatedUser) => {
    setCurrentUser(updatedUser);
    toast.success('Profile completed successfully!');
    // If a new token was set in localStorage, use it to log in
    const newToken = localStorage.getItem('token');
    if (newToken) {
      try {
        await loginWithToken(newToken);
      } catch (e) {
        console.error('Error logging in with new token:', e);
        // fallback: just redirect
      }
    }
    navigate('/');
  };
  
  // Handle user object updates (for temporary token renewal)
  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };
  
  // If still loading
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-orange-600"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          width: '100vw',
          zIndex: 99999, // Above everything including navbar
          isolation: 'isolate' // Creates new stacking context
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold mb-2 text-white">Completing authentication...</h2>
        </div>
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
import React, { useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const SocialLoginButtons = ({ onAccountCreated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken, loginWithToken } = useAuth();

  // Handle OAuth callback when component mounts (if there are URL params)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const tempToken = urlParams.get('tempToken');
      const loginSuccess = urlParams.get('loginSuccess');
      const error = urlParams.get('error');
      const existingUser = urlParams.get('existingUser');

      // Handle error
      if (error) {
        toast.error('Authentication failed', {
          description: decodeURIComponent(error)
        });
        // Clean up URL
        navigate(location.pathname, { replace: true });
        return;
      }

      // Handle successful login with complete profile
      if (token && loginSuccess) {
        try {
          const userData = await loginWithToken(token);
          
          // Store token and user data
          localStorage.setItem('token', token);
          if (setToken) setToken(token);
          if (setUser && userData?.user) setUser(userData.user);
          
          // Mark onboarding as complete
          localStorage.setItem('hasCompletedOnboarding', 'true');
          
          toast.success('Login successful!');
          
          // Call the success callback if provided
          if (onAccountCreated) {
            onAccountCreated(userData?.user, 'logged_in_successfully');
          } else {
            navigate('/dashboard');
          }
          
          // Clean up URL
          navigate(location.pathname, { replace: true });
        } catch (err) {
          console.error('Token login error:', err);
          toast.error('Login failed', {
            description: 'Please try again'
          });
          // Clean up URL
          navigate(location.pathname, { replace: true });
        }
        return;
      }

      // Handle temporary token (profile completion needed)
      if (tempToken) {
        localStorage.setItem('tempToken', tempToken);
        
        if (existingUser === 'true') {
          toast.info('Please complete your profile to continue');
          navigate('/complete-profile');
        } else {
          toast.info('Welcome! Please complete your profile to get started');
          navigate('/complete-oauth-profile');
        }
        return;
      }
    };

    handleOAuthCallback();
  }, [location.search, navigate, setUser, setToken, loginWithToken, onAccountCreated, location.pathname]);

  const handleGoogleLogin = () => {
    // Get current URL to return to after OAuth
    const currentUrl = window.location.href.split('?')[0]; // Remove any existing query params
    const returnTo = encodeURIComponent(currentUrl);
    
    // Direct redirect to OAuth endpoint
    const oauthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google?returnTo=${returnTo}`;
    
    // For mobile apps, you might want to handle this differently
    if (window.ReactNativeWebView) {
      // Handle React Native WebView
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'OAUTH_REDIRECT',
        url: oauthUrl
      }));
    } else {
      // Regular web redirect
      window.location.href = oauthUrl;
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path
              fill="#4285F4"
              d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
            />
            <path
              fill="#34A853"
              d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
            />
            <path
              fill="#FBBC05"
              d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
            />
            <path
              fill="#EA4335"
              d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
            />
          </g>
        </svg>
        Continue with Google
      </button>
    </div>
  );
};

export default SocialLoginButtons;
import React from 'react';
import { useAuth } from '../../stores/authStore'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SocialLoginButtons = ({ onAccountCreated }) => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth(); // Adjust based on your auth store methods

  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `${import.meta.env.VITE_API_URL || 'https://gymtonic.onrender.com/api'}/auth/google`,
      'googleLogin',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // Listen for messages from the popup
    const handleMessage = (event) => {
      // Verify origin for security
      const expectedOrigin = import.meta.env.VITE_API_URL || 'https://gymtonic.onrender.com';
      if (!expectedOrigin.includes(event.origin) && event.origin !== window.location.origin) {
        console.warn('Received message from unexpected origin:', event.origin);
        return;
      }

      if (event.data.type === 'OAUTH_SUCCESS') {
        popup?.close();
        handleOAuthSuccess(event.data);
      } else if (event.data.type === 'OAUTH_ERROR') {
        popup?.close();
        handleOAuthError(event.data.error);
      }
    };

    const handleOAuthSuccess = (data) => {
      if (data.requiresCompletion) {
        // User needs to complete their profile
        if (data.existingUser) {
          // Existing user with incomplete profile
          toast.info('Please complete your profile to continue');
          localStorage.setItem('tempToken', data.tempToken);
          navigate('/complete-profile', { 
            state: { 
              user: data.user,
              isExistingUser: true 
            } 
          });
        } else {
          // New user from OAuth
          toast.info('Welcome! Please complete your profile to get started');
          localStorage.setItem('tempToken', data.tempToken);
          navigate('/complete-oauth-profile', { 
            state: { 
              oauthProfile: data.oauthProfile 
            } 
          });
        }
      } else {
        // Complete user - successful login
        const { token, user } = data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        if (setToken) setToken(token);
        if (setUser) setUser(user);
        
        // Mark onboarding as complete
        localStorage.setItem('hasCompletedOnboarding', 'true');
        
        toast.success('Login successful!');
        
        // Call the success callback if provided (for MobileGatekeeper)
        if (onAccountCreated) {
          onAccountCreated(user, 'logged_in_successfully');
        } else {
          // Navigate to dashboard or home
          navigate('/dashboard');
        }
      }
    };

    const handleOAuthError = (errorMessage) => {
      console.error('OAuth error:', errorMessage);
      toast.error('Authentication failed', {
        description: errorMessage || 'Please try again'
      });
    };

    window.addEventListener('message', handleMessage);

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);

    // Clean up after 5 minutes
    setTimeout(() => {
      if (!popup?.closed) {
        popup?.close();
      }
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
    }, 300000);
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
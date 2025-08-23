// Reliable Google OAuth for Capacitor 7.x using Browser plugin
// npm install @capacitor/browser
// npm install -D typescript --legacy-peer-deps
// npx cap sync

import React, { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { useAuth } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const BrowserGoogleAuthButton = ({ onAccountCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken, loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let listener;

    // Only add deep link listener on native platforms
    if (Capacitor.isNativePlatform()) {
      listener = App.addListener('appUrlOpen', (event) => {
        console.log('Deep link received:', event.url);
        handleOAuthCallback(event.url);
      });
    }

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  const handleOAuthCallback = async (url) => {
    try {
      setIsLoading(true);
      
      // Parse the callback URL
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      const tempToken = urlObj.searchParams.get('tempToken');
      const error = urlObj.searchParams.get('error');
      const loginSuccess = urlObj.searchParams.get('loginSuccess');
      const existingUser = urlObj.searchParams.get('existingUser');

      // Close the browser on mobile
      if (Capacitor.isNativePlatform()) {
        await Browser.close();
      }

      if (error) {
        toast.error('Authentication failed', {
          description: decodeURIComponent(error)
        });
        return;
      }

      // Handle successful login with complete profile
      if (token && loginSuccess) {
        const userData = await loginWithToken(token);
        localStorage.setItem('token', token);
        if (setToken) setToken(token);
        if (setUser && userData?.user) setUser(userData.user);
        localStorage.setItem('hasCompletedOnboarding', 'true');

        toast.success('Login successful!');
        
        if (onAccountCreated) {
          onAccountCreated(userData?.user, 'logged_in_successfully');
        } else {
          navigate('/dashboard');
        }
      }

      // Handle profile completion needed
      if (tempToken) {
        localStorage.setItem('tempToken', tempToken);
        
        if (existingUser === 'true') {
          toast.info('Please complete your profile to continue');
          navigate('/complete-profile');
        } else {
          toast.info('Welcome! Please complete your profile to get started');
          navigate('/complete-oauth-profile');
        }
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Authentication failed', {
        description: 'Please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const baseUrl = process.env.VITE_API_URL || 'https://gymtonic.onrender.com/api';
      console.log('Base URL:', baseUrl);
      console.log('Is native platform:', Capacitor.isNativePlatform());
      
      if (Capacitor.isNativePlatform()) {
        // Mobile: Use custom URL scheme for callback
        const scheme = 'com.akram.gymtonic';
        const redirectUri = `${scheme}://oauth/callback`;
        const oauthUrl = `${baseUrl}/auth/google/mobile?redirectUri=${encodeURIComponent(redirectUri)}`;
        
        console.log('Opening mobile OAuth URL:', oauthUrl);

        await Browser.open({
          url: oauthUrl,
          windowName: '_system',
        });
        
        // Loading state will be cleared when deep link is received
      } else {
        // Web: Use traditional redirect
        const currentUrl = window.location.href.split('?')[0];
        const returnTo = encodeURIComponent(currentUrl);
        const oauthUrl = `${baseUrl}/auth/google?returnTo=${returnTo}`;
        
        console.log('Redirecting to web OAuth URL:', oauthUrl);
        window.location.href = oauthUrl;
      }

    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setIsLoading(false);
      
      if (error.message?.includes('cancelled') || error.message?.includes('popup_closed')) {
        // User cancelled - don't show error
        return;
      }
      
      toast.error('Sign-in failed', {
        description: 'Please try again or use email/password'
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Signing in...
        </div>
      ) : (
        <>
          <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
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
        </>
      )}
    </button>
  );
};

export default BrowserGoogleAuthButton;
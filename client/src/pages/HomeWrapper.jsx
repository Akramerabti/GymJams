import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import ConversionLanding from './ConversionLanding';
import Home from './Home';

const HomeWrapper = () => {
  const { isAuthenticated, user, checkAuth, token, isTokenValid } = useAuth();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const authCheckInitiated = useRef(false);
  
  // Check for back navigation flag
  const isBackNavigation = sessionStorage.getItem('conversion-back-nav') === 'true';
  
  // Memoize the auth check function to prevent recreating it on every render
  const performAuthCheck = useCallback(async () => {
    console.log('🔍 HomeWrapper: Starting auth check...');
    
    try {
      await checkAuth();
    } catch (error) {
      console.error('🔍 HomeWrapper: Auth check failed:', error);
    } finally {
      setAuthCheckComplete(true);
      setIsLoading(false);
      console.log('🔍 HomeWrapper: Auth check completed');
    }
  }, [checkAuth]);

  // Handle initial auth check - only run once
  useEffect(() => {
    // Handle back navigation - if user is back from other pages, show Home instead of ConversionLanding
    if (isBackNavigation && isAuthenticated && user) {
      console.log('🔙 Back navigation detected, clearing flag and showing Home');
      sessionStorage.removeItem('conversion-back-nav');
      setAuthCheckComplete(true);
      setIsLoading(false);
      return;
    }
    
    // Only check auth once when component mounts
    if (!authCheckInitiated.current) {
      authCheckInitiated.current = true;
      performAuthCheck();
    }
  }, []); // Empty dependency array - only run on mount

  // Separate effect to handle auth state changes after initial check
  useEffect(() => {
    // Once auth check is complete, we can determine what to show
    // This effect only handles the logic after auth is determined
    if (authCheckComplete && !isLoading) {
      console.log('🔍 HomeWrapper: Auth state determined:', {
        isAuthenticated,
        hasUser: !!user,
        isBackNavigation
      });
    }
  }, [authCheckComplete, isAuthenticated, user, isLoading, isBackNavigation]);
  
  // Clear back navigation flag when component unmounts (user leaves homepage)
  useEffect(() => {
    return () => {
      if (location.pathname !== '/') {
        sessionStorage.removeItem('conversion-back-nav');
      }
    };
  }, [location.pathname]);

  // Show loading screen while checking auth
  if (isLoading || !authCheckComplete) {
    console.log('🔍 HomeWrapper: Still checking auth, showing loader...');
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-orange-600 h-dvh w-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Determine which component to render
  const shouldShowConversion = !isBackNavigation && (!isAuthenticated || !user);
  
  console.log('🔍 HomeWrapper: Final rendering decision:', {
    shouldShowConversion,
    isAuthenticated,
    hasUser: !!user,
    willRender: shouldShowConversion ? 'ConversionLanding' : 'Home'
  });
  
  // Show ConversionLanding for non-authenticated users
  if (shouldShowConversion) {
    console.log('🎯 HomeWrapper: Rendering ConversionLanding');
    return <ConversionLanding />;
  }

  // Show Home for authenticated users
  console.log('🎯 HomeWrapper: Rendering Home component');
  return <Home />;
};

export default HomeWrapper;
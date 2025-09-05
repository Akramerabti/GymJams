import React, { useEffect } from 'react';
import { useAuth } from '../stores/authStore';
import ConversionLanding from './ConversionLanding';
import Home from './Home';

const HomeWrapper = () => {
  const { isAuthenticated, user, checkAuth, token, isTokenValid } = useAuth();
  
  // Check authentication on component mount
  useEffect(() => {
    console.log('🔍 HomeWrapper: Component mounted, checking auth...');
    checkAuth();
  }, [checkAuth]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🔍 HomeWrapper: Auth state changed:', {
      isAuthenticated,
      isAuthenticatedType: typeof isAuthenticated,
      hasUser: !!user,
      userId: user?.id || user?.user?.id,
      userEmail: user?.email || user?.user?.email,
      hasToken: !!token,
      isTokenValid: isTokenValid(),
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    });
  }, [isAuthenticated, user, token, isTokenValid]);

  // Additional debugging for decision logic
  const shouldShowConversion = !isAuthenticated || !user;
  console.log('🔍 HomeWrapper: Rendering decision:', {
    shouldShowConversion,
    isAuthenticated,
    isAuthenticatedType: typeof isAuthenticated,
    hasUser: !!user,
    reason: shouldShowConversion ? 
      (!isAuthenticated ? `Not authenticated (value: ${isAuthenticated}, type: ${typeof isAuthenticated})` : 'No user object') : 
      'User is authenticated',
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
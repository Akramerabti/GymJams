import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import ConversionLanding from './ConversionLanding';
import Home from './Home';

const HomeWrapper = () => {
  const { isAuthenticated, user, checkAuth, token, isTokenValid } = useAuth();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const renderDecisionMade = useRef(false);
  const lastRenderKey = useRef(null);
  
  // Check for back navigation flag
  const isBackNavigation = sessionStorage.getItem('conversion-back-nav') === 'true';
  
  useEffect(() => {
    // Handle back navigation - if user is back from other pages, show Home instead of ConversionLanding
    if (isBackNavigation && isAuthenticated && user) {
      console.log('🔙 Back navigation detected, clearing flag and showing Home');
      sessionStorage.removeItem('conversion-back-nav');
      setAuthCheckComplete(true);
      return;
    }
    
    const performAuthCheck = async () => {
      console.log('🔍 HomeWrapper: Starting auth check...');
      
      try {
        await checkAuth();
      } catch (error) {
        console.error('🔍 HomeWrapper: Auth check failed:', error);
      } finally {
        // Use setTimeout to ensure state updates are batched
        setTimeout(() => {
          setAuthCheckComplete(true);
          console.log('🔍 HomeWrapper: Auth check completed');
        }, 0);
      }
    };

    // Only check auth once when component mounts
    if (!authCheckComplete && !renderDecisionMade.current) {
      performAuthCheck();
    }
  }, [checkAuth, authCheckComplete, isAuthenticated, user, isBackNavigation]);
  
  // Clear back navigation flag when component unmounts (user leaves homepage)
  useEffect(() => {
    return () => {
      if (location.pathname !== '/') {
        sessionStorage.removeItem('conversion-back-nav');
      }
    };
  }, [location.pathname]);

  if (!authCheckComplete) {
    console.log('🔍 HomeWrapper: Still checking auth, showing loader...');
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
        </div>
      </div>
    );
  }

  // Determine which component to render - make decision once and stick to it
  // Special case: if back navigation detected and user is authenticated, always show Home
  const shouldShowConversion = !isBackNavigation && (!isAuthenticated || !user);
  const renderKey = shouldShowConversion ? 'conversion' : 'home';
  
  // Only log and update if the decision actually changed
  if (!renderDecisionMade.current || lastRenderKey.current !== renderKey) {
    console.log('🔍 HomeWrapper: Final rendering decision:', {
      shouldShowConversion,
      isAuthenticated,
      hasUser: !!user,
      willRender: shouldShowConversion ? 'ConversionLanding' : 'Home'
    });
    
    renderDecisionMade.current = true;
    lastRenderKey.current = renderKey;
  }
  
  // Show ConversionLanding for non-authenticated users
  if (shouldShowConversion) {
    console.log('🎯 HomeWrapper: Rendering ConversionLanding');
    return <ConversionLanding key="conversion-landing" />;
  }

  // Show Home for authenticated users
  console.log('🎯 HomeWrapper: Rendering Home component');
  return <Home key="authenticated-home" />;
};

export default HomeWrapper;
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import adService from './services/adsense';
import AdDebugger from './components/blog/AdDebugger';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Import global CSS
import './global.css';

// Import providers
import { GuestFlowProvider } from './components/gymBros/components/GuestFlowContext';
import { SocketProvider } from './SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PermissionsProvider, usePermissions } from './contexts/PermissionContext';

// Import stores
import { useAuth } from './stores/authStore';
import notificationService from './services/notificationService';

// Layout Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Page Components
import Home from './pages/Home';
import CoachingHome from './pages/CoachingHome';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import ShopCheckout from './pages/ShopCheckout';
import SubscriptionCheckout from './pages/SubscriptionCheckout';
import Register from './pages/Register';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import EmailVerificationNotification from './pages/EmailVerificationNotification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Orders from './pages/Orders';
import SubscriptionManagement from './pages/SubscriptionManagement';
import Dashboard from './pages/Dashboard';
import Questionnaire from './pages/Questionnaire';
import Games from './pages/Games';
import HiddenGames from './pages/HiddenGames';
import Onboarding from './pages/Onboarding';
import TaskforceDashboard from './pages/TaskforceDashboard';
import Contact from './pages/CustomerService/contact';
import ProductPage from './pages/ProductPage';
import GymBros from './pages/Gymbros';
import OrderConfirmation from './pages/OrderConfirmation';
import AboutUs from './pages/CustomerService/about';
import FAQ from './pages/CustomerService/faq';
import Returns from './pages/CustomerService/returns';
import ApplicationForm from './pages/CustomerService/application';
import OAuthCallback from './pages/OAuthCallback';
import Blog from './pages/Blog';
import BlogPost from './components/blog/BlogPost';
import CompleteOAuthProfile from './components/auth/CompleteOAuthProfile';
import MobileGatekeeper from './components/MobileGateKeeper';

// Common Components
import CoachProfileCompletionModal from './components/common/CoachProfileCompletionModal';
import PermissionsModal from './components/common/PermissionsModal';

// Constants
const FIVE_MINUTES = 5 * 60 * 1000;

// OAuth Callback Handler Component (updated section)
function OAuthCallbackHandler({ showMobileGatekeeper }) {
  const location = useLocation();
  const { loginWithToken, setUser, setToken } = useAuth();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const tempToken = urlParams.get('tempToken');
      const error = urlParams.get('error');
      const loginSuccess = urlParams.get('loginSuccess');
      const existingUser = urlParams.get('existingUser');

      
      // Only process if we have OAuth parameters and haven't processed yet
      if ((token || tempToken || error) && !isProcessingCallback) {
        setIsProcessingCallback(true);

        try {
          // Clean the URL first
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, null, cleanUrl);

          if (error) {
            toast.error('Authentication failed', {
              description: decodeURIComponent(error)
            });
            return;
          }

          // In OAuthCallbackHandler function in App.js
if (token && loginSuccess) {
  try {
    const userData = await loginWithToken(token);
    
    // Set persistent login flags
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('userLoginMethod', 'google_oauth');
    localStorage.setItem('persistentLogin', 'true');
    
    toast.success('Successfully logged in with Google!');
    
    // Add a flag to ensure success screen shows
    localStorage.setItem('showLoginSuccess', 'true');
    
    // Redirect to home with success parameter
    setTimeout(() => {
      window.location.href = '/?loginSuccess=true&fromOAuth=true';
    }, 100); // Reduced delay
    
  } catch (loginError) {
    toast.error('Login failed', {
      description: 'Please try again'
    });
  }
}

          // Handle profile completion needed
          if (tempToken) {
            localStorage.setItem('tempToken', tempToken);
            
            if (existingUser === 'true') {
              toast.info('Please complete your profile to continue');
              window.location.href = '/complete-profile';
            } else {
              toast.info('Welcome! Please complete your profile to get started');
              window.location.href = '/complete-oauth-profile';
            }
          }

        } catch (error) {
          toast.error('Authentication failed', {
            description: 'Please try again'
          });
        }
      }
    };

    handleOAuthCallback();
  }, [location.search, loginWithToken, isProcessingCallback]);

  return null; // This component doesn't render anything
}

// Modal manager component (must be inside Router)
function CoachProfileModalManager() {
  const [showCoachProfileModal, setShowCoachProfileModal] = useState(false);
  const location = useLocation();
  const timerRef = useRef(null);

  useEffect(() => {
    const maybeShowModal = () => {
      if (location.pathname !== '/profile') {
        setShowCoachProfileModal(true);
      } else {
        setShowCoachProfileModal(false);
      }
    };
    maybeShowModal();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      if (location.pathname !== '/profile') {
        setShowCoachProfileModal(true);
      }
    }, FIVE_MINUTES);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [location.pathname]);

  return <CoachProfileCompletionModal isOpen={showCoachProfileModal} onClose={() => setShowCoachProfileModal(false)} />;
}

// Permissions Modal Manager
function PermissionsModalManager() {
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const { 
    isInitialized, 
    isNative, 
    hasAllCriticalPermissions, 
    permissions,
    requestAllPermissions 
  } = usePermissions();

  useEffect(() => {
    // Only show permissions modal for native apps
    if (!isNative || !isInitialized) return;

    // Check if we need to show permissions modal
    const needsPermissions = Object.values(permissions).some(
      perm => perm.status === 'prompt' || (perm.status === 'denied' && !perm.requested)
    );

    // Show modal after a short delay if permissions are needed
    if (needsPermissions && !hasAllCriticalPermissions) {
      const timer = setTimeout(() => {
        setShowPermissionsModal(true);
      }, 2000); // 2 second delay to let app settle

      return () => clearTimeout(timer);
    }
  }, [isInitialized, isNative, hasAllCriticalPermissions, permissions]);

  const handleRequestPermissions = async () => {
    try {
      await requestAllPermissions({ showToasts: true });
      setShowPermissionsModal(false);
    } catch (error) {
      console.error('Failed to request permissions from modal:', error);
    }
  };

  const handleSkipPermissions = () => {
    setShowPermissionsModal(false);
  };

  if (!isNative) return null;

  return (
    <PermissionsModal
      isOpen={showPermissionsModal}
      onRequestPermissions={handleRequestPermissions}
      onSkip={handleSkipPermissions}
      permissions={permissions}
    />
  );
}

function AppContent() {
  const { checkAuth, logout, user, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMobileGatekeeper, setShowMobileGatekeeper] = useState(false);
  const [isShowingLoginSuccess, setIsShowingLoginSuccess] = useState(false);
  const [loginSuccessStartTime, setLoginSuccessStartTime] = useState(null);
  const successTimeoutRef = useRef(null);
  const { 
    isInitialized: permissionsInitialized, 
    currentLocation, 
    updateLocation,
    isNative
  } = usePermissions();

  // Initialize notifications when user logs in/out
  useEffect(() => {
    if (user && isAuthenticated) {
      // Initialize notifications when user is logged in
      initializeNotifications();
    } else {
      // Clean up when user logs out
      handleNotificationCleanup();
    }
  }, [user, isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      const success = await notificationService.initialize();
      
      if (success) {
        
        // Register any pending FCM token from before login
        await notificationService.registerPendingToken();
      } 
    } catch (error) {
      // Don't show error toast to user as this is not critical functionality
    }
  };

  const handleNotificationCleanup = async () => {
    try {
      await notificationService.unregister();
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  };

  // Check if we're returning from OAuth
  useEffect(() => {
    const checkOAuthReturn = () => {
      // Check if we're on the OAuth callback page
      if (window.location.pathname === '/oauth-callback') {
        // Don't show mobile gatekeeper on OAuth callback
        setShowMobileGatekeeper(false);
        sessionStorage.removeItem('mobileGatekeeperOpen');
      }
    };
    
    checkOAuthReturn();
  }, []);

  useEffect(() => {
    // CRITICAL: Don't auto-close during login success flow
    if (isShowingLoginSuccess) {
      return;
    }

    // ADDITIONAL PROTECTION: Don't close if gatekeeper has an active success timeout
    // This handles cases where isShowingLoginSuccess might not be set but timeout is active
    if (successTimeoutRef.current && showMobileGatekeeper) {
      return;
    }

    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const urlTempToken = urlParams.get('tempToken');
    
    if (urlTempToken) {
      localStorage.setItem('tempToken', urlTempToken);
      // Clean URL and redirect
      window.history.replaceState(null, null, window.location.pathname);
      setShowMobileGatekeeper(false);
      window.location.href = '/complete-oauth-profile';
      return;
    }

    const token = localStorage.getItem('token');
    const tempToken = localStorage.getItem('tempToken');
    const currentPath = window.location.pathname;
    
    // If we have a tempToken, don't show gatekeeper
    if (tempToken) {
      setShowMobileGatekeeper(false);
      return;
    }
    
    // Define routes where MobileGatekeeper should NOT show
    const excludedRoutes = [
      '/oauth-callback',
      '/verify-email',
      '/email-verification-notification',
      '/reset-password',
      '/forgot-password',
      '/complete-oauth-profile'
    ];
    
    // Check if current path should be excluded
    const isExcludedRoute = excludedRoutes.some(route => currentPath.startsWith(route));
    
    // Enhanced rule: If not authenticated AND not on excluded routes, show gatekeeper
    const shouldShowGatekeeper = !isAuthenticated && !user && !token && !tempToken && !isExcludedRoute;
    
    // Only update if the state actually needs to change
    if (shouldShowGatekeeper !== showMobileGatekeeper) {
      setShowMobileGatekeeper(shouldShowGatekeeper);
    }
    
  }, [isAuthenticated, user, isShowingLoginSuccess, showMobileGatekeeper, successTimeoutRef.current]);

  const handleAccountCreated = (userData, action) => {
    // Handle login success case - START success screen protection
    if (action === 'logged_in_successfully') {
      
      // Set success screen state to prevent auto-closing
      setIsShowingLoginSuccess(true);
      setLoginSuccessStartTime(Date.now());
      
      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      
      // Set timeout to end success screen protection and close gatekeeper
      successTimeoutRef.current = setTimeout(() => {
        
        // End success screen protection
        setIsShowingLoginSuccess(false);
        setLoginSuccessStartTime(null);
        
        // Close gatekeeper
        setShowMobileGatekeeper(false);
        sessionStorage.removeItem('mobileGatekeeperOpen');
        
        // Clear timeout reference
        successTimeoutRef.current = null;
        
        // Redirect if needed
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        
      }, 4000); // Give full 4 seconds for success screen
      
      return; // Don't process further
    }
    
    // For all other actions, close the gatekeeper immediately
    setShowMobileGatekeeper(false);
    sessionStorage.removeItem('mobileGatekeeperOpen');
    
    if (action === 'complete_oauth_profile') {
      toast.info('Welcome! Please complete your profile to get started');
      window.location.href = '/complete-oauth-profile';
    } else if (action === 'complete_profile') {
      toast.info('Please complete your profile to continue');
      window.location.href = '/complete-profile';
    } else {
      // Normal completion
      checkAuth();
    }
  };

  // Cleanup success timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Initialize app
  useEffect(() => {
    const validateTokenOnLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        const tempToken = localStorage.getItem('tempToken');
        
        if (token) {
          const isValid = await checkAuth();
          
          if (!isValid) {
            logout();
            // Force show MobileGatekeeper after invalid token
            setShowMobileGatekeeper(true);
          } else {
            setShowMobileGatekeeper(false);
          }
        } else {
          // Check if we're on an excluded route or have tempToken
          const currentPath = window.location.pathname;
          const excludedRoutes = [
            '/oauth-callback',
            '/verify-email', 
            '/email-verification-notification',
            '/reset-password',
            '/forgot-password',
            '/complete-oauth-profile'
          ];
          const isExcludedRoute = excludedRoutes.some(route => currentPath.startsWith(route));
          
          // Force show MobileGatekeeper if no token and not on excluded route
          if (!tempToken && !isExcludedRoute) {
            setShowMobileGatekeeper(true);
          }
        }
      } catch (error) {
        logout();
        // Force show MobileGatekeeper on auth errors
        setShowMobileGatekeeper(true);
      }
    };

    const initGAM = async (retryCount = 0) => {
      try {
        // Skip GAM initialization for native apps
        if (isNative) {
          return;
        }
        
        await adService.init();
      } catch (error) {
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => initGAM(retryCount + 1), delay);
        }
      }
    };

    // Wait for permissions to be initialized before fully starting the app
    if (permissionsInitialized) {
      Promise.all([
        validateTokenOnLoad(),
        initGAM()
      ]).catch(() => {});
    }
  }, [checkAuth, logout, permissionsInitialized, isNative]);

  // Show loading screen while permissions are initializing
  if (!permissionsInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout showMobileGatekeeper={showMobileGatekeeper}>
        {/* OAuth Callback Handler - must be inside Router */}
        <OAuthCallbackHandler showMobileGatekeeper={showMobileGatekeeper} />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/coaching" element={<CoachingHome />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/shop-checkout" element={<ShopCheckout />} />
          <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/email-verification-notification" element={<EmailVerificationNotification />} />
          <Route path="/login" element={<MobileGatekeeper isOpen={true} onAccountCreated={handleAccountCreated} onClose={() => {}} />} />
          <Route path="/complete-oauth-profile" element={<CompleteOAuthProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/games" element={<Games />} />
          <Route path="/hidden-games" element={<HiddenGames />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/gymbros" element={<GymBros />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/application" element={<ApplicationForm />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/subscription-management" element={
            <ProtectedRoute>
              <SubscriptionManagement />
            </ProtectedRoute>
          } />
          <Route path="/taskforce-dashboard" element={
            <ProtectedRoute>
              <TaskforceDashboard />
            </ProtectedRoute>
          } />
        </Routes>

        {showOnboarding && (
          <Onboarding onClose={() => setShowOnboarding(false)} />
        )}

        {/* Only show these when mobile gatekeeper is not active */}
        {!showMobileGatekeeper && (
          <>
            <CoachProfileModalManager />
            <PermissionsModalManager />
          </>
        )}

        <Toaster />
        {process.env.NODE_ENV !== 'production' && !isNative && <AdDebugger />}
      </Layout>

      {/* Enhanced Mobile Gatekeeper with debug info */}
      <MobileGatekeeper 
        isOpen={showMobileGatekeeper}
        onAccountCreated={handleAccountCreated}
        onClose={() => {
          setShowMobileGatekeeper(false);
        }}
      />
    </Router>
  );
}

function App() {  
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <PermissionsProvider>         
          <SocketProvider>          
            <GuestFlowProvider>
              <AppContent />
            </GuestFlowProvider>
          </SocketProvider>
        </PermissionsProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
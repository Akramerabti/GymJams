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

// OAuth Callback Handler Component
function OAuthCallbackHandler() {
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
        console.log('🔍 OAuth callback detected:', { 
          token: !!token, 
          tempToken: !!tempToken, 
          error, 
          loginSuccess,
          existingUser 
        });

        setIsProcessingCallback(true);

        try {
          // Clean the URL first
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, null, cleanUrl);

          if (error) {
            console.error('❌ OAuth error:', error);
            toast.error('Authentication failed', {
              description: decodeURIComponent(error)
            });
            return;
          }

          // Handle successful login with complete profile
          if (token && loginSuccess) {
            console.log('✅ OAuth login successful, processing token...');
            
            try {
              const userData = await loginWithToken(token);
              
              // Set persistent login flags
              localStorage.setItem('hasCompletedOnboarding', 'true');
              localStorage.setItem('userLoginMethod', 'google_oauth');
              localStorage.setItem('persistentLogin', 'true');
              
              console.log('✅ User data received:', userData);
              toast.success('Successfully logged in with Google!');
              
              // Force a small delay to ensure everything is set
              setTimeout(() => {
                window.location.reload();
              }, 500);
              
            } catch (loginError) {
              console.error('❌ Login with token failed:', loginError);
              toast.error('Login failed', {
                description: 'Please try again'
              });
            }
          }

          // Handle profile completion needed
          if (tempToken) {
            console.log('🔧 Profile completion needed');
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
          console.error('❌ OAuth callback processing error:', error);
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

// Main App component with permissions integration
function AppContent() {
  const { checkAuth, logout, user, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMobileGatekeeper, setShowMobileGatekeeper] = useState(false);
  const { 
    isInitialized: permissionsInitialized, 
    currentLocation, 
    updateLocation,
    isNative
  } = usePermissions();



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

// Mobile Gatekeeper logic - SIMPLE: Not authenticated = show gatekeeper
useEffect(() => {
  console.log('🔍 Mobile Gatekeeper Check:', {
    isAuthenticated,
    hasUser: !!user,
    pathname: window.location.pathname
  });

  const token = localStorage.getItem('token');
  const isOAuthCallback = window.location.pathname === '/oauth-callback';
  
  // SIMPLE RULE: If not authenticated AND not on OAuth callback, show gatekeeper
  const shouldShowGatekeeper = !isAuthenticated && !user && !token && !isOAuthCallback;
  
  console.log('🚪 Should show Mobile Gatekeeper:', shouldShowGatekeeper);
  
  setShowMobileGatekeeper(shouldShowGatekeeper);
  
}, [isAuthenticated, user]);

  // Handle account creation from mobile gatekeeper
  const handleAccountCreated = (userData, token) => {
    setShowMobileGatekeeper(false);
    sessionStorage.removeItem('mobileGatekeeperOpen');
    checkAuth();
  };

  // Initialize app
  useEffect(() => {
    const validateTokenOnLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔍 Checking for existing token:', !!token);
        
        if (token) {
          console.log('✅ Token found, validating...');
          const isValid = await checkAuth();
          console.log('🔍 Token validation result:', isValid);
          
          if (!isValid) {
            console.log('❌ Token invalid, logging out...');
            logout();
          } else {
            console.log('✅ Token valid, user authenticated');
          }
        } else {
          console.log('ℹ️ No token found');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        logout();
      }
    };

    const initGAM = async (retryCount = 0) => {
      try {
        // Skip GAM initialization for native apps
        if (isNative) {
          console.log('Skipping GAM initialization for native app');
          return;
        }
        
        await adService.init();
      } catch (error) {
        console.error('Google Ad Manager initialization error:', error);
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
      ]).catch(error => {
        console.error('App initialization error:', error);
      });
    }
  }, [checkAuth, logout, permissionsInitialized, isNative]);

  // Debug auth state
  useEffect(() => {
    console.log('🔍 Auth state changed:', { 
      user: !!user, 
      isAuthenticated, 
      userId: user?.id 
    });
  }, [user, isAuthenticated]);

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
        <OAuthCallbackHandler />
        
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

      {/* Mobile Gatekeeper - Outside Layout */}
      <MobileGatekeeper 
        isOpen={showMobileGatekeeper}
        onAccountCreated={handleAccountCreated}
        onClose={() => setShowMobileGatekeeper(false)}
      />
    </Router>
  );
}

// Main App wrapper with all providers
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
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
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

// Import stores
import { useAuth } from './stores/authStore';

// Layout Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Page Components - Updated to use HomeWrapper instead of Home
import HomeWrapper from './pages/HomeWrapper';
import CoachingHome from './pages/CoachingHome';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import ShopCheckout from './pages/ShopCheckout';
import SubscriptionCheckout from './pages/SubscriptionCheckout';
import Login from './pages/Login';
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
import PasswordSetup from './components/common/PasswordSetup';
import DiscountSignUpContainer from './components/discount/DiscountSignUpContainer';
import Privacy from './pages/CustomerService/privacy';
import MockCoachAssignment from './pages/Mocks/MockAssignment';
import MockQuestionnaire from './pages/Mocks/MockQuestionnaire';
import MockUserDashboard from './pages/Mocks/MockUserDashboard';

// Common Components
import LocationBanner from './components/common/LocationBanner';
import CoachProfileCompletionModal from './components/common/CoachProfileCompletionModal';

// Constants
const FIVE_MINUTES = 5 * 60 * 1000;

// Modal manager component (must be inside Router)
function CoachProfileModalManager() {
  const [showCoachProfileModal, setShowCoachProfileModal] = useState(false);
  const location = useLocation();
  const timerRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only show modal for authenticated users
    if (!isAuthenticated) {
      setShowCoachProfileModal(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

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
  }, [location.pathname, isAuthenticated]);

  // Only render modal for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return <CoachProfileCompletionModal isOpen={showCoachProfileModal} onClose={() => setShowCoachProfileModal(false)} />;
}

// Discount signup manager - shows for non-logged in users based on visit tracking
function DiscountSignupManager() {
  const [showDiscountSignup, setShowDiscountSignup] = useState(false);
  const { isAuthenticated, loginWithToken } = useAuth();
  const location = useLocation();

  // Debug function - expose to window for console access
  useEffect(() => {
    window.debugDiscountPopup = {
      getStatus: () => {
        const tracking = JSON.parse(localStorage.getItem('discountSignupTracking') || '{}');
        const hasCreatedAccount = localStorage.getItem('hasCreatedAccount') === 'true';
        
        console.log('🔍 DISCOUNT POPUP STATUS:');
        console.log('- Is Authenticated:', isAuthenticated);
        console.log('- Has Created Account:', hasCreatedAccount);
        console.log('- Current Page:', location.pathname);
        console.log('- Tracking Data:', tracking);
        console.log('- Currently Showing:', showDiscountSignup);
        
        return {
          isAuthenticated,
          hasCreatedAccount,
          currentPage: location.pathname,
          tracking,
          currentlyShowing: showDiscountSignup
        };
      },
      resetTracking: () => {
        localStorage.removeItem('discountSignupTracking');
        localStorage.removeItem('hasCreatedAccount');
        console.log('🔄 Reset discount popup tracking - refresh page to see popup again');
      },
      forceShow: () => {
        if (!isAuthenticated) {
          setShowDiscountSignup(true);
          console.log('🎁 Forced discount popup to show');
        } else {
          console.log('❌ Cannot show popup - user is authenticated');
        }
      },
      forceHide: () => {
        setShowDiscountSignup(false);
        console.log('🚫 Forced discount popup to hide');
      }
    };

    return () => {
      delete window.debugDiscountPopup;
    };
  }, [isAuthenticated, location.pathname, showDiscountSignup]);

  useEffect(() => {
    console.log('🔍 DISCOUNT POPUP DEBUG - Checking conditions...');
    
    // Only show for non-authenticated users
    if (isAuthenticated) {
      console.log('❌ User is authenticated - popup will NOT show');
      setShowDiscountSignup(false);
      return;
    }
    console.log('✅ User is NOT authenticated - continuing checks...');

    // Check if user has ever created an account on this device
    const hasEverCreatedAccount = localStorage.getItem('hasCreatedAccount') === 'true';
    if (hasEverCreatedAccount) {
      console.log('❌ User has created account before - popup will NOT show');
      setShowDiscountSignup(false);
      return;
    }
    console.log('✅ User has never created account - continuing checks...');

    // Track visits and dismissals
    const getVisitData = () => {
      const stored = localStorage.getItem('discountSignupTracking');
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        totalVisits: 0,
        dismissCount: 0,
        lastDismissedAt: null,
        visitsSinceDismissal: 0
      };
    };

    const updateVisitData = (updates) => {
      const current = getVisitData();
      const updated = { ...current, ...updates };
      localStorage.setItem('discountSignupTracking', JSON.stringify(updated));
      return updated;
    };

    // Only show on specific pages (like home page)
    const showOnPages = ['/', '/shop', '/coaching'];
    const shouldShowOnThisPage = showOnPages.includes(location.pathname);
    
    console.log(`📍 Current page: ${location.pathname}`);
    console.log(`📍 Show on this page: ${shouldShowOnThisPage}`);
    
    if (!shouldShowOnThisPage) {
      console.log('❌ Not on a valid page for popup - popup will NOT show');
      return;
    }
    console.log('✅ On valid page for popup - continuing checks...');

    // Increment visit count
    const visitData = updateVisitData({ 
      totalVisits: getVisitData().totalVisits + 1 
    });

    console.log('📊 DISCOUNT POPUP TRACKING DATA:', {
      totalVisits: visitData.totalVisits,
      dismissCount: visitData.dismissCount,
      lastDismissedAt: visitData.lastDismissedAt,
      visitsSinceDismissal: visitData.visitsSinceDismissal
    });

    // Determine if we should show the popup
    let shouldShow = false;
    let reason = '';

    if (visitData.dismissCount === 0) {
      // First time visitor - show immediately (after delay)
      shouldShow = true;
      reason = 'First time visitor';
    } else {
      // Has been dismissed before - check if it's the 3rd visit since last dismissal
      if (visitData.visitsSinceDismissal >= 3) {
        shouldShow = true;
        reason = '3rd+ visit since last dismissal - re-engaging user';
      } else {
        reason = `Only ${visitData.visitsSinceDismissal} visits since dismissal (need 3)`;
      }
    }

    console.log(`🎯 POPUP DECISION: ${shouldShow ? 'SHOW' : 'HIDE'}`);
    console.log(`📝 Reason: ${reason}`);

    if (shouldShow) {
      console.log('⏱️ Popup will show in 3 seconds...');
      // Show after a short delay
      const timer = setTimeout(() => {
        console.log('🎁 SHOWING DISCOUNT POPUP NOW!');
        setShowDiscountSignup(true);
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      console.log('🚫 Popup will NOT show this visit');
    }
  }, [isAuthenticated, location.pathname]);

  const handleDismiss = () => {
    const visitData = JSON.parse(localStorage.getItem('discountSignupTracking') || '{}');
    
    // Update dismissal tracking
    const updated = {
      ...visitData,
      dismissCount: (visitData.dismissCount || 0) + 1,
      lastDismissedAt: new Date().toISOString(),
      visitsSinceDismissal: 0 // Reset counter
    };
    
    localStorage.setItem('discountSignupTracking', JSON.stringify(updated));
    console.log('❌ Discount popup dismissed. Updated tracking:', updated);
    
    setShowDiscountSignup(false);
  };

  const handleSignupSuccess = async (data) => {
    console.log('Discount signup successful:', data);
    
    // If this is a discount signup with a token, log the user in automatically
    if (data.type === 'discount_signup' && data.token) {
      try {
        // Use the token to log the user in
        await loginWithToken(data.token);
        
        // Store the discount code for future use
        if (data.discountCode) {
          localStorage.setItem('discountCode', data.discountCode);
        }
        
        console.log('✅ User automatically logged in after discount signup');
        toast.success('Welcome to GymTonic!', {
          description: 'You\'ve been automatically logged in with your new account!'
        });
      } catch (error) {
        console.error('Failed to auto-login after discount signup:', error);
        // If auto-login fails, still store the discount code
        if (data.discountCode) {
          localStorage.setItem('discountCode', data.discountCode);
        }
      }
    }
    
    // Mark that user has created an account on this device
    localStorage.setItem('hasCreatedAccount', 'true');
    
    setShowDiscountSignup(false);
    console.log('✅ Account created - discount popup will not show again on this device');
  };

  // Track visits since last dismissal when component unmounts/location changes
  useEffect(() => {
    return () => {
      const visitData = JSON.parse(localStorage.getItem('discountSignupTracking') || '{}');
      if (visitData.dismissCount > 0) {
        const updated = {
          ...visitData,
          visitsSinceDismissal: (visitData.visitsSinceDismissal || 0) + 1
        };
        localStorage.setItem('discountSignupTracking', JSON.stringify(updated));
      }
    };
  }, [location.pathname]);

  // Only show for non-authenticated users
  if (isAuthenticated || !showDiscountSignup) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <DiscountSignUpContainer onSuccess={handleSignupSuccess} onClose={handleDismiss} />
    </div>
  );
}

// Main App component
function App() {
  const { checkAuth, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const validateTokenOnLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const isValid = await checkAuth();
          if (!isValid) {
            logout();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      }
    };

    const initGAM = async (retryCount = 0) => {
      try {
        await adService.init();
      } catch (error) {
        console.error('Google Ad Manager initialization error:', error);
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => initGAM(retryCount + 1), delay);
        }
      }
    };

    Promise.all([
      validateTokenOnLoad(),
      initGAM()
    ]).catch(error => {
      console.error('App initialization error:', error);
    });
  }, [checkAuth, logout]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SocketProvider>
          <GuestFlowProvider>
            <Router>
              <Layout>
                <Routes>
                  {/* Home Route - Now uses HomeWrapper for conversion logic */}
                  <Route path="/" element={<HomeWrapper />} />
                  
                  {/* Public Routes */}
                  <Route path="/coaching" element={<CoachingHome />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/shop-checkout" element={<ShopCheckout />} />
                  <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/setup-password" element={<PasswordSetup />} />
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
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/mock-assignment" element={<MockCoachAssignment />} />
                  <Route path="/mock-questionnaire" element={<MockQuestionnaire />} />
                  <Route path="/mock-dashboard" element={<MockUserDashboard />} />
                  
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

                {/* Global Components */}
                <LocationBanner onLocationSet={setLocation} />
                <CoachProfileModalManager />
                <DiscountSignupManager />

                <Toaster />
                {process.env.NODE_ENV !== 'production' && <AdDebugger />}
              </Layout>
            </Router>
          </GuestFlowProvider>
        </SocketProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
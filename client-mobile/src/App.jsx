import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import adService from './services/adsense';
import AdDebugger from './components/blog/AdDebugger';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Import global CSS
import './global.css';

import MobileGatekeeper from './components/MobileGateKeeper';

// Import providers
import { GuestFlowProvider } from './components/gymBros/components/GuestFlowContext';
import { SocketProvider } from './SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

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

// Authentication monitor component
function AuthMonitor({ setShowMobileGatekeeper }) {
  const { user, token, isTokenValid } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const checkAuthStatus = () => {
      const isMobile = window.innerWidth <= 768;
      const isAuthenticated = !!(token && isTokenValid() && user);
      const isOAuthCallback = location.pathname === '/oauth-callback';
      const isEmailVerification = location.pathname === '/email-verification-notification';
      const isVerifyEmail = location.pathname.includes('/verify-email');
      
      // Don't show gatekeeper on these specific pages
      const exemptPages = ['/oauth-callback', '/email-verification-notification', '/verify-email'];
      const isExemptPage = exemptPages.some(page => location.pathname.includes(page));
      
      if (isMobile && !isAuthenticated && !isExemptPage) {
        setShowMobileGatekeeper(true);
      } else {
        setShowMobileGatekeeper(false);
      }
    };
    
    // Check immediately
    checkAuthStatus();
    
    // Check on window resize
    window.addEventListener('resize', checkAuthStatus);
    
    return () => {
      window.removeEventListener('resize', checkAuthStatus);
    };
  }, [token, user, isTokenValid, location.pathname, setShowMobileGatekeeper]);
  
  return null;
}

// Main App component
function App() {
  const { checkAuth, logout, user, token, isTokenValid } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [location, setLocation] = useState(null);
  const [showMobileGatekeeper, setShowMobileGatekeeper] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle logout events
  useEffect(() => {
    const handleLogoutEvent = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // Clear all auth-related storage
        localStorage.removeItem('token');
        localStorage.removeItem('hasCompletedOnboarding');
        sessionStorage.removeItem('mobileGatekeeperOpen');
        
        // Show mobile gatekeeper
        setShowMobileGatekeeper(true);
        
        // Navigate to home
        window.location.href = '/';
      }
    };
    
    // Listen for custom logout event
    window.addEventListener('user-logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('user-logout', handleLogoutEvent);
    };
  }, []);

  // Initial authentication check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          const isValid = await checkAuth();
          if (!isValid) {
            // Token is invalid, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('hasCompletedOnboarding');
            
            // Check if mobile and show gatekeeper
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
              setShowMobileGatekeeper(true);
            }
          }
        } else {
          // No token, check if mobile
          const isMobile = window.innerWidth <= 768;
          if (isMobile) {
            setShowMobileGatekeeper(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  // Handle successful account creation/login
  const handleAccountCreated = (userData, status) => {
    setShowMobileGatekeeper(false);
    sessionStorage.removeItem('mobileGatekeeperOpen');
    
    // Don't reload for successful login - let React handle the navigation
    // The auth state update will automatically trigger the proper UI update
  };

  // Initialize other services
  useEffect(() => {
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

    initGAM();
  }, []);

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SocketProvider>
          <GuestFlowProvider>
            <Router>
              {/* Auth Monitor - Inside Router to use location */}
              <AuthMonitor setShowMobileGatekeeper={setShowMobileGatekeeper} />
              
              <Layout showMobileGatekeeper={showMobileGatekeeper}>
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
                    <LocationBanner onLocationSet={setLocation} />
                    <CoachProfileModalManager />
                  </>
                )}

                <Toaster />
                {process.env.NODE_ENV !== 'production' && <AdDebugger />}
              </Layout>

              {/* Mobile Gatekeeper - Outside Layout */}
              <MobileGatekeeper 
                isOpen={showMobileGatekeeper}
                onAccountCreated={handleAccountCreated}
                onClose={() => setShowMobileGatekeeper(false)}
              />
            </Router>
          </GuestFlowProvider>
        </SocketProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
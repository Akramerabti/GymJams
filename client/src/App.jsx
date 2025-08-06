import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import adService from './services/adsense';
import AdDebugger from './components/blog/AdDebugger';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Import global CSS
import './global.css';

// Import providers
import { GuestFlowProvider } from './components/gymBros/components/GuestFlowContext';

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
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import EmailVerificationNotification from './pages/EmailVerificationNotification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Orders from './pages/Orders';
import SubscriptionManagement from './pages/SubscriptionManagement';
import useAuthStore from './stores/authStore';
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

import { SocketProvider } from './SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Location and Profile Components
import LocationBanner from './components/common/LocationBanner';
import CoachProfileCompletionModal from './components/common/CoachProfileCompletionModal';


const App = () => {
  const { checkAuth, logout, showOnboarding, setShowOnboarding, refreshUserLocation, reverseGeocode } = useAuthStore();

  const refreshGuestLocation = async () => {
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        return;
      }
      
      // Get fresh GPS coordinates
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 // Don't use cached position
          }
        );
      });
      
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get current city
      const cityName = await reverseGeocode(latitude, longitude);
      
      const freshLocationData = {
        lat: latitude,
        lng: longitude,
        city: cityName,
        address: '',
        source: 'fresh-gps-guest',
        timestamp: new Date().toISOString()
      };
      
      // Update localStorage for guest
      localStorage.setItem('userLocation', JSON.stringify(freshLocationData));
      
    } catch (error) {
      // Don't throw error - user might have revoked location permission
    }
  };

  const handleLocationSet = async (locationData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        const response = await fetch('/api/user/location', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(locationData)
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Also update the auth store if possible
          const authStore = useAuthStore.getState();
          if (authStore.user) {
            authStore.setUser({
              ...authStore.user,
              location: locationData,
              hasCompleteLocation: true,
              needsLocationUpdate: false
            });
          }
        } else {
          const errorText = await response.text();
          console.error('❌ App.jsx: API error response:', response.status, errorText);
          
          // Try to parse as JSON for more details
          try {
            const errorJson = JSON.parse(errorText);
            console.error('❌ App.jsx: Detailed error:', errorJson);
          } catch (e) {
            // Not JSON, just log the text
          }
        }
      }
    } catch (error) {
      console.error('❌ App.jsx: Error updating user location:', error);
    }
  };

  useEffect(() => {
    const validateTokenOnLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const isValid = await checkAuth();
          if (!isValid) {
            //('Token validation failed, logging out');
            logout();
          }
        } else {
          // For guest users, also refresh location if they have given permission before
          const hasLocation = localStorage.getItem('userLocation');
          if (hasLocation) {
            try {
              await refreshGuestLocation();
            } catch (error) {
              // Ignore guest location errors
            }
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
        // Retry initialization a few times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          //(`Retrying GAM initialization in ${delay}ms...`);
          setTimeout(() => initGAM(retryCount + 1), delay);
        }
      }
    };

    // Run initializations in parallel
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
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/coaching" element={<CoachingHome />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/shop-checkout" element={<ShopCheckout />} />
                  <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
                  <Route path="/login" element={<Login />} />
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
                  <Route path="/contact" element={<Contact />} />
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

                {/* Global Components */}
                <LocationBanner onLocationSet={handleLocationSet} />
                <CoachProfileCompletionModal />

                <Toaster />
                {process.env.NODE_ENV !== 'production' && <AdDebugger />}
              </Layout>
            </Router>
          </GuestFlowProvider>
        </SocketProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

export default App;
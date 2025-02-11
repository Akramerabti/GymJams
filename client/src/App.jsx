// App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Import global CSS
import './global.css';

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

// Socket Context
import { SocketProvider } from './SocketContext';

const App = () => {
  const { checkAuth, logout, showOnboarding, setShowOnboarding } = useAuthStore();

  useEffect(() => {
    const validateTokenOnLoad = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const isValid = await checkAuth();
          if (!isValid) {
            console.log('Token validation failed, logging out');
            logout();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      }
    };

    validateTokenOnLoad();
  }, [checkAuth, logout]);

  return (
    <SocketProvider>
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

            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
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

          <Toaster />
        </Layout>
      </Router>
    </SocketProvider>
  );
};

export default App;
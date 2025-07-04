import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Coins, Dumbbell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { useCart } from '../../stores/cartStore'; // Import useCart hook
import { usePoints } from '../../hooks/usePoints';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '@/stores/cartStore';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = () => {
  const { user, logout, isTokenValid } = useAuth();
  const { items } = useCart(); // Get cart items from useCart
  const itemCount = useCartStore((state) => state.getItemCount());
  const { balance, fetchPoints } = usePoints();
  const { darkMode, toggleDarkMode } = useTheme(); // Use theme context

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);  const userMenuRef = useRef(null);
  const location = useLocation();

  // Remove local dark mode initialization since it's handled by context

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  // Navigation items based on user role
  const navigationItems = [
    { name: 'Shop', path: '/shop' },
    {
      name:
        getUserrole(user) === 'taskforce' || getUserrole(user) === 'admin'
          ? 'Taskforce Dashboard'
          : 'Gains',
      path:
        getUserrole(user) === 'taskforce' || getUserrole(user) === 'admin'
          ? '/taskforce-dashboard'
          : '/gymbros',
    },
    { name: 'Coaching', path: '/coaching' },
    { name: 'Games', path: '/games' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  // Check token validity on mount
  useEffect(() => {
    if (user && !isTokenValid()) {
      logout();
    }
  }, [user, isTokenValid, logout]);

  // Debounce fetchPoints
  useEffect(() => {
    let debounceTimeout;

    const debouncedFetchPoints = () => {
      if (user) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          fetchPoints();
        }, 500);
      }
    };

    debouncedFetchPoints();

    return () => clearTimeout(debounceTimeout);
  }, [user, fetchPoints]);  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (    <div
      className={`shadow-lg fixed top-0 left-0 right-0 z-[9999] pointer-events-auto ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <div
    className={`max-w-7xl mx-auto px-4 sm:px-6 ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}
  >
    <div className="flex justify-between h-16">
      {/* Logo Section */}
      <div className="flex items-center">
        <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
        <div style={{ maxWidth: '80px', width: '100%' }}>
          <img
            src="/Picture2.png"
            alt="Gymtonic Logo"
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </div>
          <span
            className={`text-xl font-extrabold ${
              darkMode ? 'text-white' : 'text-black'
            }`}
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            GYMTONIC
          </span>
        </Link>
      </div>

      {/* Desktop Navigation Links (Hidden on md screens and below) */}
      <div className="hidden md:flex items-center space-x-2">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`text-sm lg:text-base font-medium transition-colors ${
              darkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-blue-600'
            } ${
              location.pathname === item.path
                ? darkMode
                  ? 'text-gray-300 font-semibold'
                  : 'text-blue-600 font-semibold'
                : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

          {/* Right Section (Points, Cart, User Menu, Mobile Toggle) */}
          <div className="flex items-center space-x-4">
            {/* Points Balance (Logged-in Users Only) */}
            {user && isTokenValid() && (
              <div className="flex items-center space-x-2">
                <Coins
                  className={`h-5 w-5 ${
                    darkMode ? 'text-yellow-300' : 'text-yellow-500'
                  }`}
                />
                <span
                  className={`font-medium text-sm lg:text-base ${
                    darkMode ? 'text-white' : 'text-black'
                  }`}
                >
                  {balance} points
                </span>
              </div>
            )}

            {/* Cart Icon with Badge */}
            <Link
              to="/cart"
              className={`relative ${
                darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'
              } transition-colors`}
            >
              <ShoppingCart
                className={`h-6 w-6 lg:h-7 lg:w-7 ${
                  darkMode ? 'text-white' : 'text-gray-600'
                }`}
              />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.div>
                )}              </AnimatePresence>
            </Link>            {user && isTokenValid() ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`${
                    darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'
                  } transition-colors`}
                >
                  <User
                    className={`h-6 w-6 lg:h-7 lg:w-7 ${
                      darkMode ? 'text-white' : 'text-gray-600'
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg z-20 border border-gray-100"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Orders
                      </Link>                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDarkMode();
                        }}
                        className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span>Dark Mode</span>
                        <div
                          className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${
                            darkMode ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`flex h-3 w-3 transform rounded-full bg-white transition-transform items-center justify-center ${
                              darkMode ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          >
                            {darkMode ? (
                              <Sun className="h-2 w-2 text-yellow-500" />
                            ) : (
                              <Moon className="h-2 w-2 text-gray-600" />
                            )}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>            ) : (
              <div className="flex items-center space-x-3">
                {/* Simple Dark Mode Toggle Button - no slider, no text */}
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
                <Link
                  to="/login"
                  className={`${
                    darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'
                  } px-3 py-2 rounded-md text-sm lg:text-lg font-medium transition-colors`}
                >
                  Login
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle (Visible on md screens and below) */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${
                  darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'
                } transition-colors`}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Links (Visible on md screens and below) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      darkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-blue-600'
                    } transition-colors ${
                      location.pathname === item.path
                        ? darkMode
                          ? 'text-gray-300 font-semibold'
                          : 'text-blue-600 font-semibold'
                        : ''
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Navbar;
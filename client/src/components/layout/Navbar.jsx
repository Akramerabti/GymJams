import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Coins, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import useCartStore from '@/stores/cartStore';
import { usePoints } from '../../hooks/usePoints';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isTokenValid } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { balance, fetchPoints } = usePoints();
  const { darkMode, toggleDarkMode } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

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

  // All original useEffect hooks are preserved.
  useEffect(() => {
    if (user && !isTokenValid()) {
      logout();
    }
  }, [user, isTokenValid, logout]);

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
  }, [user, fetchPoints]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`shadow-lg fixed top-0 left-0 right-0 z-[9999] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`max-w-7xl mx-auto px-2 sm:px-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center h-16">

          {/* ======== Logo Section (Left) ======== */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <img
                src="/Picture2.png"
                alt="Gymtonic Logo"
                className="h-9 w-auto" // Correct size for mobile
              />
              <span
                className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                GYMTONIC
              </span>
            </Link>
          </div>

          {/* ======== Desktop Navigation (Center) ======== */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm lg:text-base font-medium transition-colors px-3 py-2 rounded-md ${
                  location.pathname === item.path
                    ? (darkMode ? 'text-white font-semibold' : 'text-blue-600 font-semibold')
                    : (darkMode ? 'text-gray-300 hover:text-white' : 'text-black hover:text-blue-600')
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* ======== Right Section (Icons & Menus) ======== */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user && isTokenValid() ? (
              // --- Logged-IN User View ---
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <Coins className={`h-5 w-5 ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} />
                  <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-black'}`}>{balance}</span>
                </div>
                <Link to="/cart" className="relative p-1">
                  <ShoppingCart className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-1">
                    <User className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className={`absolute right-0 w-48 mt-2 py-1 rounded-md shadow-lg z-20 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ring-black ring-opacity-5`}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      >
                        <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-500/20" onClick={() => setIsUserMenuOpen(false)}>Profile</Link>
                        <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-500/20" onClick={() => setIsUserMenuOpen(false)}>Orders</Link>
                        <button onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }} className="flex items-center justify-between w-full text-left px-4 py-2 text-sm hover:bg-gray-500/20">
                          <span>Dark Mode</span>
                          <div className={`relative flex h-5 w-9 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} /></div>
                        </button>
                        <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-500/20">Logout</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              // --- Logged-OUT User View ---
              <>
                <Link to="/cart" className="relative p-1">
                  <ShoppingCart className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>
                <button onClick={toggleDarkMode} className="p-2 rounded-full">
                  {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-500" />}
                </button>
                {/* *
                  * FIX: REMOVED `hidden sm:block` and other visibility classes.
                  * This Link is now always visible on all screen sizes when the user is logged out.
                  *
                */}
                <Link to="/login" className={`px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'}`}>
                  Login
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle (Always at the far right) */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className={`p-1 ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div className="md:hidden" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`}
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
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
      <div className={`max-w-7xl mx-auto px-1 sm:px-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center h-16">

          {/* ======== Logo Section (Left) ======== */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-1">
              <img
                src="/Picture2.png"
                alt="Gymtonic Logo"
                className="h-[clamp(1.75rem,4vw,2.5rem)] w-auto"
              />
              <span
                className={`text-[clamp(0.9rem,3.5vw,1.4rem)] font-extrabold ${darkMode ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                GYMTONIC
              </span>
            </Link>
          </div>

          {/* ======== Desktop Navigation (Center) ======== */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-[clamp(0.75rem,1.5vw,1rem)] font-medium transition-colors px-2 py-1 rounded-md ${
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
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user && isTokenValid() ? (
              // --- Logged-IN User View ---
              <>
                <div className="hidden sm:flex items-center space-x-1">
                  <Coins className={`h-[clamp(1rem,2.5vw,1.5rem)] w-[clamp(1rem,2.5vw,1.5rem)] ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} />
                  <span className={`font-medium text-[clamp(0.8rem,1.5vw,1rem)] ${darkMode ? 'text-white' : 'text-black'}`}>{balance}</span>
                </div>
                <Link to="/cart" className="relative p-0.5">
                  <ShoppingCart className={`h-[clamp(1.25rem,3vw,1.75rem)] w-[clamp(1.25rem,3vw,1.75rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.6rem,2vw,0.8rem)] w-[clamp(1.1rem,2.5vw,1.5rem)] h-[clamp(1.1rem,2.5vw,1.5rem)] rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-0.5">
                    <User className={`h-[clamp(1.25rem,3vw,1.75rem)] w-[clamp(1.25rem,3vw,1.75rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className={`absolute right-0 w-44 mt-1 py-0.5 rounded-md shadow-lg z-20 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ring-black ring-opacity-5`}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      >
                        <Link to="/profile" className="block px-3 py-1.5 text-[clamp(0.8rem,1.5vw,0.95rem)] hover:bg-gray-500/20" onClick={() => setIsUserMenuOpen(false)}>Profile</Link>
                        <Link to="/orders" className="block px-3 py-1.5 text-[clamp(0.8rem,1.5vw,0.95rem)] hover:bg-gray-500/20" onClick={() => setIsUserMenuOpen(false)}>Orders</Link>
                        <button onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }} className="flex items-center justify-between w-full text-left px-3 py-1.5 text-[clamp(0.8rem,1.5vw,0.95rem)] hover:bg-gray-500/20">
                          <span>Dark Mode</span>
                          <div className={`relative flex h-4 w-7 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-3' : 'translate-x-0.5'}`} /></div>
                        </button>
                        <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-[clamp(0.8rem,1.5vw,0.95rem)] hover:bg-gray-500/20">Logout</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              // --- Logged-OUT User View ---
              <>
                <Link to="/cart" className="relative p-0.5">
                  <ShoppingCart className={`h-[clamp(1.25rem,3vw,1.75rem)] w-[clamp(1.25rem,3vw,1.75rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.6rem,2vw,0.8rem)] w-[clamp(1.1rem,2.5vw,1.5rem)] h-[clamp(1.1rem,2.5vw,1.5rem)] rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>
                <button onClick={toggleDarkMode} className="p-1 rounded-full">
                  {darkMode ? 
                    <Sun className="h-[clamp(1rem,2.5vw,1.5rem)] w-[clamp(1rem,2.5vw,1.5rem)] text-yellow-400" /> : 
                    <Moon className="h-[clamp(1rem,2.5vw,1.5rem)] w-[clamp(1rem,2.5vw,1.5rem)] text-gray-500" />
                  }
                </button>
                <Link to="/login" className={`px-2 py-1 rounded-md text-[clamp(0.8rem,1.5vw,1rem)] font-medium ${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'}`}>
                  Login
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className={`p-0.5 ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                {isOpen ? 
                  <X className="h-[clamp(1.25rem,3vw,1.75rem)] w-[clamp(1.25rem,3vw,1.75rem)]" /> : 
                  <Menu className="h-[clamp(1.25rem,3vw,1.75rem)] w-[clamp(1.25rem,3vw,1.75rem)]" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div className="md:hidden" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
              <div className="px-1 pt-1 pb-2 space-y-0.5">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-2 py-1.5 rounded-md text-[clamp(0.85rem,2vw,1rem)] font-medium ${darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`}
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
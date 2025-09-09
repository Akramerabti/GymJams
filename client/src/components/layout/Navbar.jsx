import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Coins, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import useCartStore from '@/stores/cartStore';
import { usePoints } from '../../hooks/usePoints';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const countryOptions = [
  { code: 'en', name: 'English', icon: <Globe className="inline h-4 w-4 mr-1" /> },
  { code: 'fr', name: 'Français', icon: <span className="inline mr-1">🇫🇷</span> },
  { code: 'es', name: 'Español', icon: <span className="inline mr-1">🇪🇸</span> },
  { code: 'zh', name: '简体中文', icon: <span className="inline mr-1">🇨🇳</span> },
  // Add more countries/languages as needed
];

const Navbar = () => {
  const { user, logout, isTokenValid } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { balance, fetchPoints } = usePoints();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryOptions[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const location = useLocation();

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

const isTaskforceOrAdmin = () => {
  const role = getUserrole(user);
  return ['taskforce', 'admin', 'marketing'].includes(role);
};

const navigationItems = [
  { name: t('navbar.shop'), path: '/shop' },
  { name: t('navbar.gains'), path: '/gymbros' },
  { name: t('navbar.coaching'), path: '/coaching' },
  { name: t('navbar.games'), path: '/games' },
  ...(isTaskforceOrAdmin()
    ? [{ name: t('navbar.taskforceDashboard'), path: '/taskforce-dashboard' }]
    : [{ name: t('navbar.blog'), path: '/blog' }]
  ),
  { name: t('navbar.contact'), path: '/contact' },
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

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Change language when selectedCountry changes
  useEffect(() => {
    i18n.changeLanguage(selectedCountry.code);
  }, [selectedCountry, i18n]);

  return (
    <div className={`shadow-lg fixed top-0 left-0 right-0 z-[9999] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`max-w-7xl mx-auto px-2 sm:px-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-wrap min-w-0 justify-between items-center h-16 w-full">

          {/* ======== Logo Section (Left) ======== */}
          <div className="flex items-center min-w-0 flex-shrink-0">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-1 min-w-0">
              <img
                src="/Picture2.png"
                alt="Gymtonic Logo"
                className="h-[clamp(1.5rem,5vw,2.5rem)] w-auto min-w-0"
              />
              <span
                className={`text-[clamp(0.9rem,4vw,1.3rem)] font-extrabold truncate ${darkMode ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'Montserrat, sans-serif', maxWidth: '7.5rem' }}
              >
                GYMTONIC
              </span>
            </Link>
          </div>

          {/* ======== Desktop Navigation (Center) ======== */}
          <div className="hidden custom875:flex items-center space-x-2 min-w-0">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-[clamp(0.85rem,2vw,1.1rem)] font-medium transition-colors px-2 py-1 rounded-md truncate ${
                  location.pathname === item.path
                    ? (darkMode ? 'text-white font-semibold' : 'text-blue-600 font-semibold')
                    : (darkMode ? 'text-gray-300 hover:text-white' : 'text-black hover:text-blue-600')
                }`}
                style={{ maxWidth: '6.5rem' }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* ======== Right Section (Icons & Menus) ======== */}
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
            {user && isTokenValid() ? (
              // --- Logged-IN User View ---
              <>
                <div className="hidden sm:flex items-center space-x-1 min-w-0">
                  <Coins className={`h-[clamp(1rem,3vw,1.5rem)] w-[clamp(1rem,3vw,1.5rem)] ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} />
                  <span className={`font-medium text-[clamp(0.9rem,2vw,1rem)] truncate ${darkMode ? 'text-white' : 'text-black'}`}>{balance}</span>
                </div>
                <Link to="/cart" className="relative p-0.5 min-w-0">
                  <ShoppingCart className={`h-[clamp(1.2rem,3vw,1.6rem)] w-[clamp(1.2rem,3vw,1.6rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.6rem,2vw,0.8rem)] w-[clamp(1rem,2vw,1.2rem)] h-[clamp(1rem,2vw,1.2rem)] rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>
                <div className="relative min-w-0" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-0.5 min-w-0">
                    <User className={`h-[clamp(1.2rem,3vw,1.6rem)] w-[clamp(1.2rem,3vw,1.6rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className={`absolute right-0 w-40 mt-1 py-0.5 rounded-md shadow-lg z-20 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ring-black ring-opacity-5`}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      >
                        <Link to="/profile" className="block px-3 py-2 text-[clamp(0.9rem,2vw,1rem)] hover:bg-gray-500/20 truncate" onClick={() => setIsUserMenuOpen(false)}>{t('navbar.profile')}</Link>
                        <Link to="/orders" className="block px-3 py-2 text-[clamp(0.9rem,2vw,1rem)] hover:bg-gray-500/20 truncate" onClick={() => setIsUserMenuOpen(false)}>{t('navbar.orders')}</Link>
                        <button onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }} className="flex items-center justify-between w-full text-left px-3 py-2 text-[clamp(0.9rem,2vw,1rem)] hover:bg-gray-500/20">
                          <span>{t('navbar.darkMode')}</span>
                          <div className={`relative flex h-5 w-9 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0.5'}`} /></div>
                        </button>
                        {/* Country/Language Dropdown in User Menu (moved here, above logout) */}
                        <div className="px-3 py-2">
                          <div className="font-semibold mb-1">{t('navbar.language')}</div>
                          <div className="relative">
                            <button
                              onClick={() => setIsCountryDropdownOpen((v) => !v)}
                              className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                              {selectedCountry.icon}
                              <span className="ml-1">{selectedCountry.name}</span>
                            </button>
                            <AnimatePresence>
                              {isCountryDropdownOpen && (
                                <motion.div
                                  className={`absolute left-0 mt-1 w-28 rounded-md shadow-lg z-30 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ring-black ring-opacity-5`}
                                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                >
                                  {countryOptions.map((option) => (
                                    <button
                                      key={option.code}
                                      onClick={() => {
                                        setSelectedCountry(option);
                                        setIsCountryDropdownOpen(false);
                                        // Do NOT close the user menu here
                                      }}
                                      className={`flex items-center w-full px-2 py-1 text-left hover:bg-gray-500/20 ${selectedCountry.code === option.code ? 'font-semibold' : ''}`}
                                    >
                                      {option.icon}
                                      <span className="ml-1">{option.name}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-[clamp(0.9rem,2vw,1rem)] hover:bg-gray-500/20">{t('navbar.logout')}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              // --- Logged-OUT User View ---
              <>
                <Link to="/cart" className="relative p-1 min-w-0">
                  <ShoppingCart className={`h-[clamp(1.2rem,3vw,1.6rem)] w-[clamp(1.2rem,3vw,1.6rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.6rem,2vw,0.8rem)] w-[clamp(1rem,2vw,1.2rem)] h-[clamp(1rem,2vw,1.2rem)] rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>

                <div className="flex items-center min-w-0">
                  <button onClick={toggleDarkMode} className="rounded-full ml-1 min-w-0">
                    {darkMode ? 
                      <Sun className="h-[clamp(1rem,3vw,1.5rem)] w-[clamp(1rem,3vw,1.5rem)] text-yellow-400" /> : 
                      <Moon className="h-[clamp(1rem,3vw,1.5rem)] w-[clamp(1rem,3vw,1.5rem)] text-gray-500" />
                    }
                  </button>
                  <Link to="/login" className={`px-2 py-1 rounded-md text-[clamp(0.9rem,2vw,1rem)] font-medium truncate ${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'}`} style={{ maxWidth: '6rem' }}>
                    {t('navbar.login')}
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <div className="custom875:hidden flex items-center min-w-0">
              <button onClick={() => setIsOpen(!isOpen)} className={`p-0.5 min-w-0 ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                {isOpen ? 
                  <X className="h-[clamp(1.2rem,3vw,1.6rem)] w-[clamp(1.2rem,3vw,1.6rem)]" /> : 
                  <Menu className="h-[clamp(1.2rem,3vw,1.6rem)] w-[clamp(1.2rem,3vw,1.6rem)]" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="custom875:hidden overflow-hidden w-full"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: { opacity: { duration: 0.15 }, height: { duration: 0.25 } } }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <motion.div
                className="px-1 pt-1 pb-2 space-y-0.5 flex flex-col w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.18 } }}
                exit={{ opacity: 0, transition: { duration: 0.13 } }}
              >
                {navigationItems.map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Link
                      to={item.path}
                      className={`block px-2 py-1 rounded-md text-[clamp(0.9rem,2vw,1rem)] font-medium truncate w-full ${darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`}
                      onClick={() => setIsOpen(false)}
                      style={{ maxWidth: '100%' }}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Navbar;
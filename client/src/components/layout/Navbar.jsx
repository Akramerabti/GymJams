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
      <div className={`max-w-7xl mx-auto px-8 sm:px-14 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center h-16">

          {/* ======== Logo Section (Left) ======== */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-1">
              <img
                src="/Picture2.png"
                alt="Gymtonic Logo"
                className="h-[clamp(2.1rem,5vw,3.1rem)] w-auto"
              />
              <span
                className={`text-[clamp(1.1rem,4vw,1.7rem)] font-extrabold ${darkMode ? 'text-white' : 'text-black'}`}
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
                className={`text-[clamp(0.95rem,2vw,1.25rem)] font-medium transition-colors px-3 py-2 rounded-md ${
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
                  <Coins className={`h-[clamp(1.2rem,3vw,1.8rem)] w-[clamp(1.2rem,3vw,1.8rem)] ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} />
                  <span className={`font-medium text-[clamp(1rem,2vw,1.2rem)] ${darkMode ? 'text-white' : 'text-black'}`}>{balance}</span>
                </div>
                <Link to="/cart" className="relative p-0.5">
                  <ShoppingCart className={`h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.7rem,2vw,1rem)] w-[clamp(1.3rem,2.5vw,1.7rem)] h-[clamp(1.3rem,2.5vw,1.7rem)] rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-0.5">
                    <User className={`h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className={`absolute right-0 w-44 mt-1 py-0.5 rounded-md shadow-lg z-20 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ring-black ring-opacity-5`}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      >
                        <Link to="/profile" className="block px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-gray-500/20" onClick={() => setIsUserMenuOpen(false)}>{t('navbar.profile')}</Link>
                        <Link to="/orders" className="block px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-gray-500/20" onClick={() => setIsUserMenuOpen(false)}>{t('navbar.orders')}</Link>
                        <button onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }} className="flex items-center justify-between w-full text-left px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-gray-500/20">
                          <span>{t('navbar.darkMode')}</span>
                          <div className={`relative flex h-5 w-9 items-center rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0.5'}`} /></div>
                        </button>
                        {/* Country/Language Dropdown in User Menu (moved here, above logout) */}
                        <div className="px-4 py-2">
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
                                  className={`absolute left-0 mt-1 w-32 rounded-md shadow-lg z-30 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ring-black ring-opacity-5`}
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
                                      className={`flex items-center w-full px-3 py-2 text-left hover:bg-gray-500/20 ${selectedCountry.code === option.code ? 'font-semibold' : ''}`}
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
                        <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-gray-500/20">{t('navbar.logout')}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              // --- Logged-OUT User View ---
              <>
                <Link to="/cart" className="relative p-1">
                  <ShoppingCart className={`h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)] ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                  {itemCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.7rem,2vw,1rem)] w-[clamp(1.3rem,2.5vw,1.7rem)] h-[clamp(1.3rem,2.5vw,1.7rem)] rounded-full flex items-center justify-center">{itemCount}</div>}
                </Link>

                <div className="flex items-center">
                  <button onClick={toggleDarkMode} className=" rounded-full ml-1">
                    {darkMode ? 
                      <Sun className="h-[clamp(1.2rem,3vw,1.8rem)] w-[clamp(1.2rem,3vw,1.8rem)] text-yellow-400" /> : 
                      <Moon className="h-[clamp(1.2rem,3vw,1.8rem)] w-[clamp(1.2rem,3vw,1.8rem] text-gray-500" />
                    }
                  </button>
                  <Link to="/login" className={` px-3 py-1.5 rounded-md text-[clamp(1rem,2vw,1.2rem)] font-medium ${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-blue-600'}`}>
                    {t('navbar.login')}
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className={`p-0.5 ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                {isOpen ? 
                  <X className="h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)]" /> : 
                  <Menu className="h-[clamp(1.5rem,3.5vw,2rem)] w-[clamp(1.5rem,3.5vw,2rem)]" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0, transition: { opacity: { duration: 0.15 }, height: { duration: 0.25 } } }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <motion.div
                className="px-1 pt-1 pb-2 space-y-0.5"
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
                      className={`block px-3 py-2 rounded-md text-[clamp(1rem,2vw,1.2rem)] font-medium ${darkMode ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`}
                      onClick={() => setIsOpen(false)}
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
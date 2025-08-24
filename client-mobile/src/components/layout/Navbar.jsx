import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Coins, Globe } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import useCartStore from '@/stores/cartStore';
import { usePoints } from '../../hooks/usePoints';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const countryOptions = [
  { code: 'en', name: 'English', icon: <Globe className="inline h-4 w-4 mr-1" /> },
  { code: 'fr', name: 'Français', icon: <span className="inline mr-1">🇫🇷</span> },
  { code: 'es', name: 'Español', icon: <span className="inline mr-1">🇪🇸</span> },
  { code: 'zh', name: '简体中文', icon: <span className="inline mr-1">🇨🇳</span> },
];

const Navbar = () => {
  const { user, logout, isTokenValid } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { balance, fetchPoints } = usePoints();
  const { t, i18n } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryOptions[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [dynamicBg, setDynamicBg] = useState('transparent');
  const [scrollY, setScrollY] = useState(0);
  
  const userMenuRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const location = useLocation();

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  const isTaskforceOrAdmin = () => {
    const role = getUserrole(user);
    return ['taskforce', 'admin', 'marketing', 'affiliate'].includes(role);
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

  // 🎨 DYNAMIC BACKGROUND COLOR DETECTION (DARK MODE ONLY)
  useEffect(() => {
    const detectBackgroundColor = () => {
      // Get the element behind the navbar
      const elements = document.elementsFromPoint(window.innerWidth / 2, 100);
      
      let backgroundColor = 'transparent';
      let textColor = 'white'; // Always white text for dark mode
      
      for (const element of elements) {
        if (element.tagName === 'HTML' || element.tagName === 'BODY') continue;
        
        const styles = window.getComputedStyle(element);
        const bgColor = styles.backgroundColor;
        
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          // Extract RGB values to determine if background is dark or light
          const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          const rgbaMatch = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
          
          if (rgbMatch || rgbaMatch) {
            const [, r, g, b] = rgbMatch || rgbaMatch;
            
            // Create a semi-transparent version of the detected color
            const alpha = 0.8;
            backgroundColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            textColor = 'white'; // Always white for dark mode
            break;
          }
        }
      }
      
      // Fallback based on current page and scroll position (DARK MODE)
      if (backgroundColor === 'transparent') {
        if (location.pathname === '/') {
          // Home page - gradient based on scroll
          const progress = Math.min(scrollY / 1000, 1);
          if (progress < 0.33) {
            backgroundColor = `rgba(30, 58, 138, ${0.3 + progress * 0.4})`; // Blue
          } else if (progress < 0.66) {
            backgroundColor = `rgba(79, 70, 229, ${0.3 + progress * 0.4})`; // Indigo
          } else {
            backgroundColor = `rgba(126, 34, 206, ${0.3 + progress * 0.4})`; // Purple
          }
        } else {
          // Other pages - dark theme only
          backgroundColor = 'rgba(17, 24, 39, 0.8)'; // Dark gray
        }
        textColor = 'white';
      }
      
      setDynamicBg({ backgroundColor, textColor });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
      detectBackgroundColor();
    };

    // Initial detection
    detectBackgroundColor();
    
    // Listen for scroll and resize events
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', detectBackgroundColor);
    
    // Re-detect when page content changes
    const observer = new MutationObserver(detectBackgroundColor);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', detectBackgroundColor);
      observer.disconnect();
    };
  }, [location.pathname, scrollY]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    i18n.changeLanguage(selectedCountry.code);
  }, [selectedCountry, i18n]);

  // 🎨 DYNAMIC STYLING (DARK MODE ONLY)
  const navbarStyle = {
    backgroundColor: dynamicBg.backgroundColor || 'transparent',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease-in-out',
  };

  const textStyle = {
    color: 'white',
    transition: 'color 0.3s ease-in-out',
  };

  const iconStyle = {
    color: 'white',
    transition: 'color 0.3s ease-in-out',
  };

  return (
    <>
      {/* Safe Area CSS Variables Setup */}
      <style jsx>{`
        :root {
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-right: env(safe-area-inset-right);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
          --safe-area-inset-left: env(safe-area-inset-left);
        }
        
        /* Fallback for devices without safe area support */
        @supports not (padding: env(safe-area-inset-top)) {
          :root {
            --safe-area-inset-top: 0px;
            --safe-area-inset-right: 0px;
            --safe-area-inset-bottom: 0px;
            --safe-area-inset-left: 0px;
          }
        }
        
        .safe-area-navbar {
          padding-top: var(--safe-area-inset-top);
          padding-left: var(--safe-area-inset-left);
          padding-right: var(--safe-area-inset-right);
        }
        
        /* Additional top padding for devices with notches/camera cutouts */
        @media screen and (max-width: 768px) {
          .safe-area-navbar {
            padding-top: max(var(--safe-area-inset-top), 8px);
          }
        }
        
        /* Special handling for iPhone X and newer models */
        @supports (padding: env(safe-area-inset-top)) {
          .safe-area-navbar {
            padding-top: max(var(--safe-area-inset-top), 12px);
          }
        }
        
        /* Handle landscape orientation on phones with notches */
        @media screen and (max-width: 768px) and (orientation: landscape) {
          .safe-area-navbar {
            padding-top: max(var(--safe-area-inset-top), 4px);
            padding-left: max(var(--safe-area-inset-left), 12px);
            padding-right: max(var(--safe-area-inset-right), 12px);
          }
        }
        
        /* Ensure dropdowns don't get cut off by safe areas */
        .safe-area-dropdown {
          max-height: calc(100vh - var(--safe-area-inset-top) - var(--safe-area-inset-bottom) - 100px);
          margin-right: var(--safe-area-inset-right);
        }
      `}</style>
      
      <div 
        className="fixed top-0 left-0 right-0 z-[9999] safe-area-navbar" 
        style={navbarStyle}
      >
        {/* WIDER CONTAINER - Increased from max-w-7xl to max-w-[95vw] */}
        <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8">
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
                  className="text-[clamp(1.1rem,4vw,1.7rem)] font-extrabold text-white"
                  style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                  }}
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
                  className="text-[clamp(0.95rem,2vw,1.25rem)] font-medium transition-all duration-300 px-3 py-2 rounded-md hover:bg-white/10 text-white"
                  style={{
                    fontWeight: location.pathname === item.path ? '600' : '500',
                    textDecoration: location.pathname === item.path ? 'underline' : 'none',
                    textUnderlineOffset: '4px',
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* ======== Right Section (Icons & Menus) ======== */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {user && isTokenValid() ? (
                <>
                  {/* Coins Display */}
                  <div className="hidden sm:flex items-center space-x-1">
                    <Coins 
                      className="h-[clamp(1.2rem,3vw,1.8rem)] w-[clamp(1.2rem,3vw,1.8rem)]" 
                      style={{ color: '#facc15' }} // Always gold/yellow
                    />
                    <span 
                      className="font-medium text-[clamp(1rem,2vw,1.2rem)] text-white"
                    >
                      {balance}
                    </span>
                  </div>

                  {/* Shopping Cart */}
                  <Link to="/cart" className="relative p-0.5 hover:scale-105 transition-transform">
                    <ShoppingCart 
                      className="h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)] text-white" 
                    />
                    {itemCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[clamp(0.7rem,2vw,1rem)] w-[clamp(1.3rem,2.5vw,1.7rem)] h-[clamp(1.3rem,2.5vw,1.7rem)] rounded-full flex items-center justify-center">
                        {itemCount}
                      </div>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                      className="p-0.5 hover:scale-105 transition-transform"
                    >
                      <User 
                        className="h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)] text-white" 
                      />
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          className="absolute right-0 w-44 mt-1 py-0.5 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5 safe-area-dropdown bg-gray-800/90 backdrop-blur-xl"
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Link 
                            to="/profile" 
                            className="block px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-white/10 text-white" 
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {t('navbar.profile')}
                          </Link>
                          <Link 
                            to="/orders" 
                            className="block px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-white/10 text-white" 
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {t('navbar.orders')}
                          </Link>
                          <button 
                            onClick={logout} 
                            className="block w-full text-left px-4 py-2 text-[clamp(1rem,2vw,1.15rem)] hover:bg-red-500/20 text-red-400"
                          >
                            {t('navbar.logout')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  {/* Country Selector */}
                  <div className="relative" ref={countryDropdownRef}>
                    <button 
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)} 
                      className="p-0.5 hover:scale-105 transition-transform"
                    >
                      {selectedCountry.icon}
                    </button>
                    <AnimatePresence>
                      {isCountryDropdownOpen && (
                        <motion.div
                          className="absolute right-0 w-36 mt-1 py-0.5 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5 safe-area-dropdown bg-gray-800/90 backdrop-blur-xl"
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {countryOptions.map((country) => (
                            <button
                              key={country.code}
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsCountryDropdownOpen(false);
                              }}
                              className="flex items-center w-full text-left px-4 py-2 text-[clamp(0.9rem,2vw,1.1rem)] hover:bg-white/10 text-white"
                            >
                              {country.icon} {country.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <div className="md:hidden flex items-center">
                <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className="p-0.5 hover:scale-105 transition-transform"
                >
                  {isOpen ? 
                    <X className="h-[clamp(1.5rem,3.5vw,2.1rem)] w-[clamp(1.5rem,3.5vw,2.1rem)] text-white" /> : 
                    <Menu className="h-[clamp(1.5rem,3.5vw,2rem)] w-[clamp(1.5rem,3.5vw,2rem)] text-white" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="md:hidden overflow-hidden safe-area-dropdown bg-gray-800/90 backdrop-blur-xl"
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
                        className="block px-3 py-2 rounded-md text-[clamp(1rem,2vw,1.2rem)] font-medium hover:bg-white/10 text-white"
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
    </>
  );
};

export default Navbar;
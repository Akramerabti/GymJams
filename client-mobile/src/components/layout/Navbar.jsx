import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ShoppingCart, User, Coins, Store, Dumbbell, Users, Gamepad2, Settings, FileText, MessageCircle, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import useCartStore from '@/stores/cartStore';
import { usePoints } from '../../hooks/usePoints';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, logout, isTokenValid } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { balance, fetchPoints } = usePoints();
  const { t } = useTranslation();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const logoMenuRef = useRef(null);

  const isHomePage = location.pathname === '/';

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  const isTaskforceOrAdmin = () => {
    const role = getUserrole(user);
    return ['taskforce', 'admin', 'marketing', 'affiliate'].includes(role);
  };

  // Icon mapping for navigation items
  const getIconForPath = (path) => {
    switch(path) {
      case '/shop': return Store;
      case '/gymbros': return Dumbbell;
      case '/coaching': return Users;
      case '/games': return Gamepad2;
      case '/taskforce-dashboard': return Settings;
      case '/blog': return FileText;
      case '/contact': return MessageCircle;
      default: return Store;
    }
  };

  // Regular navigation items (non-home pages)
  const navigationItems = [
    { name: t('navbar.shop'), path: '/shop' },
    { name: t('navbar.coaching'), path: '/coaching' },
    { name: t('navbar.gains'), path: '/gymbros' },
    { name: t('navbar.games'), path: '/games' },
    ...(isTaskforceOrAdmin()
      ? [{ name: t('navbar.taskforceDashboard'), path: '/taskforce-dashboard' }]
      : [{ name: t('navbar.blog'), path: '/blog' }]
    ),
  ];

  // Home page profile menu items
  const homeProfileItems = [
    { name: t('navbar.orders'), path: '/orders', icon: FileText, isButton: false },
     { name: t('navbar.profile'), path: '/profile', icon: Settings, isButton: false },
    { name: t('navbar.contact'), path: '/contact', icon: MessageCircle, isButton: false },
    { name: t('navbar.logout'), action: logout, icon: LogOut, isButton: true, isRed: true },
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
      if (logoMenuRef.current && !logoMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Dark Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{ top: 'var(--navbar-height, 80px)' }} // Start below navbar
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        .navbar-container {
          background: transparent;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-bottom: none;
          position: relative;
        }

        .navbar-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: calc(50% - 30px);
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .navbar-container::before {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          width: calc(50% - 30px);
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .hanging-logo {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          transition: all 0.3s ease;
          z-index: 1000;
          cursor: pointer;
        }

        .hanging-logo:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-50%) scale(1.05);
        }

        .curve-left, .curve-right {
          position: absolute;
          bottom: -24px;
          width: 30px;
          height: 25px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-top: none;
          pointer-events: none;
        }

        .curve-left {
          left: calc(50% - 30px);
          border-right: none;
          border-bottom: none;
          border-bottom-left-radius: 40px;
        }

        .curve-right {
          right: calc(50% - 30px);
          border-left: none;
          border-bottom: none;
          border-bottom-right-radius: 40px;
        }

        .safe-area-navbar {
          padding-top: env(safe-area-inset-top, 8px);
          padding-left: env(safe-area-inset-left, 0px);
          padding-right: env(safe-area-inset-right, 0px);
        }

        /* Fixed Circular Navigation Styles - Mobile First with Equal 180° Spacing */
        .cn-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 999;
          width: 280px;
          height: 280px;
          margin-top: -100px;
          margin-left: -140px;
          border-radius: 50%;
          background: transparent;
          opacity: 0;
          transition: all .3s ease;
          transform: scale(0.1);
          pointer-events: none;
        }

        .cn-wrapper.opened-nav {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        .cn-wrapper ul {
          list-style: none;
          padding: 0;
          margin: 0;
          position: relative;
          width: 100%;
          height: 100%;
        }

        .cn-wrapper li {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 50px;
          height: 50px;
          margin-top: -25px;
          margin-left: -25px;
          transition: all 0.3s ease;
          opacity: 0;
        }

        .cn-wrapper.opened-nav li {
          opacity: 1;
        }

        /* Home page profile menu - 4 items in semicircle */
        .cn-wrapper.home-menu.opened-nav li:nth-child(1) { 
          transform: translate(-90px, 10px); /* Profile - Top Left */
        }
        .cn-wrapper.home-menu.opened-nav li:nth-child(2) { 
          transform: translate(-35px, 45px); /* Orders - Top Center */
        }
        .cn-wrapper.home-menu.opened-nav li:nth-child(3) { 
          transform: translate(90px, 10px); /* Contact - Top Right */
        }
        .cn-wrapper.home-menu.opened-nav li:nth-child(4) { 
          transform: translate(35px, 45px); /* Logout - Center (lower) */
        }

        /* Regular navigation menu - 6 items for non-home pages */
        .cn-wrapper.nav-menu.opened-nav li:nth-child(1) { 
          transform: translate(-105px, 0px); /* -90° (Far Left) */
        }
        .cn-wrapper.nav-menu.opened-nav li:nth-child(2) { 
          transform: translate(-60px, 55px); /* -54° (Left) */
        }
        .cn-wrapper.nav-menu.opened-nav li:nth-child(3) { 
          transform: translate(0px, 90px); /* -18° (Center Left) */
        }
        .cn-wrapper.nav-menu.opened-nav li:nth-child(4) { 
          transform: translate(60px, 55px); /* +18° (Center Right) */
        }
        .cn-wrapper.nav-menu.opened-nav li:nth-child(5) { 
          transform: translate(105px, 0px); /* +54° (Right) */
        }


        .cn-wrapper li a, .cn-wrapper li button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 0.55rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        .cn-wrapper li a:hover, .cn-wrapper li button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.1) translateY(-3px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .cn-wrapper li .logout-btn {
          background: rgba(239, 68, 68, 0.85);
          border-color: rgba(239, 68, 68, 0.4);
        }

        .cn-wrapper li .logout-btn:hover {
          background: rgba(239, 68, 68, 1);
          border-color: rgba(239, 68, 68, 0.6);
        }

        .cn-wrapper li a .nav-icon, .cn-wrapper li button .nav-icon {
          margin-bottom: 4px;
        }

        .cn-wrapper li a span, .cn-wrapper li button span {
          font-size: 0.45rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          line-height: 0.9;
          max-width: 45px;
        }

        /* Mobile viewport adjustments */
        @media only screen and (max-width: 480px) {
          .cn-wrapper {
            width: 260px;
            height: 260px;
            margin-top: -90px;
            margin-left: -130px;
          }

          .cn-wrapper li {
            width: 48px;
            height: 48px;
            margin-top: -24px;
            margin-left: -24px;
          }

          .cn-wrapper li a, .cn-wrapper li button {
            width: 48px;
            height: 48px;
            font-size: 0.5rem;
          }

          .cn-wrapper li a .nav-icon, .cn-wrapper li button .nav-icon {
            margin-bottom: 3px;
          }

          .cn-wrapper li a span, .cn-wrapper li button span {
            font-size: 0.4rem;
            max-width: 42px;
            line-height: 0.85;
          }

          /* Home page mobile adjustments */
          .cn-wrapper.home-menu.opened-nav li:nth-child(1) { 
            transform: translate(-80px, -15px);
          }
          .cn-wrapper.home-menu.opened-nav li:nth-child(2) { 
            transform: translate(0px, -95px);
          }
          .cn-wrapper.home-menu.opened-nav li:nth-child(3) { 
            transform: translate(80px, -15px);
          }
          .cn-wrapper.home-menu.opened-nav li:nth-child(4) { 
            transform: translate(0px, 10px);
          }

          /* Regular navigation mobile adjustments */
          .cn-wrapper.nav-menu.opened-nav li:nth-child(1) { 
            transform: translate(-95px, 0px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(2) { 
            transform: translate(-68px, 58px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(3) { 
            transform: translate(0px, 90px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(4) { 
            transform: translate(68px, 58px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(5) { 
            transform: translate(95px, 0px);
          }
        }

        /* Extra small mobile devices */
        @media only screen and (max-width: 360px) {
          .cn-wrapper {
            width: 220px;
            height: 220px;
            margin-top: -80px;
            margin-left: -110px;
          }

          /* Home page extra small mobile */
          .cn-wrapper.home-menu.opened-nav li:nth-child(1) { 
            transform: translate(-70px, -10px);
          }
          .cn-wrapper.home-menu.opened-nav li:nth-child(2) { 
            transform: translate(0px, -80px);
          }
          .cn-wrapper.home-menu.opened-nav li:nth-child(3) { 
            transform: translate(70px, -10px);
          }
          .cn-wrapper.home-menu.opened-nav li:nth-child(4) { 
            transform: translate(0px, 5px);
          }

          /* Regular navigation extra small mobile */
          .cn-wrapper.nav-menu.opened-nav li:nth-child(1) { 
            transform: translate(-80px, 0px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(2) { 
            transform: translate(-57px, 57px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(3) { 
            transform: translate(0px, 80px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(4) { 
            transform: translate(57px, 67px);
          }
          .cn-wrapper.nav-menu.opened-nav li:nth-child(5) { 
            transform: translate(80px, 0px);
          }

          .pt-safe {
  padding-top: max(env(safe-area-inset-top, 0px), 20px);
}
        }
      `}</style>
      
     <div className="fixed top-0 left-0 right-0 z-[9999] safe-area-navbar pt-safe">
        <div className="navbar-container">
          <div className="max-w-[95vw] mx-auto px-4">
            <div className="flex justify-between items-end h-18 ">
              {/* Left Side - Back Arrow (only show on non-home pages) */}
              {!isHomePage && (
                <Link
                  to="/"
                  className="p-2 text-white hover:bg-white/10 rounded-full flex items-center"
                  style={{ minWidth: 40, minHeight: 40 }}
                >
                  <ArrowLeft size={22} />
                </Link>
              )}
              
              {/* Left spacer for home page to center the right side */}
              {isHomePage && (
                <div style={{ minWidth: 40, minHeight: 40 }} />
              )}

              {/* Right Side - Cart and User (different for home vs other pages) */}
              <div className="flex items-center space-x-2">
                {/* Cart - Always show */}
                <Link to="/cart" className="relative p-2 text-white hover:bg-white/10 rounded-full">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {itemCount > 9 ? '9+' : itemCount}
                    </div>
                  )}
                </Link>

                {/* User Menu - Only show on non-home pages */}
                {!isHomePage && (
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                      className="p-2 text-white hover:bg-white/10 rounded-full"
                    >
                      <User size={20} />
                    </button>
                    
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          className="absolute right-0 w-44 mt-2 py-1 rounded-md bg-gray-800/90 backdrop-blur-xl shadow-lg border border-white/10"
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Link 
                            to="/profile" 
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10" 
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {t('navbar.profile')}
                          </Link>
                          <Link 
                            to="/orders" 
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10" 
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {t('navbar.orders')}
                          </Link>
                          <Link 
                            to="/contact" 
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10" 
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            {t('navbar.contact')}
                          </Link>
                          <button 
                            onClick={logout} 
                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                          >
                            {t('navbar.logout')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Hanging Logo - Circular Menu Trigger */}
            <div className="relative" ref={logoMenuRef}>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="hanging-logo"
              >
                {isOpen ? (
                  <X size={20} className="text-white" />
                ) : (
                  <img src="/Picture2.png" alt="Logo" className="w-8 h-8" />
                )}
              </button>

              {/* Circular Navigation Menu */}
              <div className={`cn-wrapper ${isHomePage ? 'home-menu' : 'nav-menu'} ${isOpen ? 'opened-nav' : ''}`}>
                <ul>
                  {isHomePage ? (
                    // Home page profile menu
                    homeProfileItems.map((item, index) => (
                      <li key={item.name}>
                        {item.isButton ? (
                          <button
                            onClick={() => {
                              item.action();
                              setIsOpen(false);
                            }}
                            className={item.isRed ? 'logout-btn' : ''}
                          >
                            <item.icon size={14} className="nav-icon" />
                            <span>{item.name}</span>
                          </button>
                        ) : (
                          <Link
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                          >
                            <item.icon size={14} className="nav-icon" />
                            <span>{item.name}</span>
                          </Link>
                        )}
                      </li>
                    ))
                  ) : (
                    // Regular navigation menu
                    navigationItems.map((item, index) => {
                      const IconComponent = getIconForPath(item.path);
                      return (
                        <li key={item.name}>
                          <Link
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                          >
                            <IconComponent size={14} className="nav-icon" />
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </div>

            {/* Curved borders */}
            <div className="curve-left"></div>
            <div className="curve-right"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
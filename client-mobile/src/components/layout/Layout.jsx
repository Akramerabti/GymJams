import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children, showMobileGatekeeper }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const { darkMode } = useTheme();
  const navbarRef = useRef(null);

  // Hide scrollbars when mobile gatekeeper is shown
  useEffect(() => {
    if (showMobileGatekeeper) {
      // Hide scrollbars on both html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
    } else {
      // Restore normal scrolling when gatekeeper is closed
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
    }

    return () => {
      // Cleanup on unmount
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
    };
  }, [showMobileGatekeeper]);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  useEffect(() => {
    const checkFooterVisibility = () => {
      const hasHideFooterClass = document.body.classList.contains('hide-footer') ||
                                document.documentElement.classList.contains('hide-footer');
      
      const shouldHideFooter = location.pathname === '/' || hasHideFooterClass;
      setShowFooter(!shouldHideFooter);
      
      if (shouldHideFooter) {
        setTimeout(() => {
          const footers = document.querySelectorAll('footer, [role="contentinfo"]');
          footers.forEach(footer => {
            footer.style.display = 'none';
            footer.style.visibility = 'hidden';
            footer.style.height = '0';
            footer.style.overflow = 'hidden';
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
          });
        }, 50);
      }
    };

    checkFooterVisibility();

    const handleFooterHidden = () => setShowFooter(false);
    const handleFooterShown = () => checkFooterVisibility();
    
    window.addEventListener('footerHidden', handleFooterHidden);
    window.addEventListener('footerShown', handleFooterShown);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkFooterVisibility();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('footerHidden', handleFooterHidden);
      window.removeEventListener('footerShown', handleFooterShown);
    };
  }, [location.pathname]);

  // When mobile gatekeeper is shown, return nothing (layout is hidden)
  if (showMobileGatekeeper) {
    return <>{children}</>;
  }

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark-theme' : ''}`}>
      {/* Navbar */}
      <div ref={navbarRef}>
        <Navbar />
      </div>
      
      {/* Main Content */}
      <main className={`flex-grow transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        <div className="w-full max-w-full">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
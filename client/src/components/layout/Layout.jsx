import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const { darkMode } = useTheme();
  
  // Create a ref for the Navbar wrapper
  const navbarRef = useRef(null);

  // This new useEffect hook measures the Navbar's height
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        // Get the height of the navbar element
        const height = navbarRef.current.offsetHeight;
        // Set it as a CSS variable on the root HTML element
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };

    // Run the function on mount and on window resize
    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  // Your existing useEffect for footer visibility
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

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark-theme' : ''}`}>
      {/* Attach the ref to the Navbar's wrapping div */}
      <div ref={navbarRef}>
        <Navbar />
      </div>
      <main className={`flex-grow transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        <div className="w-full max-w-full">
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const { darkMode } = useTheme(); // Use theme context instead of local state
      // Check for routes where footer should be hidden
  useEffect(() => {
    const checkFooterVisibility = () => {
      // Check if body has the hide-footer class
      const hasHideFooterClass = document.body.classList.contains('hide-footer') || 
                                 document.documentElement.classList.contains('hide-footer');
      
      // Hide footer on home page or if body has hide-footer class
      const shouldHideFooter = location.pathname === '/' || hasHideFooterClass;
      setShowFooter(!shouldHideFooter);
      
      // Additional enforcement for mobile devices
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
        }, 50); // Small delay to ensure DOM is ready
      }
    };

    // Initial check
    checkFooterVisibility();

    // Listen for custom events from FooterHider
    const handleFooterHidden = () => setShowFooter(false);
    const handleFooterShown = () => checkFooterVisibility();
    
    window.addEventListener('footerHidden', handleFooterHidden);
    window.addEventListener('footerShown', handleFooterShown);

    // Create a MutationObserver to watch for class changes on body and html
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkFooterVisibility();
        }
      });
    });

    // Start observing both body and html class changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup observer and event listeners
    return () => {
      observer.disconnect();
      window.removeEventListener('footerHidden', handleFooterHidden);
      window.removeEventListener('footerShown', handleFooterShown);
    };
  }, [location.pathname]);

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark-theme' : ''}`}>
      <Navbar />
      <main className={`flex-grow ${darkMode ? 'bg-gray-900 text-gray-100' : ''} ${location.pathname === '/' ? '' : 'pt-16'}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const { darkMode } = useTheme();

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
      <Navbar />
      <main className={`flex-grow transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      } ${location.pathname === '/' ? '' : 'pt-16'}`}>
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
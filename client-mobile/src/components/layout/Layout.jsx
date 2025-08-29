import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, showMobileGatekeeper = false }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const navbarRef = useRef(null);

const shouldHideLayout = showMobileGatekeeper || 
  location.pathname === '/login' ||
  location.pathname === '/complete-oauth-profile' ||
  location.pathname === '/complete-profile';

  // Hide scrollbars when mobile gatekeeper is shown
  useEffect(() => {
    if (shouldHideLayout) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      document.body.classList.add('mobile-gatekeeper-active');
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.classList.remove('mobile-gatekeeper-active');
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.classList.remove('mobile-gatekeeper-active');
    };
  }, [shouldHideLayout]);

  // Force dark mode classes on document
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark', 'bg-gray-900', 'text-white');
  }, []);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current && !shouldHideLayout) {
        const height = navbarRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, [shouldHideLayout]);

  useEffect(() => {
    const checkFooterVisibility = () => {
      const hasHideFooterClass = document.body.classList.contains('hide-footer') ||
                                document.documentElement.classList.contains('hide-footer');
      
      const shouldHideFooter = location.pathname === '/' || hasHideFooterClass || shouldHideLayout;
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
  }, [location.pathname, shouldHideLayout]);

if (shouldHideLayout) {
  return <>{children}</>;  // Just return children directly, no wrapper
}
  return (
    <div className="flex flex-col min-h-screen dark-theme bg-gray-900 text-white">
      <div ref={navbarRef}>
        <Navbar />
      </div>
      
      <main className="flex-grow transition-colors duration-300 bg-gray-900 text-gray-100">
        <div className="w-full max-w-full">
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
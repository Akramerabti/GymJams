import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  
  // Check for routes where footer should be hidden
  useEffect(() => {
    // Check if body has the hide-footer class
    const hasHideFooterClass = document.body.classList.contains('hide-footer');
    setShowFooter(!hasHideFooterClass);

    // For direct path-based hiding (alternative approach)
    // if (location.pathname === '/gymbros') {
    //   setShowFooter(false);
    // } else {
    //   setShowFooter(true);
    // }
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
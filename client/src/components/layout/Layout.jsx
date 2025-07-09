import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const isFullScreenRoute = location.pathname.startsWith('/gymbros-setup') || 
                            location.pathname.startsWith('/questionnaire') ||
                            location.pathname.startsWith('/hidden-games'); 

  React.useEffect(() => {
    if (isFullScreenRoute) {
      document.body.classList.add('overflow-hidden', 'h-screen', 'gymbros-setup-fullscreen');
      document.documentElement.classList.add('overflow-hidden', 'h-screen', 'gymbros-setup-fullscreen');
    } else {
      document.body.classList.remove('overflow-hidden', 'h-screen', 'gymbros-setup-fullscreen');
      document.documentElement.classList.remove('overflow-hidden', 'h-screen', 'gymbros-setup-fullscreen');
    }
    return () => {
      document.body.classList.remove('overflow-hidden', 'h-screen', 'gymbros-setup-fullscreen');
      document.documentElement.classList.remove('overflow-hidden', 'h-screen', 'gymbros-setup-fullscreen');
    };
  }, [isFullScreenRoute]); 

  return (

    <div className="flex flex-col min-h-screen bg-background text-foreground font-gym">
      <Navbar />

      <main className={`flex-grow pt-16 sm:pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8 ${isFullScreenRoute ? 'p-0 pt-0' : ''}`}>
        {children}
      </main>


      {!isFullScreenRoute && <Footer />}
    </div>
  );
};

export default Layout;
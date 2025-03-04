import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const [showFooter, setShowFooter] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark-mode', savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark-mode', prefersDark);
    }
  }, []);
  
  // Check for routes where footer should be hidden
  useEffect(() => {
    // Check if body has the hide-footer class
    const hasHideFooterClass = document.body.classList.contains('hide-footer');
    setShowFooter(!hasHideFooterClass);
  }, [location.pathname]);

  // Make darkMode state available to all components via window object
  useEffect(() => {
    window.toggleDarkMode = (value) => {
      const newDarkMode = typeof value === 'boolean' ? value : !darkMode;
      setDarkMode(newDarkMode);
      localStorage.setItem('siteTheme', newDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode', newDarkMode);
    };
  }, [darkMode]);

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark-theme' : ''}`}>
      <Navbar />
      <main className={`flex-grow ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
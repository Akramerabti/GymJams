import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme changes to document
  useEffect(() => {
    const applyTheme = (isDark) => {
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('dark-mode', isDark);
      
      // Update CSS custom properties for immediate theme application
      if (isDark) {
        document.documentElement.style.setProperty('--bg-primary', '#1f2937');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
      } else {
        document.documentElement.style.setProperty('--bg-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#000000');
      }
    };

    // Apply theme immediately
    applyTheme(darkMode);
    
    // Save to localStorage
    localStorage.setItem('siteTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Initialize theme on component mount to prevent flash
  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      setDarkMode(isDark);
    }
  }, []);

  const toggleDarkMode = (value) => {
    const newDarkMode = typeof value === 'boolean' ? value : !darkMode;
    setDarkMode(newDarkMode);
  };

  // Make toggle function available globally for backward compatibility
  useEffect(() => {
    window.toggleDarkMode = toggleDarkMode;
  }, [darkMode]);

  const value = {
    darkMode,
    setDarkMode,
    toggleDarkMode
  };
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { useTheme, ThemeProvider };

import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Always force dark mode - no light mode option
  const darkMode = true;

  useEffect(() => {
    // Force dark mode classes on document and body
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    
    document.body.classList.add('dark', 'bg-gray-900', 'text-white');
    document.body.classList.remove('light', 'bg-white', 'text-black');
    
    // Set CSS custom properties for consistent dark theme
    document.documentElement.style.setProperty('--bg-primary', '#111827'); // gray-900
    document.documentElement.style.setProperty('--bg-secondary', '#1f2937'); // gray-800
    document.documentElement.style.setProperty('--text-primary', '#ffffff');
    document.documentElement.style.setProperty('--text-secondary', '#d1d5db'); // gray-300
    document.documentElement.style.setProperty('--border-color', '#374151'); // gray-700
    
    // Add dark theme to localStorage permanently
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('darkMode', 'true');
    
    // Remove any light theme preferences
    localStorage.removeItem('lightMode');
    
    // Force dark theme preference
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      // Override any system preference detection
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Dummy function since we don't allow theme toggling
  const toggleDarkMode = () => {
    console.log('Theme toggling is disabled - dark mode only');
    // Do nothing - theme is locked to dark mode
  };

  const value = {
    darkMode: true,
    toggleDarkMode,
    theme: 'dark',
    // Legacy support for existing code
    isDark: true,
    isLight: false,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="dark-theme bg-gray-900 text-white min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
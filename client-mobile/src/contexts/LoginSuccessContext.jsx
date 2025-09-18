// LoginSuccessContext.jsx - New file to create
import React, { createContext, useContext, useState, useCallback } from 'react';

const LoginSuccessContext = createContext();

export const LoginSuccessProvider = ({ children }) => {
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  
  const triggerLoginSuccess = useCallback(() => {
    setShowLoginSuccess(true);
  }, []);
  
  const clearLoginSuccess = useCallback(() => {
    setShowLoginSuccess(false);
  }, []);
  
  return (
    <LoginSuccessContext.Provider value={{ 
      showLoginSuccess, 
      triggerLoginSuccess, 
      clearLoginSuccess 
    }}>
      {children}
    </LoginSuccessContext.Provider>
  );
};

export const useLoginSuccess = () => {
  const context = useContext(LoginSuccessContext);
  if (!context) {
    throw new Error('useLoginSuccess must be used within a LoginSuccessProvider');
  }
  return context;
};
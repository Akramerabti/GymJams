import React from 'react';

export const Alert = ({ children, className = '' }) => {
  return (
    <div className={`rounded-md p-4 ${className}`} role="alert">
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => {
  return <div className="text-sm">{children}</div>;
};
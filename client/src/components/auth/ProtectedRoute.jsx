import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const { user, checkAuth, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true; // Track if the component is still mounted

    const verify = async () => {
      await checkAuth();
      if (isMounted) {
        setIsChecking(false);
      }
    };

    verify();

    return () => {
      isMounted = false; // Cleanup function to prevent state updates on unmounted component
    };
  }, []); // Empty dependency array to run only once

  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
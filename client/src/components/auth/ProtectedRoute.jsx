import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const { user, checkAuth, loading, logout, isTokenValid } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate(); // Add this line to use the navigate function

  useEffect(() => {
    const validateAuth = async () => {
      if (!user || !isTokenValid()) {
        await logout();
        navigate('/login', { state: { from: location }, replace: true });
      } else {
        setIsChecking(false);
      }
    };

    validateAuth();
  }, [user, isTokenValid, logout, navigate, location]);

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
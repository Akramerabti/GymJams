import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const { user, loading, logout, isTokenValid } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const validateAuth = async () => {
      if (!user || !isTokenValid()) {
        await logout();
        
        // Dispatch logout event for mobile gatekeeper
        window.dispatchEvent(new Event('user-logout'));
        
        // For desktop, navigate to login
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
          navigate('/login', { state: { from: location }, replace: true });
        }
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
    // For mobile, the gatekeeper will handle authentication
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      return null; // The mobile gatekeeper will show
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
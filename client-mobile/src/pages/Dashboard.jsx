import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation  } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import DashboardUser from './Dashboard/Dashboard.user';
import DashboardCoach from './Dashboard/Dashboard.coach';
import { toast } from 'sonner';
import subscriptionService from '../services/subscription.service';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      setLoading(true);
      try {

        if (user) {
          setHasAccess(true);
          return;
        }

        // If no logged-in user, check for access token in the state, URL, or localStorage
        const accessToken = location.state?.accessToken || // Check state
                           new URLSearchParams(location.search).get('accessToken') || // Check URL query params
                           localStorage.getItem('accessToken'); // Check localStorage

        if (!accessToken) {
          toast.error('Please log in or provide an access token');
          navigate('/coaching');
          return;
        }

        // Verify access token and subscription
        try {
          const response = await subscriptionService.verifyAccessToken(accessToken);
          if (response.success) {
            setHasAccess(true);
            localStorage.setItem('accessToken', accessToken); // Store the access token in localStorage
          } else {
            toast.error('Invalid access token');
            localStorage.removeItem('accessToken');
            navigate('/coaching');
          }
        } catch (error) {
          console.error('Access token verification failed:', error);
          toast.error('Access token verification failed');
          localStorage.removeItem('accessToken');
          navigate('/coaching');
        }

      } catch (error) {
        console.error('Dashboard access error:', error);
        toast.error('Error accessing dashboard');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [user, navigate, location.state, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Let the useEffect handle redirection
  }

  if (user) {
  return (user?.role || user?.user.role) === 'coach' ? <DashboardCoach /> : <DashboardUser />;
  }

  return <DashboardUser />;

};

export default Dashboard;
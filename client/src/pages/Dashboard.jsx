// components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import DashboardUser from './Dashboard/Dashboard.user';
import DashboardCoach from './Dashboard/Dashboard.coach';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAccess = () => {
      setLoading(true);
      try {
        if (!user) {
          toast.error('Please log in to access the dashboard');
          navigate('/login');
          return;
        }
        
        // Validate user has required role
        if (!['user', 'coach'].includes((user.user.role || user.role))) {
          console.error('Invalid user role:', user);
          navigate('/');
          return;
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
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  return (user?.user.role || user?.user.role) === 'coach' ? <DashboardCoach /> : <DashboardUser />;
};

export default Dashboard;
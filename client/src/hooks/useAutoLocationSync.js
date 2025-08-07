import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import gymBrosLocationService from '../services/gymBrosLocation.service';

/**
 * Custom hook for automatic location syncing like Snapchat
 * This keeps the user's location automatically updated in real-time
 */
export const useAutoLocationSync = () => {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Starting auto location sync for authenticated user');
      
      // Start automatic location syncing
      const userData = user.user || user;
      gymBrosLocationService.startAutoLocationSync(userData, userData.phone);

      // Cleanup when component unmounts or user logs out
      return () => {
        console.log('🛑 Stopping auto location sync');
        gymBrosLocationService.stopAutoLocationSync();
      };
    } else {
      // Stop auto sync if user logs out
      gymBrosLocationService.stopAutoLocationSync();
    }
  }, [isAuthenticated, user]);

  // Return current location sync status
  return {
    isActive: isAuthenticated && !!user && !!gymBrosLocationService.locationSyncInterval
  };
};

export default useAutoLocationSync;

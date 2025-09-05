import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../stores/authStore';
import { useLocation } from 'react-router-dom';

const LocationBanner = ({ onLocationSet }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationCity, setLocationCity] = useState('');
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Never show location banner on conversion landing page
    if (location.pathname === '/') {
      setIsVisible(false);
      return;
    }

    const hasLocation = localStorage.getItem('userLocation');
    const bannerDismissed = localStorage.getItem('locationBannerDismissed'); // Legacy support
    const bannerRejectedData = localStorage.getItem('locationBannerRejected');
    
    // Migrate legacy users: If they permanently dismissed before, convert to 24h rejection
    if (bannerDismissed && !bannerRejectedData) {
      const rejection = {
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem('locationBannerRejected', JSON.stringify(rejection));
      localStorage.removeItem('locationBannerDismissed'); // Clean up legacy
    }
    
    // Check if rejection has expired 
    let bannerRejected = false;
    if (bannerRejectedData) {
      try {
        const rejection = JSON.parse(bannerRejectedData);
        bannerRejected = Date.now() < rejection.expiresAt;
        
        // Clean up expired rejection
        if (!bannerRejected) {
          localStorage.removeItem('locationBannerRejected');
        }
      } catch (e) {
        localStorage.removeItem('locationBannerRejected');
      }
    }
    
    // Auto-fetch location if user has given permission before (for guests and users)
    const checkAndFetchLocation = async () => {
      if (hasLocation && navigator.geolocation) {
        try {
          // Try to get current position to check if permission is still granted
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0 // Force fresh reading
              }
            );
          });

          const { latitude, longitude } = position.coords;
          const cityName = await reverseGeocode(latitude, longitude);

          const freshLocationData = {
            lat: latitude,
            lng: longitude,
            city: cityName,
            address: '',
            source: 'auto-refresh',
            timestamp: new Date().toISOString()
          };

          // Update localStorage
          localStorage.setItem('userLocation', JSON.stringify(freshLocationData));
          
          // Call parent callback if available
          onLocationSet?.(freshLocationData);
          
          return true; // Location successfully updated
        } catch (error) {
          return false; // Location fetch failed
        }
      }
      return false;
    };

    // Execute the location check
    checkAndFetchLocation().then((locationFetched) => {
      const userNeedsLocation = user ? user.needsLocationUpdate : !hasLocation;
      const shouldShow = userNeedsLocation && 
                        !locationFetched && 
                        !isDismissed && 
                        !bannerRejected;
      
      if (shouldShow) {
        // Reset success state when showing banner again
        setLocationSuccess(false);
        setLocationCity('');
        
        setTimeout(() => setIsVisible(true), 2000);
      }
    });
  }, [isDismissed, user, onLocationSet, location.pathname]);

  const getCurrentLocation = async () => {
  setIsGettingLocation(true);

  try {
    // Import the enhanced service at the top of the file
    const { default: enhancedGymBrosLocationService } = await import('../../services/gymBrosLocation.service');
    
    const location = await enhancedGymBrosLocationService.getCurrentLocation({
      priority: 'balanced'
    });
    
    // Store in localStorage
    localStorage.setItem('userLocation', JSON.stringify(location));
    
    // Call parent callback
    onLocationSet?.(location);

    setLocationCity(location.city || 'Your location');
    setLocationSuccess(true);

    setTimeout(() => {
      setIsVisible(false);
    }, 2000);

  } catch (error) {
    console.error('Location error:', error);
    
    if (error.code === 1) {
      toast.error('Location access denied');
    } else if (error.code === 3) {
      toast.error('Location request timed out');
    } else {
      toast.error('Could not get your location');
    }
    
    setIsVisible(false);
  } finally {
    setIsGettingLocation(false);
  }
};

  // Reverse geocode coordinates to get city name
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.city || data.locality || data.principalSubdivision || 'Unknown City';
      }
      
      return 'Unknown City';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown City';
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // For ALL users (including guests): Set rejection flag with 24-hour expiration
    // Location is important for the coaching matching system for everyone
    const rejection = {
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    localStorage.setItem('locationBannerRejected', JSON.stringify(rejection));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-72 max-w-[calc(100vw-1.5rem)] md:left-auto md:right-3 md:transform-none md:translate-x-0 md:max-w-xs z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                Find Nearby Coaches
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}


          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
            >
              {isGettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  <span>Getting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3" />
                  <span>Allow</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Later
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <AlertCircle className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Privacy protected
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationBanner;

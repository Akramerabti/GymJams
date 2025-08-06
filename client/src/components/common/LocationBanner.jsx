import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../stores/authStore';

const LocationBanner = ({ onLocationSet }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
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
  }, [isDismissed, user, onLocationSet]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000 // Cache for 10 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const cityName = await reverseGeocode(latitude, longitude);

      const locationData = {
        lat: latitude,
        lng: longitude,
        city: cityName,
        address: '', // Don't store full address
        source: 'gps',
        timestamp: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      // Call parent callback
      onLocationSet?.(locationData);
      
      // Hide banner immediately after setting location
      setIsVisible(false);

    } catch (error) {
      console.error('Geolocation error:', error);
      let errorMessage = 'Unable to get your location';
      
      if (error.code === 1) {
        errorMessage = 'Please allow location access in your browser settings';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out';
      }
      
      toast.error(errorMessage);
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
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Find Nearby Coaches
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Share your location to discover the best coaches and trainers in your area. We only show your city, never your exact location.
          </p>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
            >
              {isGettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Getting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Allow Location</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center space-x-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <AlertCircle className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Your privacy is protected. We never share exact coordinates.
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationBanner;

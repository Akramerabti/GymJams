import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';
import locationService from '../../services/location.service';

const LocationRequestModal = ({ isOpen, onClose, onLocationSet, title = "Enable Location Access" }) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationCity, setLocationCity] = useState('');
  const [error, setError] = useState('');

  // Reset success state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocationSuccess(false);
      setLocationCity('');
      setIsGettingLocation(false);
      setError('');
    }
  }, [isOpen]);

  // Handle automatic location detection (IP-based, no popup)
  const handleAutoDetect = async () => {
    setIsGettingLocation(true);
    setError('');

    try {
      const locationData = await locationService.getLocationByIP();
      
      if (locationData) {
        handleLocationSuccess(locationData);
      } else {
        throw new Error('Unable to detect location automatically');
      }
    } catch (error) {
      console.error('Auto location detection failed:', error);
      setError('Auto-detection failed. Try using precise location instead.');
      toast.error('Auto-detection failed');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle GPS location (with popup)
  const handleGPSLocation = async () => {
    setIsGettingLocation(true);
    setError('');

    try {
      const locationData = await locationService.getLocationByGPS();
      handleLocationSuccess(locationData);
    } catch (error) {
      console.error('GPS location failed:', error);
      let errorMessage = 'Unable to get your precise location';
      
      if (error.message.includes('denied')) {
        errorMessage = 'Location access denied. Try auto-detect instead.';
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'Location unavailable. Try auto-detect instead.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Try auto-detect instead.';
      }
      
      setError(errorMessage);
      toast.error('GPS location failed');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle successful location detection
  const handleLocationSuccess = (locationData) => {
    // Store in localStorage for guests
    locationService.storeLocation(locationData);
    
    // Call parent callback
    onLocationSet?.(locationData);
    
    // Show success state with city name
    setLocationCity(locationData.city);
    setLocationSuccess(true);
    
    // Auto-close after showing success animation
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const getCurrentLocation = async () => {
    return handleGPSLocation();
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      console.log('🌍 LocationRequestModal: Starting reverse geocoding:', { lat, lng });
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        const city = data.city || data.locality || data.principalSubdivision || 'Unknown City';
        console.log('🏙️ LocationRequestModal: Reverse geocoding successful:', { 
          lat, lng, city, 
          rawData: { 
            city: data.city, 
            locality: data.locality, 
            principalSubdivision: data.principalSubdivision 
          } 
        });
        return city;
      }
      
      console.warn('⚠️ LocationRequestModal: Reverse geocoding API response not OK:', response.status);
      return 'Unknown City';
    } catch (error) {
      console.error('❌ LocationRequestModal: Reverse geocoding error:', error);
      return 'Unknown City';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white relative rounded-t-xl">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2 pr-8">
              <MapPin className="w-5 h-5" />
              <h3 className="font-semibold text-sm">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {locationSuccess ? (
              /* Success State */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <motion.h4
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg font-semibold text-gray-800 dark:text-white mb-1"
                >
                  Location Set!
                </motion.h4>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  {locationCity}
                </motion.p>
              </motion.div>
            ) : (
              /* Default State */
              <>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Share your location to connect with nearby coaches and improve your experience. We only store your city, never your exact location.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleAutoDetect}
                    disabled={isGettingLocation}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Detect Automatically (No Popup)</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleGPSLocation}
                    disabled={isGettingLocation || !navigator.geolocation}
                    className="w-full border-2 border-blue-300 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Use Precise Location</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full py-2 px-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Privacy Note */}
                <div className="flex items-center space-x-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <AlertCircle className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Your privacy is protected. We never share exact coordinates.
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationRequestModal;

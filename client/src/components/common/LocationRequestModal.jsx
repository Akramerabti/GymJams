import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const LocationRequestModal = ({ isOpen, onClose, onLocationSet, title = "Enable Location Access" }) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationCity, setLocationCity] = useState('');

  // Reset success state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocationSuccess(false);
      setLocationCity('');
      setIsGettingLocation(false);
    }
  }, [isOpen]);

  const getCurrentLocation = async () => {
    console.log('🗺️ LocationRequestModal: Starting location request...');
    setIsGettingLocation(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      console.log('📡 LocationRequestModal: Requesting GPS coordinates...');
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 LocationRequestModal: GPS coordinates received:', { lat: latitude, lng: longitude });

      // Reverse geocode to get city name
      console.log('🌍 LocationRequestModal: Starting reverse geocoding...');
      const cityName = await reverseGeocode(latitude, longitude);
      console.log('🏙️ LocationRequestModal: City name resolved:', cityName);

      const locationData = {
        lat: latitude,
        lng: longitude,
        city: cityName,
        address: '',
        source: 'gps',
        timestamp: new Date().toISOString()
      };

      console.log('📍 LocationRequestModal: Location data prepared:', {
        locationData,
        source: 'GPS',
        coordinates: { lat: latitude, lng: longitude },
        city: cityName
      });

      // Store in localStorage for guests
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      console.log('🔄 LocationRequestModal: Calling onLocationSet callback...');
      // Call parent callback
      onLocationSet?.(locationData);
      
      // Show success state with city name
      setLocationCity(cityName);
      setLocationSuccess(true);
      
      // Auto-close after showing success animation
      setTimeout(() => {
        onClose();
      }, 2000);

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
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>Allow Location Access</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full py-2 px-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationRequestModal;

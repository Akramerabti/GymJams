import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Shield, 
  Target, 
  X, 
  Navigation,
  Search,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const LocationRequestModal = ({ 
  isOpen, 
  onClose, 
  onLocationProvided, 
  title = "Find Nearby Coaches",
  subtitle = "Get matched with certified trainers in your area",
  isForCoaching = true 
}) => {
  const [step, setStep] = useState('request'); // request, manual, loading, success
  const [location, setLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');

  // Benefits shown to encourage location sharing
  const benefits = [
    {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      title: "Perfect Match",
      description: "Find coaches within your preferred distance"
    },
    {
      icon: <Users className="w-5 h-5 text-green-500" />,
      title: "Local Community",
      description: "Connect with trainers who know your area"
    },
    {
      icon: <Shield className="w-5 h-5 text-purple-500" />,
      title: "Privacy Protected",
      description: "We only show your city, never your exact location"
    }
  ];

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setError('');

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
        source: 'gps'
      };

      setLocation(locationData);
      setStep('success');

      // Store in localStorage for guests
      localStorage.setItem('userLocation', JSON.stringify(locationData));

      setTimeout(() => {
        onLocationProvided(locationData);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Geolocation error:', error);
      let errorMessage = 'Unable to get your location. ';
      
      if (error.code === 1) {
        errorMessage += 'Please allow location access and try again.';
      } else if (error.code === 2) {
        errorMessage += 'Location unavailable. Try entering manually.';
      } else if (error.code === 3) {
        errorMessage += 'Request timed out. Try entering manually.';
      } else {
        errorMessage += 'Try entering your location manually.';
      }
      
      setError(errorMessage);
      toast.error('Location access failed');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Reverse geocode coordinates to get city name
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using a simple approach - in production, you'd use Google Maps or Mapbox API
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

  // Handle manual location entry
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;

    setIsGettingLocation(true);
    setError('');

    try {
      // Simple geocoding (in production, use proper geocoding service)
      const locationData = {
        lat: null,
        lng: null,
        city: manualLocation.trim(),
        address: manualLocation.trim(),
        source: 'manual'
      };

      setLocation(locationData);
      setStep('success');

      // Store in localStorage for guests
      localStorage.setItem('userLocation', JSON.stringify(locationData));

      setTimeout(() => {
        onLocationProvided(locationData);
        onClose();
      }, 1500);

    } catch (error) {
      setError('Unable to process location. Please try again.');
      toast.error('Location processing failed');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Skip location (for now)
  const handleSkip = () => {
    onLocationProvided(null);
    onClose();
  };

  const renderRequestStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Benefits */}
      <div className="space-y-4 mb-6">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            {benefit.icon}
            <div>
              <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
        >
          {isGettingLocation ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Getting Location...</span>
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              <span>Use My Current Location</span>
            </>
          )}
        </button>

        <button
          onClick={() => setStep('manual')}
          className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:border-gray-400 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span>Enter Location Manually</span>
        </button>

        <button
          onClick={handleSkip}
          className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );

  const renderManualStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Location</h2>
        <p className="text-gray-600">Type your city or area to find nearby coaches</p>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
            placeholder="e.g. New York, NY or Los Angeles"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setStep('request')}
            className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:border-gray-400 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!manualLocation.trim() || isGettingLocation}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
          >
            {isGettingLocation ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
      >
        <MapPin className="w-8 h-8 text-white" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Set!</h2>
      <p className="text-gray-600 mb-4">
        {location?.city && `We'll find the best coaches near ${location.city}`}
      </p>
      
      <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-gray-500">Finding your perfect match...</span>
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {step === 'request' && renderRequestStep()}
            {step === 'manual' && renderManualStep()}
            {step === 'success' && renderSuccessStep()}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationRequestModal;
